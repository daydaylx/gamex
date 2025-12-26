"""Question Widgets for different question types."""
from __future__ import annotations

from typing import Callable, Any, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.slider import Slider
from kivy.uix.gridlayout import GridLayout
from kivy.graphics import Color, Rectangle


class BaseQuestionWidget(BoxLayout):
    """Base widget for all question types."""

    def __init__(self, question: dict, initial_value: Any = None, on_change: Optional[Callable] = None, **kwargs):
        """
        Initialize base question widget.

        Args:
            question: Question data dict
            initial_value: Initial answer value
            on_change: Callback when answer changes
        """
        super().__init__(orientation='vertical', spacing=15, **kwargs)

        self.question = question
        self.on_change_callback = on_change
        self.current_value = initial_value

        # Question label
        self.question_label = Label(
            text=question.get('label', ''),
            size_hint_y=None,
            height=80,
            font_size='18sp',
            halign='left',
            valign='top',
            text_size=(None, None),
            markup=True,
        )
        self.add_widget(self.question_label)

        # Help text (optional)
        help_text = question.get('help', '')
        if help_text:
            self.help_label = Label(
                text=f'[color=666666][size=14sp]{help_text}[/size][/color]',
                size_hint_y=None,
                height=50,
                halign='left',
                valign='top',
                text_size=(None, None),
                markup=True,
            )
            self.add_widget(self.help_label)

    def on_size(self, *args):
        """Update text_size when widget resizes."""
        if hasattr(self, 'question_label'):
            self.question_label.text_size = (self.width - 20, None)
            self.question_label.height = max(80, self.question_label.texture_size[1] + 20)

        if hasattr(self, 'help_label'):
            self.help_label.text_size = (self.width - 20, None)
            self.help_label.height = max(50, self.help_label.texture_size[1] + 20)

    def get_value(self) -> Any:
        """Get current answer value."""
        return self.current_value

    def set_value(self, value: Any):
        """Set answer value."""
        self.current_value = value

    def trigger_change(self, value: Any):
        """Trigger on_change callback."""
        self.current_value = value
        if self.on_change_callback:
            self.on_change_callback(value)


class ScaleQuestionWidget(BaseQuestionWidget):
    """Widget for scale questions (0-10)."""

    def __init__(self, question: dict, initial_value: Any = None, on_change: Optional[Callable] = None, **kwargs):
        super().__init__(question, initial_value, on_change, **kwargs)

        # Value display
        self.value_label = Label(
            text=str(initial_value) if initial_value is not None else '5',
            size_hint_y=None,
            height=60,
            font_size='32sp',
            bold=True,
            color=(0.2, 0.6, 0.8, 1),
        )
        self.add_widget(self.value_label)

        # Slider
        slider_value = float(initial_value) if initial_value is not None else 5.0
        self.slider = Slider(
            min=0,
            max=10,
            value=slider_value,
            step=1,
            size_hint_y=None,
            height=60,
        )
        self.slider.bind(value=self._on_slider_change)
        self.add_widget(self.slider)

        # Scale labels
        scale_layout = BoxLayout(size_hint_y=None, height=30)
        scale_layout.add_widget(Label(text='0', font_size='14sp', color=(0.5, 0.5, 0.5, 1)))
        scale_layout.add_widget(Label(text='5', font_size='14sp', color=(0.5, 0.5, 0.5, 1)))
        scale_layout.add_widget(Label(text='10', font_size='14sp', color=(0.5, 0.5, 0.5, 1)))
        self.add_widget(scale_layout)

        # Set initial value
        if initial_value is not None:
            self.current_value = int(initial_value)

    def _on_slider_change(self, instance, value):
        """Handle slider value change."""
        int_value = int(value)
        self.value_label.text = str(int_value)
        self.trigger_change(int_value)

    def get_value(self) -> int:
        """Get current scale value."""
        return int(self.slider.value)


class TextQuestionWidget(BaseQuestionWidget):
    """Widget for text questions."""

    def __init__(self, question: dict, initial_value: Any = None, on_change: Optional[Callable] = None, **kwargs):
        super().__init__(question, initial_value, on_change, **kwargs)

        # Text input
        self.text_input = TextInput(
            text=str(initial_value) if initial_value else '',
            multiline=True,
            size_hint_y=None,
            height=150,
            font_size='16sp',
            hint_text='Deine Antwort hier eingeben...',
        )
        self.text_input.bind(text=self._on_text_change)
        self.add_widget(self.text_input)

        # Character count
        self.char_count_label = Label(
            text=f'{len(self.text_input.text)} Zeichen',
            size_hint_y=None,
            height=30,
            font_size='12sp',
            halign='right',
            color=(0.5, 0.5, 0.5, 1),
        )
        self.add_widget(self.char_count_label)

    def _on_text_change(self, instance, value):
        """Handle text change."""
        self.char_count_label.text = f'{len(value)} Zeichen'
        self.trigger_change(value)

    def get_value(self) -> str:
        """Get current text value."""
        return self.text_input.text


class EnumQuestionWidget(BaseQuestionWidget):
    """Widget for enum (multiple choice) questions."""

    def __init__(self, question: dict, initial_value: Any = None, on_change: Optional[Callable] = None, **kwargs):
        super().__init__(question, initial_value, on_change, **kwargs)

        self.options = question.get('options', [])
        self.selected_option = initial_value
        self.option_buttons = []

        # Options grid
        options_layout = BoxLayout(
            orientation='vertical',
            spacing=10,
            size_hint_y=None,
        )
        options_layout.bind(minimum_height=options_layout.setter('height'))

        for option in self.options:
            btn = Button(
                text=option,
                size_hint_y=None,
                height=60,
                font_size='16sp',
                halign='center',
            )

            # Style selected button
            if option == initial_value:
                btn.background_color = (0.2, 0.6, 0.8, 1)
            else:
                btn.background_color = (0.9, 0.9, 0.9, 1)
                btn.color = (0.2, 0.2, 0.2, 1)

            btn.bind(on_press=lambda b, opt=option: self._on_option_select(opt))
            self.option_buttons.append(btn)
            options_layout.add_widget(btn)

        self.add_widget(options_layout)

    def _on_option_select(self, option: str):
        """Handle option selection."""
        self.selected_option = option

        # Update button styles
        for btn in self.option_buttons:
            if btn.text == option:
                btn.background_color = (0.2, 0.6, 0.8, 1)
                btn.color = (1, 1, 1, 1)
            else:
                btn.background_color = (0.9, 0.9, 0.9, 1)
                btn.color = (0.2, 0.2, 0.2, 1)

        self.trigger_change(option)

    def get_value(self) -> Optional[str]:
        """Get selected option."""
        return self.selected_option


class ConsentRatingQuestionWidget(BaseQuestionWidget):
    """Widget for consent rating questions (Yes/Maybe/No)."""

    def __init__(self, question: dict, initial_value: Any = None, on_change: Optional[Callable] = None, **kwargs):
        super().__init__(question, initial_value, on_change, **kwargs)

        self.selected_value = initial_value
        self.rating_buttons = {}

        # Rating options
        ratings = [
            ('yes', 'Ja ✓', (0.2, 0.7, 0.3, 1)),
            ('maybe', 'Vielleicht ?', (1.0, 0.7, 0.2, 1)),
            ('no', 'Nein ✗', (0.9, 0.3, 0.3, 1)),
        ]

        ratings_layout = GridLayout(
            cols=3,
            spacing=10,
            size_hint_y=None,
            height=80,
        )

        for value, text, color in ratings:
            btn = Button(
                text=text,
                font_size='18sp',
                bold=True,
            )

            # Style selected button
            if value == initial_value:
                btn.background_color = color
            else:
                btn.background_color = (0.9, 0.9, 0.9, 1)
                btn.color = (0.2, 0.2, 0.2, 1)

            btn.bind(on_press=lambda b, v=value, c=color: self._on_rating_select(v, c))
            self.rating_buttons[value] = (btn, color)
            ratings_layout.add_widget(btn)

        self.add_widget(ratings_layout)

    def _on_rating_select(self, value: str, color: tuple):
        """Handle rating selection."""
        self.selected_value = value

        # Update button styles
        for val, (btn, btn_color) in self.rating_buttons.items():
            if val == value:
                btn.background_color = btn_color
                btn.color = (1, 1, 1, 1)
            else:
                btn.background_color = (0.9, 0.9, 0.9, 1)
                btn.color = (0.2, 0.2, 0.2, 1)

        self.trigger_change(value)

    def get_value(self) -> Optional[str]:
        """Get selected rating."""
        return self.selected_value


def create_question_widget(
    question: dict,
    initial_value: Any = None,
    on_change: Optional[Callable] = None
) -> BaseQuestionWidget:
    """
    Factory function to create appropriate question widget.

    Args:
        question: Question data dict
        initial_value: Initial answer value
        on_change: Callback when answer changes

    Returns:
        Question widget instance
    """
    schema = question.get('schema', 'text')

    widget_map = {
        'scale_0_10': ScaleQuestionWidget,
        'text': TextQuestionWidget,
        'enum': EnumQuestionWidget,
        'consent_rating': ConsentRatingQuestionWidget,
    }

    widget_class = widget_map.get(schema, TextQuestionWidget)
    return widget_class(question, initial_value, on_change)
