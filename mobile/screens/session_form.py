"""Session Form Screen - Questionnaire interface."""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.spinner import Spinner
from kivy.properties import ObjectProperty, StringProperty

if TYPE_CHECKING:
    from mobile.store import AppStore


class SessionFormScreen(Screen):
    """
    Session form screen for answering questionnaires.

    Supports:
    - Creating new sessions
    - Selecting person (A or B)
    - Answering questions
    - Auto-save functionality
    - Navigation to compare
    """

    app_store = ObjectProperty(None)
    mode = StringProperty('simple')  # 'simple' or 'detailed'

    def __init__(self, app_store: AppStore, **kwargs):
        super().__init__(**kwargs)
        self.app_store = app_store

        # Main layout
        self.main_layout = BoxLayout(orientation='vertical', padding=10, spacing=10)

        # Header section
        self.header_layout = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=120,
            spacing=5,
        )

        # Title
        self.title_label = Label(
            text='Session',
            size_hint_y=None,
            height=40,
            font_size='18sp',
            bold=True,
        )
        self.header_layout.add_widget(self.title_label)

        # Person selection
        person_layout = BoxLayout(size_hint_y=None, height=40, spacing=10)
        person_layout.add_widget(Label(text='Person:', size_hint_x=0.3))
        self.person_spinner = Spinner(
            text='Person wählen',
            values=('Person A', 'Person B'),
            size_hint_x=0.7,
        )
        self.person_spinner.bind(text=self._on_person_selected)
        person_layout.add_widget(self.person_spinner)
        self.header_layout.add_widget(person_layout)

        # Action buttons
        actions_layout = BoxLayout(size_hint_y=None, height=40, spacing=10)

        self.save_btn = Button(text='Speichern', on_press=self._on_save)
        actions_layout.add_widget(self.save_btn)

        self.compare_btn = Button(text='Vergleichen', on_press=self._on_compare)
        actions_layout.add_widget(self.compare_btn)

        back_btn = Button(text='Zurück', on_press=self._on_back)
        actions_layout.add_widget(back_btn)

        self.header_layout.add_widget(actions_layout)

        self.main_layout.add_widget(self.header_layout)

        # Status message
        self.status_label = Label(
            text='',
            size_hint_y=None,
            height=30,
            font_size='12sp',
        )
        self.main_layout.add_widget(self.status_label)

        # Form content (scrollable)
        self.form_scroll = ScrollView()
        self.form_layout = BoxLayout(
            orientation='vertical',
            spacing=15,
            size_hint_y=None,
            padding=10,
        )
        self.form_layout.bind(minimum_height=self.form_layout.setter('height'))
        self.form_scroll.add_widget(self.form_layout)
        self.main_layout.add_widget(self.form_scroll)

        self.add_widget(self.main_layout)

        # Bind to store
        if self.app_store:
            self.app_store.bind(current_session=self._on_session_changed)
            self.app_store.bind(save_status=self._update_status)

    def on_enter(self):
        """Called when screen is entered."""
        self._render_form()

    def _on_session_changed(self, *args):
        """Handle session change."""
        self._render_form()

    def _render_form(self):
        """Render the form based on current session and template."""
        self.form_layout.clear_widgets()

        if not self.app_store:
            return

        # Check if we need to create a new session
        if not self.app_store.current_session:
            self._render_create_session()
            return

        # Update title
        session = self.app_store.current_session
        self.title_label.text = session.get('name', 'Session')

        # Check if person is selected
        if not self.app_store.current_person:
            info = Label(
                text='Bitte wähle eine Person (A oder B)',
                size_hint_y=None,
                height=40,
            )
            self.form_layout.add_widget(info)
            return

        # Render questions
        template = self.app_store.current_template
        if not template:
            error = Label(
                text='Template nicht gefunden',
                size_hint_y=None,
                height=40,
            )
            self.form_layout.add_widget(error)
            return

        self._render_questions(template)

    def _render_create_session(self):
        """Render session creation form."""
        self.title_label.text = 'Neue Session erstellen'

        # Session name input
        name_layout = BoxLayout(size_hint_y=None, height=40, spacing=10)
        name_layout.add_widget(Label(text='Name:', size_hint_x=0.3))
        self.session_name_input = TextInput(
            hint_text='Session-Name',
            multiline=False,
            size_hint_x=0.7,
        )
        name_layout.add_widget(self.session_name_input)
        self.form_layout.add_widget(name_layout)

        # Template selection
        if self.app_store.templates:
            template_layout = BoxLayout(size_hint_y=None, height=40, spacing=10)
            template_layout.add_widget(Label(text='Template:', size_hint_x=0.3))
            template_values = [t['name'] for t in self.app_store.templates]
            self.template_spinner = Spinner(
                text='Template wählen',
                values=template_values,
                size_hint_x=0.7,
            )
            template_layout.add_widget(self.template_spinner)
            self.form_layout.add_widget(template_layout)

        # Create button
        create_btn = Button(
            text='Session erstellen',
            size_hint_y=None,
            height=50,
            on_press=self._on_create_session,
        )
        self.form_layout.add_widget(create_btn)

    def _render_questions(self, template):
        """Render questionnaire questions."""
        # For now, just show a placeholder
        # Full implementation would iterate through template questions
        info = Label(
            text=f'Formular für Template: {template.get("name", "Unknown")}\n\n'
                 '(Fragen werden hier angezeigt)',
            size_hint_y=None,
            height=100,
        )
        self.form_layout.add_widget(info)

        # Add sample question
        q_label = Label(
            text='Beispiel-Frage:',
            size_hint_y=None,
            height=30,
        )
        self.form_layout.add_widget(q_label)

        # Sample answer input
        answer_input = TextInput(
            hint_text='Antwort eingeben',
            multiline=True,
            size_hint_y=None,
            height=100,
        )
        self.form_layout.add_widget(answer_input)

    def _on_person_selected(self, spinner, text):
        """Handle person selection."""
        if not self.app_store or not self.app_store.current_session:
            return

        person = 'A' if 'A' in text else 'B'

        # Load session with person
        self.app_store.load_session(
            self.app_store.current_session['id'],
            person=person,
        )

        self._render_form()

    def _on_create_session(self, instance):
        """Handle session creation."""
        if not self.app_store:
            return

        # Get values
        name = getattr(self, 'session_name_input', None)
        template = getattr(self, 'template_spinner', None)

        if not name or not name.text:
            self.status_label.text = 'Fehler: Bitte Namen eingeben'
            return

        if not template or template.text == 'Template wählen':
            self.status_label.text = 'Fehler: Bitte Template wählen'
            return

        # Find template ID
        template_id = None
        for t in self.app_store.templates:
            if t['name'] == template.text:
                template_id = t['id']
                break

        if not template_id:
            self.status_label.text = 'Fehler: Template nicht gefunden'
            return

        try:
            # Create session
            session_id = self.app_store.create_session(
                name=name.text,
                template_id=template_id,
            )
            self.status_label.text = 'Session erstellt!'
            self._render_form()
        except Exception as e:
            self.status_label.text = f'Fehler: {str(e)}'

    def _on_save(self, instance):
        """Handle save button press."""
        if self.app_store and self.app_store.current_session and self.app_store.current_person:
            try:
                self.app_store.save_responses()
            except Exception as e:
                self.status_label.text = f'Fehler beim Speichern: {str(e)}'

    def _on_compare(self, instance):
        """Handle compare button press."""
        if self.app_store and self.app_store.current_session:
            try:
                # Run comparison
                self.app_store.run_compare()
                # Navigate to compare screen
                self.app_store.navigate_to('compare_report')
            except Exception as e:
                self.status_label.text = f'Fehler: {str(e)}'

    def _on_back(self, instance):
        """Handle back button press."""
        if self.app_store:
            # Save if needed
            if self.app_store.has_unsaved_changes:
                self.app_store.auto_save()
            # Navigate back
            self.app_store.navigate_to('dashboard')

    def _update_status(self, *args):
        """Update status label from store."""
        if self.app_store:
            status = self.app_store.save_status
            if status:
                self.status_label.text = status
