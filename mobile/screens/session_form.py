"""Session Form Screen - Questionnaire Wizard Interface."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.textinput import TextInput
from kivy.uix.spinner import Spinner
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
    Session form screen with Wizard/Stepper interface.

    Features:
    - One question per screen
    - Progress indicator with step counter
    - Back/Next navigation
    - Auto-save responses
    - Start screen and summary page
    - Mobile-first design with large touch targets
    """

    app_store = ObjectProperty(None)
    mode = StringProperty('simple')  # 'simple' or 'detailed'

    # Wizard states
    WIZARD_STATE_CREATE = 'create'
    WIZARD_STATE_SELECT_PERSON = 'select_person'
    WIZARD_STATE_START = 'start'
    WIZARD_STATE_QUESTION = 'question'
    WIZARD_STATE_SUMMARY = 'summary'

    def __init__(self, app_store: AppStore, **kwargs):
        super().__init__(**kwargs)
        self.app_store = app_store
        self._showing_summary = False
        self.current_wizard_view = None
        self.current_question_widget: Optional[QuestionPage] = None
        self.status_label: Optional[Label] = None

        # Main container
        self.main_layout = BoxLayout(orientation='vertical')
        self.add_widget(self.main_layout)

        # Bind to store
        if self.app_store:
            self.app_store.bind(current_session=self._on_session_changed)
            self.app_store.bind(current_person=self._on_session_changed)
            self.app_store.bind(wizard_started=self._on_session_changed)
            self.app_store.bind(current_question_index=self._on_session_changed)
            self.app_store.bind(save_status=self._on_session_changed)

    def on_enter(self):
        """Called when screen is entered."""
        self._render_view()

    def _on_session_changed(self, *args):
        """Handle session change."""
        self._render_view()

    def _render_view(self):
        """Render the appropriate view based on current state."""
        self.main_layout.clear_widgets()

        if not self.app_store:
            return

        # Check if we need to create a new session
        if not self.app_store.current_session:
            self._render_create_session()
            return

        # Check if person is selected
        if not self.app_store.current_person:
            self._render_person_selection()
            return

        # Check if template is loaded
        template = self.app_store.current_template
        if not template:
            self._render_error('Template nicht gefunden')
            return

        # Determine wizard view from store state
        if not self.app_store.wizard_started:
            self.current_wizard_view = self.WIZARD_STATE_START
        else:
            current_q = self.app_store.get_current_question()
            self.current_wizard_view = self.WIZARD_STATE_SUMMARY if (self._showing_summary or not current_q) else self.WIZARD_STATE_QUESTION

        # Render current wizard view
        self._render_wizard_view()

    def _render_wizard_view(self):
        """Render current wizard view."""
        if self.current_wizard_view == self.WIZARD_STATE_START:
            self._render_start_screen()
        elif self.current_wizard_view == self.WIZARD_STATE_QUESTION:
            self._render_question_page()
        elif self.current_wizard_view == self.WIZARD_STATE_SUMMARY:
            self._render_summary_page()

    def _render_start_screen(self):
        """Render wizard start screen."""
        self._showing_summary = False
        template = self.app_store.current_template or {}

        # Header with session info and back button
        header = self._create_header(
            title=self.app_store.current_session.get('name', 'Session'),
            show_back=True,
        )
        self.main_layout.add_widget(header)

        layout = BoxLayout(orientation='vertical', padding=20, spacing=12)

        layout.add_widget(
            make_wrapped_label(
                template.get('name', 'Fragebogen'),
                font_size='24sp',
                bold=True,
            )
        )

        if template.get("description"):
            layout.add_widget(make_wrapped_label(template.get("description", ""), font_size="16sp"))

        layout.add_widget(
            make_wrapped_label(
                f"Antworten für: Person {self.app_store.current_person}",
                font_size="15sp",
                color=(0.5, 0.5, 0.5, 1),
            )
        )

        layout.add_widget(BoxLayout())

        layout.add_widget(
            make_wrapped_label(
                "Beantworte die Fragen ehrlich und in Ruhe.\n\n"
                "Du kannst jederzeit zurückgehen.\n"
                "Deine Antworten werden automatisch gespeichert.",
                font_size="14sp",
                color=(0.35, 0.35, 0.35, 1),
            )
        )

        start_btn = Button(
            text='Start',
            size_hint=(None, None),
            size=(300, 60),
            pos_hint={'center_x': 0.5},
            font_size='18sp',
            bold=True,
        )
        start_btn.bind(on_press=lambda *_: self._on_wizard_start())
        layout.add_widget(start_btn)

        layout.add_widget(BoxLayout())
        self.main_layout.add_widget(layout)

    def _render_question_page(self):
        """Render question page."""
        self._showing_summary = False

        header = self._create_header(
            title=self.app_store.current_session.get('name', 'Session'),
            show_back=True,
        )
        self.main_layout.add_widget(header)

        progress = self.app_store.get_wizard_progress()
        ph = ProgressHeader()
        ph.current = progress['current']
        ph.total = progress['total']
        ph.module_name = progress['module_name']
        self.main_layout.add_widget(ph)

        self.status_label = Label(
            text='',
            size_hint_y=None,
            height=30,
            font_size='12sp',
            color=(0.2, 0.6, 0.8, 1),
        )
        self.main_layout.add_widget(self.status_label)

        question = self.app_store.get_current_question()
        if not question:
            self.current_wizard_view = self.WIZARD_STATE_SUMMARY
            self._render_summary_page()
            return

        scroll = ScrollView()
        content = BoxLayout(orientation='vertical', size_hint_y=None, spacing=12, padding=10)
        content.bind(minimum_height=content.setter('height'))
        scroll.add_widget(content)

        self.current_question_widget = QuestionPage(
            question=question,
            response=self.app_store.form_responses.get(question.get("id")),
            on_change=self._on_answer_change,
        )
        content.add_widget(self.current_question_widget)
        self.main_layout.add_widget(scroll)

        nav = NavigationBar()
        nav.on_back = self._on_question_back
        nav.on_next = self._on_question_next
        nav.back_text = '← Zurück'
        nav.back_disabled = False
        nav.next_text = 'Zusammenfassung →' if self.app_store.is_last_question() else 'Weiter →'
        nav.next_disabled = not self.current_question_widget.is_valid()
        self.main_layout.add_widget(nav)

    def _render_summary_page(self):
        """Render summary page."""
        self._showing_summary = True

        header = self._create_header(
            title=self.app_store.current_session.get('name', 'Session'),
            show_back=True,
        )
        self.main_layout.add_widget(header)

        ph = ProgressHeader()
        ph.current = len(self.app_store.wizard_questions or [])
        ph.total = len(self.app_store.wizard_questions or [])
        ph.module_name = ''
        self.main_layout.add_widget(ph)

        self.status_label = Label(
            text=self.app_store.save_status or '',
            size_hint_y=None,
            height=30,
            font_size='12sp',
            color=(0.2, 0.6, 0.8, 1),
        )
        self.main_layout.add_widget(self.status_label)

        scroll = ScrollView()
        content = BoxLayout(orientation='vertical', size_hint_y=None, spacing=12, padding=10)
        content.bind(minimum_height=content.setter('height'))
        scroll.add_widget(content)

        content.add_widget(
            SummaryPage(
                questions=list(self.app_store.wizard_questions or []),
                responses=dict(self.app_store.form_responses or {}),
            )
        )

        submit_btn = Button(
            text='Absenden / Auswerten',
            size_hint_y=None,
            height=60,
            font_size='18sp',
            bold=True,
        )
        submit_btn.bind(on_press=lambda *_: self._on_summary_submit())
        content.add_widget(submit_btn)

        self.main_layout.add_widget(scroll)

        nav = NavigationBar()
        nav.on_back = self._on_summary_back
        nav.on_next = None
        nav.back_text = '← Zurück'
        nav.back_disabled = False
        nav.next_disabled = True
        self.main_layout.add_widget(nav)

    def _render_create_session(self):
        """Render session creation form."""
        layout = BoxLayout(orientation='vertical', padding=20, spacing=15)

        # Title
        title = Label(
            text='Neue Session erstellen',
            size_hint_y=None,
            height=50,
            font_size='22sp',
            bold=True,
        )
        layout.add_widget(title)

        # Session name input
        name_layout = BoxLayout(size_hint_y=None, height=50, spacing=10)
        name_layout.add_widget(Label(text='Name:', size_hint_x=0.3, font_size='16sp'))
        self.session_name_input = TextInput(
            hint_text='Session-Name eingeben',
            multiline=False,
            size_hint_x=0.7,
            font_size='16sp',
        )
        name_layout.add_widget(self.session_name_input)
        layout.add_widget(name_layout)

        # Template selection
        if self.app_store.templates:
            template_layout = BoxLayout(size_hint_y=None, height=50, spacing=10)
            template_layout.add_widget(Label(text='Template:', size_hint_x=0.3, font_size='16sp'))
            template_values = [t['name'] for t in self.app_store.templates]
            self.template_spinner = Spinner(
                text='Template wählen',
                values=template_values,
                size_hint_x=0.7,
                font_size='16sp',
            )
            template_layout.add_widget(self.template_spinner)
            layout.add_widget(template_layout)

        # Status label
        self.status_label = Label(
            text='',
            size_hint_y=None,
            height=30,
            font_size='14sp',
            color=(0.9, 0.3, 0.3, 1),
        )
        layout.add_widget(self.status_label)

        # Spacer
        layout.add_widget(BoxLayout())

        # Buttons
        actions_layout = BoxLayout(size_hint_y=None, height=60, spacing=15)

        back_btn = Button(
            text='Abbrechen',
            size_hint_x=0.4,
            font_size='16sp',
            background_color=(0.7, 0.7, 0.7, 1),
        )
        back_btn.bind(on_press=lambda i: self.app_store.navigate_to('dashboard'))
        actions_layout.add_widget(back_btn)

        create_btn = Button(
            text='Session erstellen',
            size_hint_x=0.6,
            font_size='18sp',
            bold=True,
        )
        create_btn.bind(on_press=self._on_create_session)
        actions_layout.add_widget(create_btn)

        layout.add_widget(actions_layout)

        self.main_layout.add_widget(layout)

    def _render_person_selection(self):
        """Render person selection view."""
        layout = BoxLayout(orientation='vertical', padding=20, spacing=20)

        # Session info
        session = self.app_store.current_session
        title = Label(
            text=session.get('name', 'Session'),
            size_hint_y=None,
            height=60,
            font_size='24sp',
            bold=True,
        )
        layout.add_widget(title)

        # Instruction
        instruction = Label(
            text='Bitte wähle eine Person aus:',
            size_hint_y=None,
            height=50,
            font_size='18sp',
        )
        layout.add_widget(instruction)

        # Person buttons
        person_layout = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=200,
            spacing=15,
            padding=[50, 20, 50, 20],
        )

        person_a_btn = Button(
            text='Person A',
            size_hint_y=None,
            height=70,
            font_size='20sp',
            bold=True,
        )
        person_a_btn.bind(on_press=lambda i: self._select_person('A'))
        person_layout.add_widget(person_a_btn)

        person_b_btn = Button(
            text='Person B',
            size_hint_y=None,
            height=70,
            font_size='20sp',
            bold=True,
        )
        person_b_btn.bind(on_press=lambda i: self._select_person('B'))
        person_layout.add_widget(person_b_btn)

        layout.add_widget(person_layout)

        # Spacer
        layout.add_widget(BoxLayout())

        # Back button
        back_btn = Button(
            text='← Zurück zum Dashboard',
            size_hint=(None, None),
            size=(250, 50),
            pos_hint={'center_x': 0.5},
            font_size='16sp',
            background_color=(0.7, 0.7, 0.7, 1),
        )
        back_btn.bind(on_press=lambda i: self.app_store.navigate_to('dashboard'))
        layout.add_widget(back_btn)

        layout.add_widget(BoxLayout())

        self.main_layout.add_widget(layout)

    def _render_error(self, message: str):
        """Render error message."""
        layout = BoxLayout(orientation='vertical', padding=20, spacing=20)

        error_label = Label(
            text=f'Fehler: {message}',
            font_size='18sp',
            color=(0.9, 0.3, 0.3, 1),
        )
        layout.add_widget(error_label)

        back_btn = Button(
            text='Zurück',
            size_hint=(None, None),
            size=(200, 50),
            pos_hint={'center_x': 0.5},
        )
        back_btn.bind(on_press=lambda i: self.app_store.navigate_to('dashboard'))
        layout.add_widget(back_btn)

        self.main_layout.add_widget(layout)

    def _create_header(self, title: str, show_back: bool = True) -> BoxLayout:
        """Create header with title and optional back button."""
        header = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=60,
            padding=[15, 10, 15, 10],
            spacing=10,
        )

        if show_back:
            back_btn = Button(
                text='←',
                size_hint=(None, None),
                size=(50, 50),
                font_size='24sp',
                background_color=(0.7, 0.7, 0.7, 1),
            )
            back_btn.bind(on_press=self._on_header_back)
            header.add_widget(back_btn)

        title_label = Label(
            text=title,
            font_size='20sp',
            bold=True,
            halign='left',
        )
        header.add_widget(title_label)

        return header

    # ===== Event Handlers =====

    def _on_create_session(self, instance):
        """Handle session creation."""
        if not self.app_store:
            return

        # Get values
        name = getattr(self, 'session_name_input', None)
        template = getattr(self, 'template_spinner', None)

        if not name or not name.text.strip():
            self.status_label.text = 'Bitte gib einen Namen ein'
            return

        if not template or template.text == 'Template wählen':
            self.status_label.text = 'Bitte wähle ein Template'
            return

        # Find template ID
        template_id = None
        for t in self.app_store.templates:
            if t['name'] == template.text:
                template_id = t['id']
                break

        if not template_id:
            self.status_label.text = 'Template nicht gefunden'
            return

        try:
            # Create session
            self.app_store.create_session(
                name=name.text.strip(),
                template_id=template_id,
            )
            # Session will be loaded automatically, triggering re-render
        except Exception as e:
            self.status_label.text = f'Fehler: {str(e)}'

    def _select_person(self, person: str):
        """Select person and load their responses."""
        if not self.app_store or not self.app_store.current_session:
            return

        self.app_store.load_session(
            self.app_store.current_session['id'],
            person=person,
        )

        # Reset wizard state for fresh start
        self._showing_summary = False
        self.app_store.wizard_started = False
        self.app_store.current_question_index = 0
        self.current_wizard_view = self.WIZARD_STATE_START

        # Render will be triggered by session change event
        self._render_view()

    def _on_wizard_start(self):
        """Handle wizard start."""
        self._showing_summary = False
        self.app_store.start_wizard()
        self.current_wizard_view = self.WIZARD_STATE_QUESTION
        self._render_view()

    def _on_question_back(self):
        """Handle back from question page."""
        if not self.app_store:
            return

        if self.app_store.has_unsaved_changes:
            self.app_store.auto_save()

        if self.app_store.is_first_question():
            self.app_store.wizard_started = False
            self.current_wizard_view = self.WIZARD_STATE_START
            self._render_view()
            return

        self.app_store.previous_question()
        self._render_view()

    def _on_question_next(self):
        """Handle next from question page (to summary)."""
        if not self.app_store or not self.app_store.wizard_started:
            return

        if self.current_question_widget and not self.current_question_widget.validate_and_show_error():
            if self.status_label:
                self.status_label.text = 'Bitte prüfe das Feld.'
            return

        if self.app_store.has_unsaved_changes:
            self.app_store.auto_save()

        if self.app_store.is_last_question():
            self._showing_summary = True
            self.current_wizard_view = self.WIZARD_STATE_SUMMARY
            self._render_view()
            return

        self.app_store.next_question()
        self._render_view()

    def _on_summary_back(self):
        """Handle back from summary page."""
        self._showing_summary = False
        self.app_store.current_question_index = max(len(self.app_store.wizard_questions) - 1, 0)
        self.current_wizard_view = self.WIZARD_STATE_QUESTION
        self._render_view()

    def _on_summary_submit(self):
        """Handle summary submit."""
        if not self.app_store:
            return

        try:
            self.app_store.complete_wizard()
            try:
                self.app_store.run_compare()
                self.app_store.navigate_to("compare_report")
            except ValueError:
                if self.status_label:
                    self.status_label.text = "Gespeichert. Vergleich ist erst möglich, wenn Person A und Person B ausgefüllt haben."
            except Exception as e:
                if self.status_label:
                    self.status_label.text = f"Gespeichert, aber Auswertung fehlgeschlagen: {str(e)}"
        except Exception as e:
            if self.status_label:
                self.status_label.text = f"Fehler: {str(e)}"

    def _on_header_back(self, instance):
        """Handle header back button."""
        if self.current_wizard_view == self.WIZARD_STATE_START:
            # Go back to person selection
            self.app_store.current_person = None
            self._showing_summary = False
            self.current_wizard_view = None
            self._render_view()
        elif self.current_wizard_view == self.WIZARD_STATE_QUESTION:
            # Go back to start screen
            self.current_wizard_view = self.WIZARD_STATE_START
            self._showing_summary = False
            self.app_store.wizard_started = False
            self.app_store.current_question_index = 0
            self._render_view()
        else:
            # Default: go to dashboard
            if self.app_store.has_unsaved_changes:
                self.app_store.auto_save()
            self.app_store.navigate_to('dashboard')

    def _on_answer_change(self, question_id: str, response):
        """Handle answer change from question widget."""
        if not self.app_store:
            return
        self.app_store.update_response(question_id, response)
        # Re-render to update Next button state
        self._render_view()
