"""Wizard Screens and Components."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Callable

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.progressbar import ProgressBar
from kivy.graphics import Color, Rectangle, RoundedRectangle

from mobile.widgets.question_widgets import create_question_widget
from mobile.widgets.wizard_state import WizardState

if TYPE_CHECKING:
    from mobile.store import AppStore


class ProgressHeader(BoxLayout):
    """Progress header showing current question number and progress bar."""

    def __init__(self, **kwargs):
        super().__init__(
            orientation='vertical',
            size_hint_y=None,
            height=100,
            spacing=10,
            padding=[15, 15, 15, 10],
            **kwargs
        )

        # Progress text
        self.progress_label = Label(
            text='Frage 1 von 10',
            size_hint_y=None,
            height=30,
            font_size='16sp',
            bold=True,
            halign='center',
        )
        self.add_widget(self.progress_label)

        # Progress bar container
        progress_container = BoxLayout(
            size_hint_y=None,
            height=40,
            padding=[0, 5, 0, 5],
        )

        self.progress_bar = ProgressBar(
            max=100,
            value=10,
            size_hint_y=None,
            height=12,
        )
        progress_container.add_widget(self.progress_bar)
        self.add_widget(progress_container)

        # Module name
        self.module_label = Label(
            text='',
            size_hint_y=None,
            height=25,
            font_size='13sp',
            color=(0.5, 0.5, 0.5, 1),
            halign='center',
        )
        self.add_widget(self.module_label)

    def update(self, wizard_state: WizardState):
        """Update progress display from wizard state."""
        self.progress_label.text = wizard_state.progress_text
        self.progress_bar.value = wizard_state.progress_percentage * 100

        # Update module name
        current_q = wizard_state.current_question
        if current_q:
            module_name = current_q.get('_module_name', '')
            self.module_label.text = f'Modul: {module_name}' if module_name else ''


class NavigationBar(BoxLayout):
    """Navigation bar with Back and Next buttons."""

    def __init__(
        self,
        on_back: Optional[Callable] = None,
        on_next: Optional[Callable] = None,
        **kwargs
    ):
        super().__init__(
            orientation='horizontal',
            size_hint_y=None,
            height=70,
            spacing=15,
            padding=[15, 10, 15, 15],
            **kwargs
        )

        self.on_back_callback = on_back
        self.on_next_callback = on_next

        # Back button
        self.back_btn = Button(
            text='← Zurück',
            size_hint_x=0.4,
            font_size='16sp',
            background_color=(0.7, 0.7, 0.7, 1),
        )
        self.back_btn.bind(on_press=self._on_back_press)
        self.add_widget(self.back_btn)

        # Next button
        self.next_btn = Button(
            text='Weiter →',
            size_hint_x=0.6,
            font_size='18sp',
            bold=True,
            background_color=(0.2, 0.6, 0.8, 1),
        )
        self.next_btn.bind(on_press=self._on_next_press)
        self.add_widget(self.next_btn)

        # Error label (hidden by default)
        self.error_label = Label(
            text='',
            size_hint_y=None,
            height=0,
            font_size='13sp',
            color=(0.9, 0.3, 0.3, 1),
            halign='center',
        )

    def _on_back_press(self, instance):
        """Handle back button press."""
        if self.on_back_callback:
            self.on_back_callback()

    def _on_next_press(self, instance):
        """Handle next button press."""
        if self.on_next_callback:
            self.on_next_callback()

    def update(self, wizard_state: WizardState):
        """Update navigation buttons based on wizard state."""
        # Back button
        self.back_btn.disabled = not wizard_state.can_go_back()

        # Next button
        can_next = wizard_state.can_go_next()
        self.next_btn.disabled = not can_next

        # Update next button text for last question
        if wizard_state.is_last_question:
            self.next_btn.text = 'Zur Zusammenfassung →'
        else:
            self.next_btn.text = 'Weiter →'

        # Show validation error if can't proceed
        if not can_next:
            error = wizard_state.get_validation_error()
            if error:
                self.show_error(error)
            else:
                self.hide_error()
        else:
            self.hide_error()

    def show_error(self, message: str):
        """Show error message."""
        self.error_label.text = message
        self.error_label.height = 30

    def hide_error(self):
        """Hide error message."""
        self.error_label.text = ''
        self.error_label.height = 0


class WizardStartScreen(BoxLayout):
    """Start screen for the wizard."""

    def __init__(self, template: dict, on_start: Optional[Callable] = None, **kwargs):
        super().__init__(
            orientation='vertical',
            padding=20,
            spacing=20,
            **kwargs
        )

        self.template = template
        self.on_start_callback = on_start

        # Template name
        title = Label(
            text=template.get('name', 'Fragebogen'),
            size_hint_y=None,
            height=60,
            font_size='24sp',
            bold=True,
            halign='center',
            valign='middle',
        )
        self.add_widget(title)

        # Description
        description = template.get('description', '')
        if description:
            desc_label = Label(
                text=description,
                size_hint_y=None,
                height=100,
                font_size='16sp',
                halign='center',
                valign='middle',
                text_size=(None, None),
            )
            desc_label.bind(size=lambda i, v: setattr(desc_label, 'text_size', (v[0] - 40, None)))
            self.add_widget(desc_label)

        # Module count
        module_count = len(template.get('modules', []))
        total_questions = sum(
            len(m.get('questions', []))
            for m in template.get('modules', [])
        )

        info = Label(
            text=f'{module_count} Module • {total_questions} Fragen',
            size_hint_y=None,
            height=40,
            font_size='15sp',
            color=(0.5, 0.5, 0.5, 1),
        )
        self.add_widget(info)

        # Spacer
        self.add_widget(BoxLayout())

        # Instructions
        instructions = Label(
            text='Beantworte die Fragen ehrlich und in Ruhe.\n\n'
                 'Du kannst jederzeit zurück gehen und\n'
                 'deine Antworten werden automatisch gespeichert.',
            size_hint_y=None,
            height=100,
            font_size='14sp',
            halign='center',
            color=(0.4, 0.4, 0.4, 1),
        )
        self.add_widget(instructions)

        # Start button
        start_btn = Button(
            text='Fragebogen starten',
            size_hint=(None, None),
            size=(300, 60),
            pos_hint={'center_x': 0.5},
            font_size='18sp',
            bold=True,
            background_color=(0.2, 0.6, 0.8, 1),
        )
        start_btn.bind(on_press=self._on_start)
        self.add_widget(start_btn)

        # Spacer
        self.add_widget(BoxLayout())

    def _on_start(self, instance):
        """Handle start button press."""
        if self.on_start_callback:
            self.on_start_callback()


class QuestionPage(BoxLayout):
    """Page displaying a single question."""

    def __init__(
        self,
        wizard_state: WizardState,
        app_store: 'AppStore',
        on_back: Optional[Callable] = None,
        on_next: Optional[Callable] = None,
        **kwargs
    ):
        super().__init__(orientation='vertical', **kwargs)

        self.wizard_state = wizard_state
        self.app_store = app_store
        self.on_back_callback = on_back
        self.on_next_callback = on_next

        # Progress header
        self.progress_header = ProgressHeader()
        self.add_widget(self.progress_header)

        # Question content (scrollable)
        self.scroll_view = ScrollView()
        self.question_container = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            padding=[15, 10, 15, 10],
            spacing=10,
        )
        self.question_container.bind(minimum_height=self.question_container.setter('height'))
        self.scroll_view.add_widget(self.question_container)
        self.add_widget(self.scroll_view)

        # Navigation bar
        self.nav_bar = NavigationBar(
            on_back=self._on_back,
            on_next=self._on_next,
        )
        self.add_widget(self.nav_bar)

        # Add error label to layout
        self.insert_widget(len(self.children) - 1, self.nav_bar.error_label)

        # Render current question
        self._render_question()

    def _render_question(self):
        """Render the current question."""
        self.question_container.clear_widgets()

        current_q = self.wizard_state.current_question
        if not current_q:
            return

        question_id = current_q.get('id')
        initial_value = self.wizard_state.get_answer(question_id)

        # Create question widget
        question_widget = create_question_widget(
            question=current_q,
            initial_value=initial_value,
            on_change=lambda value: self._on_answer_change(question_id, value),
        )

        self.question_container.add_widget(question_widget)

        # Update progress and navigation
        self.progress_header.update(self.wizard_state)
        self.nav_bar.update(self.wizard_state)

    def _on_answer_change(self, question_id: str, value):
        """Handle answer change."""
        # Update wizard state
        self.wizard_state.set_answer(question_id, value)

        # Update app store
        self.app_store.update_response(question_id, value)

        # Update navigation buttons
        self.nav_bar.update(self.wizard_state)

    def _on_back(self):
        """Handle back navigation."""
        if self.wizard_state.go_back():
            self._render_question()

        if self.on_back_callback:
            self.on_back_callback()

    def _on_next(self):
        """Handle next navigation."""
        # Validate current question
        if not self.wizard_state.can_go_next():
            error = self.wizard_state.get_validation_error()
            if error:
                self.nav_bar.show_error(error)
            return

        # Check if last question
        if self.wizard_state.is_last_question:
            # Go to summary
            if self.on_next_callback:
                self.on_next_callback()
        else:
            # Go to next question
            if self.wizard_state.go_next():
                self._render_question()


class SummaryPage(BoxLayout):
    """Summary page showing all answers."""

    def __init__(
        self,
        wizard_state: WizardState,
        on_back: Optional[Callable] = None,
        on_submit: Optional[Callable] = None,
        **kwargs
    ):
        super().__init__(orientation='vertical', padding=15, spacing=15, **kwargs)

        self.wizard_state = wizard_state
        self.on_back_callback = on_back
        self.on_submit_callback = on_submit

        # Title
        title = Label(
            text='Zusammenfassung',
            size_hint_y=None,
            height=50,
            font_size='22sp',
            bold=True,
            halign='center',
        )
        self.add_widget(title)

        # Summary scroll
        scroll_view = ScrollView()
        summary_layout = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            spacing=15,
            padding=10,
        )
        summary_layout.bind(minimum_height=summary_layout.setter('height'))

        # Get summary data
        summary_data = wizard_state.get_summary_data()

        # Group by module
        modules = {}
        for item in summary_data:
            module_name = item['module_name']
            if module_name not in modules:
                modules[module_name] = []
            modules[module_name].append(item)

        # Render by module
        for module_name, questions in modules.items():
            # Module header
            module_header = Label(
                text=f'[b]{module_name}[/b]',
                size_hint_y=None,
                height=40,
                font_size='18sp',
                markup=True,
                halign='left',
                color=(0.2, 0.6, 0.8, 1),
            )
            module_header.bind(size=lambda i, v: setattr(i, 'text_size', (v[0] - 20, None)))
            summary_layout.add_widget(module_header)

            # Questions
            for item in questions:
                answer = item['answer']
                if answer is None or answer == '':
                    answer_text = '[color=999999][i]Nicht beantwortet[/i][/color]'
                else:
                    answer_text = str(answer)

                q_layout = BoxLayout(
                    orientation='vertical',
                    size_hint_y=None,
                    spacing=5,
                    padding=[10, 5, 10, 10],
                )

                q_label = Label(
                    text=item['question_text'],
                    size_hint_y=None,
                    font_size='14sp',
                    halign='left',
                    text_size=(None, None),
                )
                q_label.bind(size=lambda i, v: setattr(i, 'text_size', (v[0] - 20, None)))
                q_label.bind(texture_size=lambda i, v: setattr(i, 'height', v[1] + 10))

                a_label = Label(
                    text=f'[color=333333]{answer_text}[/color]',
                    size_hint_y=None,
                    font_size='15sp',
                    bold=True,
                    markup=True,
                    halign='left',
                    text_size=(None, None),
                )
                a_label.bind(size=lambda i, v: setattr(i, 'text_size', (v[0] - 20, None)))
                a_label.bind(texture_size=lambda i, v: setattr(i, 'height', v[1] + 10))

                q_layout.add_widget(q_label)
                q_layout.add_widget(a_label)
                q_layout.bind(minimum_height=q_layout.setter('height'))

                summary_layout.add_widget(q_layout)

        scroll_view.add_widget(summary_layout)
        self.add_widget(scroll_view)

        # Action buttons
        actions_layout = BoxLayout(
            size_hint_y=None,
            height=70,
            spacing=15,
        )

        back_btn = Button(
            text='← Zurück bearbeiten',
            size_hint_x=0.45,
            font_size='15sp',
            background_color=(0.7, 0.7, 0.7, 1),
        )
        back_btn.bind(on_press=lambda i: self.on_back_callback() if self.on_back_callback else None)
        actions_layout.add_widget(back_btn)

        submit_btn = Button(
            text='✓ Abschließen',
            size_hint_x=0.55,
            font_size='18sp',
            bold=True,
            background_color=(0.2, 0.7, 0.3, 1),
        )
        submit_btn.bind(on_press=lambda i: self.on_submit_callback() if self.on_submit_callback else None)
        actions_layout.add_widget(submit_btn)

        self.add_widget(actions_layout)
