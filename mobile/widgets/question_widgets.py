"""
Question Widgets

Specialized widgets for different question types.
"""
from typing import Any, Dict, Callable, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.slider import Slider
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.checkbox import CheckBox
from kivy.properties import DictProperty, StringProperty, ObjectProperty


class BaseQuestionWidget(BoxLayout):
    """Base class for all question widgets."""

    question = DictProperty({})
    response = ObjectProperty(None, allownone=True)
    on_change = ObjectProperty(None, allownone=True)  # Callback when answer changes

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.spacing = 15
        self.padding = [15, 15]
        self.size_hint_y = None

    def _notify_change(self, value):
        """Notify parent about value change."""
        self.response = value
        if self.on_change:
            self.on_change(self.question.get('id'), value)

    def get_response(self) -> Any:
        """Get current response value."""
        return self.response

    def is_valid(self) -> bool:
        """Check if current response is valid."""
        # Override in subclasses
        return True


class ScaleQuestion(BaseQuestionWidget):
    """Scale question (0-10) with slider."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.height = 200

        # Question label
        self.question_label = Label(
            text='',
            font_size='18sp',
            bold=True,
            size_hint_y=None,
            height=60,
            text_size=(None, None),
            halign='left',
            valign='top',
        )
        self.add_widget(self.question_label)

        # Help text
        self.help_label = Label(
            text='',
            font_size='14sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=30,
            text_size=(None, None),
            halign='left',
        )
        self.add_widget(self.help_label)

        # Value display
        self.value_label = Label(
            text='Noch nicht beantwortet',
            font_size='24sp',
            bold=True,
            color=(0.2, 0.6, 0.8, 1),
            size_hint_y=None,
            height=40,
        )
        self.add_widget(self.value_label)

        # Slider
        self.slider = Slider(
            min=0,
            max=10,
            value=5,
            step=1,
            size_hint_y=None,
            height=40,
        )
        self.slider.bind(value=self._on_slider_change)
        self.add_widget(self.slider)

        # Scale labels
        scale_labels = BoxLayout(size_hint_y=None, height=25)
        scale_labels.add_widget(Label(text='0', font_size='12sp'))
        scale_labels.add_widget(Label(text='5', font_size='12sp'))
        scale_labels.add_widget(Label(text='10', font_size='12sp'))
        self.add_widget(scale_labels)

        # Bind question updates
        self.bind(question=self._update_question)
        self.bind(response=self._update_from_response)

    def _update_question(self, *args):
        """Update UI from question data."""
        if self.question:
            self.question_label.text = self.question.get('label', '')
            self.help_label.text = self.question.get('help', '')

    def _update_from_response(self, *args):
        """Update UI from existing response."""
        if self.response is not None and isinstance(self.response, dict):
            value = self.response.get('value')
            if value is not None:
                self.slider.value = value
                self.value_label.text = str(int(value))

    def _on_slider_change(self, instance, value):
        """Handle slider value change."""
        int_value = int(value)
        self.value_label.text = str(int_value)
        self._notify_change({'value': int_value})

    def is_valid(self) -> bool:
        """Scale questions are always valid (have default value)."""
        return True


class EnumQuestion(BaseQuestionWidget):
    """Single choice question with radio buttons."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.height = 300
        self.selected_option = None
        self.option_buttons = []

        # Question label
        self.question_label = Label(
            text='',
            font_size='18sp',
            bold=True,
            size_hint_y=None,
            height=60,
            text_size=(None, None),
            halign='left',
            valign='top',
        )
        self.add_widget(self.question_label)

        # Help text
        self.help_label = Label(
            text='',
            font_size='14sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=30,
            text_size=(None, None),
            halign='left',
        )
        self.add_widget(self.help_label)

        # Options container
        self.options_layout = BoxLayout(
            orientation='vertical',
            spacing=10,
            size_hint_y=None,
        )
        self.options_layout.bind(minimum_height=self.options_layout.setter('height'))
        self.add_widget(self.options_layout)

        # Bind question updates
        self.bind(question=self._update_question)
        self.bind(response=self._update_from_response)

    def _update_question(self, *args):
        """Update UI from question data."""
        if not self.question:
            return

        self.question_label.text = self.question.get('label', '')
        self.help_label.text = self.question.get('help', '')

        # Create option buttons
        self.options_layout.clear_widgets()
        self.option_buttons = []

        options = self.question.get('options', [])
        for option in options:
            btn = ToggleButton(
                text=option,
                size_hint_y=None,
                height=50,
                group=f"enum_{self.question.get('id', 'default')}",
                font_size='16sp',
            )
            btn.bind(state=lambda instance, value, opt=option: self._on_option_toggle(opt, value))
            self.options_layout.add_widget(btn)
            self.option_buttons.append(btn)

        # Adjust height based on options
        self.height = 150 + (len(options) * 60)

    def _update_from_response(self, *args):
        """Update UI from existing response."""
        if self.response is not None and isinstance(self.response, dict):
            value = self.response.get('value')
            if value:
                # Set the correct button to selected
                for btn in self.option_buttons:
                    if btn.text == value:
                        btn.state = 'down'

    def _on_option_toggle(self, option: str, state: str):
        """Handle option selection."""
        if state == 'down':
            self.selected_option = option
            self._notify_change({'value': option})

    def is_valid(self) -> bool:
        """Enum questions require a selection."""
        return self.selected_option is not None or self.response is not None


class MultiChoiceQuestion(BaseQuestionWidget):
    """Multiple choice question with checkboxes."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.height = 300
        self.selected_options = set()
        self.checkboxes = {}

        # Question label
        self.question_label = Label(
            text='',
            font_size='18sp',
            bold=True,
            size_hint_y=None,
            height=60,
            text_size=(None, None),
            halign='left',
            valign='top',
        )
        self.add_widget(self.question_label)

        # Help text
        self.help_label = Label(
            text='',
            font_size='14sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=30,
            text_size=(None, None),
            halign='left',
        )
        self.add_widget(self.help_label)

        # Options container
        self.options_layout = BoxLayout(
            orientation='vertical',
            spacing=10,
            size_hint_y=None,
        )
        self.options_layout.bind(minimum_height=self.options_layout.setter('height'))
        self.add_widget(self.options_layout)

        # Bind question updates
        self.bind(question=self._update_question)
        self.bind(response=self._update_from_response)

    def _update_question(self, *args):
        """Update UI from question data."""
        if not self.question:
            return

        self.question_label.text = self.question.get('label', '')
        self.help_label.text = self.question.get('help', '')

        # Create option checkboxes
        self.options_layout.clear_widgets()
        self.checkboxes = {}

        options = self.question.get('options', [])
        for option in options:
            option_row = BoxLayout(size_hint_y=None, height=40, spacing=10)

            checkbox = CheckBox(size_hint_x=None, width=40)
            checkbox.bind(active=lambda instance, value, opt=option: self._on_checkbox_toggle(opt, value))
            self.checkboxes[option] = checkbox

            label = Label(text=option, font_size='16sp', halign='left')
            label.bind(size=label.setter('text_size'))

            option_row.add_widget(checkbox)
            option_row.add_widget(label)
            self.options_layout.add_widget(option_row)

        # Adjust height based on options
        self.height = 150 + (len(options) * 50)

    def _update_from_response(self, *args):
        """Update UI from existing response."""
        if self.response is not None and isinstance(self.response, dict):
            values = self.response.get('values', [])
            self.selected_options = set(values)
            # Update checkboxes
            for option, checkbox in self.checkboxes.items():
                checkbox.active = option in self.selected_options

    def _on_checkbox_toggle(self, option: str, active: bool):
        """Handle checkbox toggle."""
        if active:
            self.selected_options.add(option)
        else:
            self.selected_options.discard(option)

        self._notify_change({'values': list(self.selected_options)})

    def is_valid(self) -> bool:
        """Multi-choice questions are valid if at least one is selected."""
        return len(self.selected_options) > 0 or (self.response and len(self.response.get('values', [])) > 0)


class TextQuestion(BaseQuestionWidget):
    """Free text question."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.height = 250

        # Question label
        self.question_label = Label(
            text='',
            font_size='18sp',
            bold=True,
            size_hint_y=None,
            height=60,
            text_size=(None, None),
            halign='left',
            valign='top',
        )
        self.add_widget(self.question_label)

        # Help text
        self.help_label = Label(
            text='',
            font_size='14sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=30,
            text_size=(None, None),
            halign='left',
        )
        self.add_widget(self.help_label)

        # Text input
        self.text_input = TextInput(
            hint_text='Deine Antwort hier eingeben...',
            multiline=True,
            size_hint_y=None,
            height=120,
            font_size='16sp',
        )
        self.text_input.bind(text=self._on_text_change)
        self.add_widget(self.text_input)

        # Bind question updates
        self.bind(question=self._update_question)
        self.bind(response=self._update_from_response)

    def _update_question(self, *args):
        """Update UI from question data."""
        if self.question:
            self.question_label.text = self.question.get('label', '')
            self.help_label.text = self.question.get('help', '')

    def _update_from_response(self, *args):
        """Update UI from existing response."""
        if self.response is not None and isinstance(self.response, dict):
            text = self.response.get('text', '')
            if text:
                self.text_input.text = text

    def _on_text_change(self, instance, value):
        """Handle text input change."""
        self._notify_change({'text': value})

    def is_valid(self) -> bool:
        """Text questions are valid if not empty."""
        return bool(self.text_input.text.strip()) or (self.response and bool(self.response.get('text', '').strip()))


class ConsentRatingQuestion(BaseQuestionWidget):
    """
    Consent rating question with status + interest + comfort sliders.

    Schema: consent_rating
    Response: {status, interest, comfort, conditions, notes}
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.height = 450
        self.current_status = None

        # Question label
        self.question_label = Label(
            text='',
            font_size='18sp',
            bold=True,
            size_hint_y=None,
            height=60,
            text_size=(None, None),
            halign='left',
            valign='top',
        )
        self.add_widget(self.question_label)

        # Help text
        self.help_label = Label(
            text='',
            font_size='14sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=30,
            text_size=(None, None),
            halign='left',
        )
        self.add_widget(self.help_label)

        # Status buttons
        status_label = Label(
            text='Status:',
            font_size='16sp',
            bold=True,
            size_hint_y=None,
            height=25,
        )
        self.add_widget(status_label)

        self.status_layout = BoxLayout(size_hint_y=None, height=50, spacing=5)

        self.status_buttons = {}
        statuses = [
            ('YES', '✓ Ja', (0.2, 0.7, 0.3, 1)),
            ('MAYBE', '? Vielleicht', (0.8, 0.7, 0.2, 1)),
            ('NO', '✗ Nein', (0.8, 0.3, 0.2, 1)),
        ]

        for status_id, label, color in statuses:
            btn = ToggleButton(
                text=label,
                group=f"consent_{id(self)}",
                font_size='14sp',
            )
            btn.bind(state=lambda instance, value, sid=status_id: self._on_status_toggle(sid, value))
            self.status_buttons[status_id] = btn
            self.status_layout.add_widget(btn)

        self.add_widget(self.status_layout)

        # Interest slider
        interest_label = Label(
            text='Interesse (0-10):',
            font_size='14sp',
            size_hint_y=None,
            height=25,
        )
        self.add_widget(interest_label)

        self.interest_slider = Slider(min=0, max=10, value=5, step=1, size_hint_y=None, height=30)
        self.interest_value_label = Label(text='5', font_size='16sp', size_hint_y=None, height=25)
        self.interest_slider.bind(value=lambda i, v: setattr(self.interest_value_label, 'text', str(int(v))))
        self.interest_slider.bind(value=lambda i, v: self._update_response())
        self.add_widget(self.interest_slider)
        self.add_widget(self.interest_value_label)

        # Comfort slider
        comfort_label = Label(
            text='Wohlfühllevel (0-10):',
            font_size='14sp',
            size_hint_y=None,
            height=25,
        )
        self.add_widget(comfort_label)

        self.comfort_slider = Slider(min=0, max=10, value=5, step=1, size_hint_y=None, height=30)
        self.comfort_value_label = Label(text='5', font_size='16sp', size_hint_y=None, height=25)
        self.comfort_slider.bind(value=lambda i, v: setattr(self.comfort_value_label, 'text', str(int(v))))
        self.comfort_slider.bind(value=lambda i, v: self._update_response())
        self.add_widget(self.comfort_slider)
        self.add_widget(self.comfort_value_label)

        # Notes
        notes_label = Label(
            text='Notizen (optional):',
            font_size='14sp',
            size_hint_y=None,
            height=25,
        )
        self.add_widget(notes_label)

        self.notes_input = TextInput(
            hint_text='Zusätzliche Gedanken...',
            multiline=True,
            size_hint_y=None,
            height=60,
            font_size='14sp',
        )
        self.notes_input.bind(text=lambda i, v: self._update_response())
        self.add_widget(self.notes_input)

        # Bind question updates
        self.bind(question=self._update_question)
        self.bind(response=self._update_from_response)

    def _update_question(self, *args):
        """Update UI from question data."""
        if self.question:
            self.question_label.text = self.question.get('label', '')
            self.help_label.text = self.question.get('help', '')

    def _update_from_response(self, *args):
        """Update UI from existing response."""
        if self.response is not None and isinstance(self.response, dict):
            status = self.response.get('status')
            if status and status in self.status_buttons:
                self.status_buttons[status].state = 'down'
                self.current_status = status

            interest = self.response.get('interest')
            if interest is not None:
                self.interest_slider.value = interest

            comfort = self.response.get('comfort')
            if comfort is not None:
                self.comfort_slider.value = comfort

            notes = self.response.get('notes', '')
            if notes:
                self.notes_input.text = notes

    def _on_status_toggle(self, status: str, state: str):
        """Handle status button toggle."""
        if state == 'down':
            self.current_status = status
            self._update_response()

    def _update_response(self):
        """Update response from current widget state."""
        response = {
            'status': self.current_status,
            'interest': int(self.interest_slider.value),
            'comfort': int(self.comfort_slider.value),
            'notes': self.notes_input.text,
        }
        self._notify_change(response)

    def is_valid(self) -> bool:
        """Consent rating requires a status selection."""
        return self.current_status is not None or (self.response and self.response.get('status') is not None)
