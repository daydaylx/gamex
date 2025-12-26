"""Wizard-based Session Form Screen."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.properties import ObjectProperty, StringProperty

from mobile.widgets.progress_header import ProgressHeader
from mobile.widgets.question_widgets import (
    ScaleQuestion,
    EnumQuestion,
    MultiChoiceQuestion,
    TextQuestion,
    ConsentRatingQuestion,
)

if TYPE_CHECKING:
    from mobile.store import AppStore


class SessionFormScreen(Screen):
    """
    Wizard-based session form screen.

    Features:
    - One question per screen
    - Progress indicator
    - Back/Next navigation
    - Start screen & summary screen
    - Auto-save responses
    """

    app_store = ObjectProperty(None)

    def __init__(self, app_store: AppStore, **kwargs):
        super().__init__(**kwargs)
        self.app_store = app_store
        self.current_question_widget = None

        # Main layout
        self.main_layout = BoxLayout(orientation='vertical', padding=10, spacing=10)

        # Progress header
        self.progress_header = ProgressHeader()
        self.main_layout.add_widget(self.progress_header)

        # Status message
        self.status_label = Label(
            text='',
            size_hint_y=None,
            height=30,
            font_size='12sp',
            color=(0.2, 0.6, 0.8, 1),
        )
        self.main_layout.add_widget(self.status_label)

        # Content area (scrollable)
        self.content_scroll = ScrollView()
        self.content_layout = BoxLayout(
            orientation='vertical',
            spacing=15,
            size_hint_y=None,
            padding=10,
        )
        self.content_layout.bind(minimum_height=self.content_layout.setter('height'))
        self.content_scroll.add_widget(self.content_layout)
        self.main_layout.add_widget(self.content_scroll)

        # Navigation buttons
        self.nav_layout = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=60,
            spacing=10,
            padding=[0, 10],
        )

        self.back_btn = Button(
            text='← Zurück',
            on_press=self._on_back,
            size_hint_x=0.3,
        )
        self.nav_layout.add_widget(self.back_btn)

        # Spacer
        self.nav_layout.add_widget(BoxLayout(size_hint_x=0.4))

        self.next_btn = Button(
            text='Weiter →',
            on_press=self._on_next,
            size_hint_x=0.3,
        )
        self.nav_layout.add_widget(self.next_btn)

        self.main_layout.add_widget(self.nav_layout)

        self.add_widget(self.main_layout)

        # Bind to store
        if self.app_store:
            self.app_store.bind(current_session=self._on_session_changed)
            self.app_store.bind(wizard_started=self._on_wizard_state_changed)
            self.app_store.bind(current_question_index=self._on_question_changed)
            self.app_store.bind(save_status=self._update_status)

    def on_enter(self):
        """Called when screen is entered."""
        self._render_content()

    def _on_session_changed(self, *args):
        """Handle session change."""
        self._render_content()

    def _on_wizard_state_changed(self, *args):
        """Handle wizard state change."""
        self._render_content()

    def _on_question_changed(self, *args):
        """Handle question navigation."""
        self._render_question()

    def _render_content(self):
        """Render appropriate content based on wizard state."""
        if not self.app_store or not self.app_store.current_session:
            self._render_no_session()
            return

        if not self.app_store.current_person:
            self._render_select_person()
            return

        if not self.app_store.wizard_started:
            self._render_start_screen()
        else:
            self._render_question()

    def _render_no_session(self):
        """Render message when no session is active."""
        self.content_layout.clear_widgets()
        self.progress_header.current = 0
        self.progress_header.total = 0

        info = Label(
            text='Keine aktive Session.\nBitte wähle eine Session im Dashboard.',
            font_size='16sp',
            size_hint_y=None,
            height=100,
        )
        self.content_layout.add_widget(info)

        self.back_btn.text = '← Dashboard'
        self.next_btn.disabled = True

    def _render_select_person(self):
        """Render person selection."""
        self.content_layout.clear_widgets()
        self.progress_header.current = 0
        self.progress_header.total = 0

        title = Label(
            text='Person wählen',
            font_size='20sp',
            bold=True,
            size_hint_y=None,
            height=50,
        )
        self.content_layout.add_widget(title)

        info = Label(
            text='Wähle aus, für welche Person du den Fragebogen ausfüllen möchtest:',
            font_size='16sp',
            size_hint_y=None,
            height=60,
        )
        self.content_layout.add_widget(info)

        # Person A button
        person_a_btn = Button(
            text='Person A',
            size_hint_y=None,
            height=60,
            font_size='18sp',
            on_press=lambda x: self._select_person('A'),
        )
        self.content_layout.add_widget(person_a_btn)

        # Person B button
        person_b_btn = Button(
            text='Person B',
            size_hint_y=None,
            height=60,
            font_size='18sp',
            on_press=lambda x: self._select_person('B'),
        )
        self.content_layout.add_widget(person_b_btn)

        self.back_btn.text = '← Dashboard'
        self.next_btn.disabled = True

    def _select_person(self, person: str):
        """Select person and load their responses."""
        if self.app_store and self.app_store.current_session:
            self.app_store.load_session(
                self.app_store.current_session['id'],
                person=person,
            )
            self._render_content()

    def _render_start_screen(self):
        """Render wizard start screen."""
        self.content_layout.clear_widgets()
        self.progress_header.current = 0
        self.progress_header.total = 0

        # Title
        session = self.app_store.current_session
        template = self.app_store.current_template

        title = Label(
            text=f'📋 {template.get("name", "Fragebogen")}',
            font_size='22sp',
            bold=True,
            size_hint_y=None,
            height=60,
        )
        self.content_layout.add_widget(title)

        # Person info
        person_label = Label(
            text=f'Antworten für: Person {self.app_store.current_person}',
            font_size='16sp',
            color=(0.5, 0.5, 0.5, 1),
            size_hint_y=None,
            height=30,
        )
        self.content_layout.add_widget(person_label)

        # Description
        description = template.get('description', 'Beantworte die folgenden Fragen, um deine Präferenzen festzuhalten.')
        desc_label = Label(
            text=description,
            font_size='16sp',
            size_hint_y=None,
            height=80,
            text_size=(None, None),
        )
        self.content_layout.add_widget(desc_label)

        # Info box
        info = Label(
            text='ℹ️ Du wirst durch die Fragen geleitet.\n'
                 'Eine Frage pro Seite.\n'
                 'Deine Antworten werden automatisch gespeichert.',
            font_size='14sp',
            size_hint_y=None,
            height=100,
            color=(0.3, 0.3, 0.3, 1),
        )
        self.content_layout.add_widget(info)

        # Start button
        start_btn = Button(
            text='▶ Fragebogen starten',
            size_hint_y=None,
            height=60,
            font_size='18sp',
            on_press=self._on_start_wizard,
        )
        self.content_layout.add_widget(start_btn)

        # Navigation buttons
        self.back_btn.text = '← Dashboard'
        self.next_btn.disabled = True

    def _on_start_wizard(self, instance):
        """Start the wizard."""
        if self.app_store:
            self.app_store.start_wizard()

    def _render_question(self):
        """Render current question."""
        if not self.app_store or not self.app_store.wizard_started:
            return

        question = self.app_store.get_current_question()
        if not question:
            # Wizard complete, show summary
            self._render_summary()
            return

        # Update progress
        progress = self.app_store.get_wizard_progress()
        self.progress_header.current = progress['current']
        self.progress_header.total = progress['total']
        self.progress_header.module_name = progress['module_name']

        # Clear and render question widget
        self.content_layout.clear_widgets()

        # Create appropriate widget based on schema
        schema = question.get('schema', 'text')
        widget_class = self._get_widget_for_schema(schema)

        if widget_class:
            self.current_question_widget = widget_class(
                question=question,
                response=self.app_store.form_responses.get(question['id']),
                on_change=self._on_answer_change,
            )
            self.content_layout.add_widget(self.current_question_widget)
        else:
            # Fallback
            error = Label(
                text=f'Unbekannter Fragetyp: {schema}',
                size_hint_y=None,
                height=100,
            )
            self.content_layout.add_widget(error)

        # Update navigation buttons
        self.back_btn.text = '← Zurück'
        self.back_btn.disabled = self.app_store.is_first_question()

        if self.app_store.is_last_question():
            self.next_btn.text = 'Zusammenfassung →'
        else:
            self.next_btn.text = 'Weiter →'

        # Enable/disable next based on validation
        self._update_next_button()

    def _get_widget_for_schema(self, schema: str):
        """Get widget class for question schema."""
        mapping = {
            'scale_0_10': ScaleQuestion,
            'enum': EnumQuestion,
            'multi': MultiChoiceQuestion,
            'text': TextQuestion,
            'consent_rating': ConsentRatingQuestion,
        }
        return mapping.get(schema)

    def _on_answer_change(self, question_id: str, response):
        """Handle answer change from question widget."""
        if self.app_store:
            self.app_store.update_response(question_id, response)
            self._update_next_button()

    def _update_next_button(self):
        """Update next button state based on validation."""
        if self.current_question_widget:
            is_valid = self.current_question_widget.is_valid()
            self.next_btn.disabled = not is_valid
        else:
            self.next_btn.disabled = False

    def _on_back(self, instance):
        """Handle back button press."""
        if not self.app_store:
            return

        if not self.app_store.wizard_started:
            # Go back to dashboard
            self.app_store.navigate_to('dashboard')
        else:
            # Go to previous question
            if not self.app_store.previous_question():
                # At first question, go back to start screen
                self.app_store.wizard_started = False
                self._render_start_screen()

    def _on_next(self, instance):
        """Handle next button press."""
        if not self.app_store or not self.app_store.wizard_started:
            return

        # Validate current question
        if self.current_question_widget and not self.current_question_widget.is_valid():
            self.status_label.text = '⚠️ Bitte beantworte die Frage'
            return

        # Auto-save before moving
        if self.app_store.has_unsaved_changes:
            self.app_store.auto_save()

        # Move to next or summary
        if self.app_store.is_last_question():
            self._render_summary()
        else:
            self.app_store.next_question()

    def _render_summary(self):
        """Render summary screen with all answers."""
        self.content_layout.clear_widgets()
        self.progress_header.current = 0
        self.progress_header.total = 0

        # Title
        title = Label(
            text='✅ Zusammenfassung',
            font_size='22sp',
            bold=True,
            size_hint_y=None,
            height=60,
        )
        self.content_layout.add_widget(title)

        # Info
        info = Label(
            text=f'Du hast alle {len(self.app_store.wizard_questions)} Fragen beantwortet.\n'
                 f'Beantwortete Fragen: {len(self.app_store.form_responses)}',
            font_size='16sp',
            size_hint_y=None,
            height=60,
        )
        self.content_layout.add_widget(info)

        # Summary of answers (simplified)
        summary_label = Label(
            text='Deine Antworten wurden gespeichert.',
            font_size='14sp',
            size_hint_y=None,
            height=40,
            color=(0.3, 0.6, 0.3, 1),
        )
        self.content_layout.add_widget(summary_label)

        # Actions
        actions_title = Label(
            text='Was möchtest du jetzt tun?',
            font_size='16sp',
            bold=True,
            size_hint_y=None,
            height=40,
        )
        self.content_layout.add_widget(actions_title)

        # Review answers button
        review_btn = Button(
            text='📝 Antworten überprüfen',
            size_hint_y=None,
            height=50,
            on_press=self._on_review_answers,
        )
        self.content_layout.add_widget(review_btn)

        # Compare button (if both persons answered)
        compare_btn = Button(
            text='🔍 Jetzt vergleichen',
            size_hint_y=None,
            height=50,
            on_press=self._on_compare,
        )
        self.content_layout.add_widget(compare_btn)

        # Finish button
        finish_btn = Button(
            text='✓ Fertig - Zum Dashboard',
            size_hint_y=None,
            height=50,
            on_press=self._on_finish,
        )
        self.content_layout.add_widget(finish_btn)

        # Update navigation
        self.back_btn.text = '← Zur letzten Frage'
        self.next_btn.disabled = True

    def _on_review_answers(self, instance):
        """Go back to first question to review."""
        if self.app_store:
            self.app_store.current_question_index = 0
            self._render_question()

    def _on_compare(self, instance):
        """Navigate to compare screen."""
        if self.app_store:
            try:
                self.app_store.run_compare()
                self.app_store.navigate_to('compare_report')
            except Exception as e:
                self.status_label.text = f'Fehler: {str(e)}'

    def _on_finish(self, instance):
        """Finish wizard and go to dashboard."""
        if self.app_store:
            self.app_store.complete_wizard()
            self.app_store.navigate_to('dashboard')

    def _update_status(self, *args):
        """Update status label from store."""
        if self.app_store:
            status = self.app_store.save_status
            if status:
                self.status_label.text = status
