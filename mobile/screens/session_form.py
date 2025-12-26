"""Wizard-based Session Form Screen (Stepper / 1 question per page)."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.properties import ObjectProperty, StringProperty

from mobile.widgets.progress_header import ProgressHeader
from mobile.widgets.navigation_bar import NavigationBar
from mobile.widgets.question_page import QuestionPage
from mobile.widgets.summary_page import SummaryPage
from mobile.widgets.ui_helpers import make_wrapped_label

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
        self.current_question_widget: Optional[QuestionPage] = None
        self._showing_summary = False

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

        # Navigation bar (Back / Next)
        self.nav_bar = NavigationBar()
        self.nav_bar.on_back = self._on_back
        self.nav_bar.on_next = self._on_next
        self.main_layout.add_widget(self.nav_bar)

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

        self.nav_bar.back_text = '← Dashboard'
        self.nav_bar.back_disabled = False
        self.nav_bar.next_disabled = True

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

        self.nav_bar.back_text = '← Dashboard'
        self.nav_bar.back_disabled = False
        self.nav_bar.next_disabled = True

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
        self._showing_summary = False
        self.progress_header.current = 0
        self.progress_header.total = 0

        # Title
        template = self.app_store.current_template

        self.content_layout.add_widget(
            make_wrapped_label(
                template.get("name", "Fragebogen"),
                font_size="22sp",
                bold=True,
            )
        )

        # Person info
        self.content_layout.add_widget(
            make_wrapped_label(
                f"Antworten für: Person {self.app_store.current_person}",
                font_size="15sp",
                color=(0.5, 0.5, 0.5, 1),
            )
        )

        # Description
        description = template.get('description', 'Beantworte die folgenden Fragen, um deine Präferenzen festzuhalten.')
        self.content_layout.add_widget(make_wrapped_label(description, font_size="16sp"))

        # Info box
        self.content_layout.add_widget(
            make_wrapped_label(
                "Du wirst Schritt für Schritt durch den Fragebogen geführt.\n"
                "Eine Frage pro Seite.\n"
                "Deine Antworten werden automatisch gespeichert.",
                font_size="14sp",
                color=(0.3, 0.3, 0.3, 1),
            )
        )

        # Start button
        start_btn = Button(
            text='Start',
            size_hint_y=None,
            height=60,
            font_size='18sp',
            on_press=self._on_start_wizard,
        )
        self.content_layout.add_widget(start_btn)

        # Navigation buttons
        self.nav_bar.back_text = "← Dashboard"
        self.nav_bar.next_text = "Weiter →"
        self.nav_bar.next_disabled = True
        self.nav_bar.back_disabled = False

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
        self._showing_summary = False

        self.current_question_widget = QuestionPage(
            question=question,
            response=self.app_store.form_responses.get(question.get("id")),
            on_change=self._on_answer_change,
        )
        self.content_layout.add_widget(self.current_question_widget)

        # Update navigation buttons (Back always available inside wizard)
        self.nav_bar.back_text = "← Zurück"
        self.nav_bar.back_disabled = False
        self.nav_bar.next_text = "Zusammenfassung →" if self.app_store.is_last_question() else "Weiter →"

        # Enable/disable next based on validation
        self._update_next_button()

    def _on_answer_change(self, question_id: str, response):
        """Handle answer change from question widget."""
        if self.app_store:
            self.app_store.update_response(question_id, response)
            self._update_next_button()

    def _update_next_button(self):
        """Update next button state based on validation."""
        if self.current_question_widget:
            is_valid = self.current_question_widget.is_valid()
            self.nav_bar.next_disabled = not is_valid
        else:
            self.nav_bar.next_disabled = False

    def _on_back(self, *args):
        """Handle back button press."""
        if not self.app_store:
            return

        if not self.app_store.wizard_started:
            # Go back to dashboard
            self.app_store.navigate_to('dashboard')
            return

        # In summary: go back to last question
        if self._showing_summary:
            self._showing_summary = False
            self.app_store.current_question_index = max(len(self.app_store.wizard_questions) - 1, 0)
            self._render_question()
            return

        # Auto-save before moving
        if self.app_store.has_unsaved_changes:
            self.app_store.auto_save()

        # Back always works inside wizard: first question -> start screen
        if self.app_store.is_first_question():
            self.app_store.wizard_started = False
            self._render_start_screen()
            return

        self.app_store.previous_question()

    def _on_next(self, *args):
        """Handle next button press."""
        if not self.app_store or not self.app_store.wizard_started:
            return

        # Validate current question (show inline error)
        if self.current_question_widget and not self.current_question_widget.validate_and_show_error():
            self.status_label.text = 'Bitte prüfe das Feld.'
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
        self._showing_summary = True

        # Progress: show completion
        self.progress_header.current = len(self.app_store.wizard_questions)
        self.progress_header.total = len(self.app_store.wizard_questions)
        self.progress_header.module_name = ""

        self.content_layout.add_widget(
            SummaryPage(
                questions=list(self.app_store.wizard_questions or []),
                responses=dict(self.app_store.form_responses or {}),
            )
        )

        # Primary action: submit/evaluate
        submit_btn = Button(
            text="Absenden / Auswerten",
            size_hint_y=None,
            height=60,
            font_size="18sp",
            on_press=self._on_submit,
        )
        self.content_layout.add_widget(submit_btn)

        # Secondary actions
        review_btn = Button(
            text="Antworten bearbeiten",
            size_hint_y=None,
            height=52,
            on_press=self._on_review_answers,
        )
        self.content_layout.add_widget(review_btn)

        compare_btn = Button(
            text="Vergleichen (wenn A & B fertig)",
            size_hint_y=None,
            height=52,
            on_press=self._on_compare,
        )
        self.content_layout.add_widget(compare_btn)

        finish_btn = Button(
            text="Zum Dashboard",
            size_hint_y=None,
            height=52,
            on_press=self._on_finish,
        )
        self.content_layout.add_widget(finish_btn)

        self.nav_bar.back_text = "← Zurück"
        self.nav_bar.next_text = "Weiter →"
        self.nav_bar.next_disabled = True
        self.nav_bar.back_disabled = False

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

    def _on_submit(self, instance):
        """Submit (save) and try to evaluate if possible."""
        if not self.app_store:
            return
        try:
            self.app_store.complete_wizard()
            # Try compare (only works if both A and B exist)
            try:
                self.app_store.run_compare()
                self.app_store.navigate_to("compare_report")
            except Exception:
                self.app_store.navigate_to("dashboard")
        except Exception as e:
            self.status_label.text = f"Fehler: {str(e)}"

    def _update_status(self, *args):
        """Update status label from store."""
        if self.app_store:
            status = self.app_store.save_status
            if status:
                self.status_label.text = status
