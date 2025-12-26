"""
Central State Store for GameX Mobile

Manages application state with event-driven architecture.
Coordinates between screens and provides auto-save functionality.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable
from pathlib import Path

from kivy.event import EventDispatcher
from kivy.clock import Clock
from kivy.properties import (
    ListProperty,
    DictProperty,
    StringProperty,
    BooleanProperty,
    ObjectProperty,
    NumericProperty,
)

from mobile.storage.sqlite_adapter import SqliteStorage
from mobile.services.template_loader import TemplateLoader
from mobile.services.compare_service import CompareService
from mobile.questionnaire.adapter import flatten_template_questions
from mobile.questionnaire.wizard_state import WizardState


class AppStore(EventDispatcher):
    """
    Central application state store.

    Manages all application data and provides reactive updates
    through Kivy properties and custom events.
    """

    # Template data
    templates = ListProperty([])
    current_template = DictProperty(None, allownone=True)

    # Session data
    sessions = ListProperty([])
    current_session = DictProperty(None, allownone=True)
    current_person = StringProperty(None, allownone=True)  # "A" or "B"

    # Form state
    form_responses = DictProperty({})
    has_unsaved_changes = BooleanProperty(False)
    last_save_time = ObjectProperty(None, allownone=True)
    validation_enabled = BooleanProperty(False)

    # Compare data
    compare_data = DictProperty(None, allownone=True)
    compare_filters = DictProperty({
        'bucket': 'ALL',
        'riskOnly': False,
        'flaggedOnly': False,
        'query': '',
        'moduleId': None,
    })

    # Scenario data
    scenarios = ListProperty([])
    scenario_filters = DictProperty({
        'category': 'ALL',
        'status': 'ALL',
        'gateOnly': False,
    })

    # UI State
    active_view = StringProperty('dashboard')
    form_mode = StringProperty('simple')  # 'simple' or 'detailed'
    save_status = StringProperty('')
    save_status_kind = StringProperty('')  # '', 'success', 'error'
    validation_summary = StringProperty('')

    # Wizard State
    wizard_started = BooleanProperty(False)
    current_question_index = NumericProperty(0)  # Index in flattened question list
    wizard_questions = ListProperty([])  # Flattened list of all questions

    # Auto-save
    auto_save_interval = NumericProperty(5.0)  # seconds
    _auto_save_timer = None

    # Events
    __events__ = ('on_navigate', 'on_session_changed', 'on_template_changed',
                  'on_save_complete', 'on_save_error', 'on_data_loaded',
                  'on_wizard_started', 'on_wizard_completed')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Initialize storage and services
        self.storage = SqliteStorage(self._get_db_path())
        self.template_loader = TemplateLoader()
        self.compare_service = CompareService()
        self._wizard = WizardState()

        # Bind to property changes for auto-save
        self.bind(form_responses=self._on_form_responses_changed)

    def _get_db_path(self) -> Path:
        """Get the database file path."""
        app_dir = Path(__file__).parent
        data_dir = app_dir / 'data'
        data_dir.mkdir(exist_ok=True)
        return data_dir / 'gamex.db'

    def init_app(self):
        """Initialize application data on startup."""
        # Initialize database
        self.storage.init_db()

        # Load templates
        self.load_templates()

        # Load sessions
        self.load_sessions()

        # Dispatch event
        self.dispatch('on_data_loaded')

    # ===== Template Methods =====

    def load_templates(self):
        """Load all available templates."""
        try:
            self.templates = self.template_loader.list_templates()
        except Exception as e:
            print(f"Error loading templates: {e}")
            self.templates = []

    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific template by ID.

        Args:
            template_id: Template identifier

        Returns:
            Template dictionary or None if not found
        """
        return self.template_loader.load_template(template_id)

    def set_current_template(self, template_id: str):
        """
        Set the current template for a new session.

        Args:
            template_id: Template identifier
        """
        template = self.get_template(template_id)
        if template:
            self.current_template = template
            self.dispatch('on_template_changed')

    # ===== Session Methods =====

    def load_sessions(self):
        """Load all sessions from storage."""
        try:
            self.sessions = self.storage.list_sessions()
        except Exception as e:
            print(f"Error loading sessions: {e}")
            self.sessions = []

    def create_session(self, name: str, template_id: str) -> str:
        """
        Create a new session.

        Args:
            name: Session name
            template_id: Template to use

        Returns:
            Session ID
        """
        session_id = self.storage.create_session(
            name=name,
            template_id=template_id,
        )

        # Reload sessions
        self.load_sessions()

        # Set as current session
        self.load_session(session_id)

        return session_id

    def load_session(self, session_id: str, person: Optional[str] = None):
        """
        Load a session and optionally set the person.

        Args:
            session_id: Session identifier
            person: Person identifier ("A" or "B"), optional
        """
        try:
            # Get session info
            session = self.storage.get_session(session_id)
            self.current_session = session

            # Load template
            self.current_template = self.get_template(session['template_id'])

            # Load responses if person is specified
            if person:
                self.current_person = person
                responses = self.storage.load_responses(
                    session_id=session_id,
                    person=person,
                )
                self.form_responses = responses or {}
            else:
                self.current_person = None
                self.form_responses = {}

            # Reset unsaved changes
            self.has_unsaved_changes = False

            # Dispatch event
            self.dispatch('on_session_changed')

        except Exception as e:
            print(f"Error loading session: {e}")
            raise

    def delete_session(self, session_id: str):
        """
        Delete a session.

        Args:
            session_id: Session identifier
        """
        # TODO: Implement delete in storage adapter
        # For now, just reload sessions
        self.load_sessions()

    # ===== Response Methods =====

    def update_response(self, question_id: str, response: Any):
        """
        Update a single response.

        Args:
            question_id: Question identifier
            response: Response value
        """
        responses = dict(self.form_responses)
        responses[question_id] = response
        self.form_responses = responses
        self.has_unsaved_changes = True

    def save_responses(self):
        """Save current responses to storage."""
        if not self.current_session or not self.current_person:
            raise ValueError("No active session or person selected")

        try:
            self.storage.save_responses(
                session_id=self.current_session['id'],
                person=self.current_person,
                responses=self.form_responses,
            )

            self.has_unsaved_changes = False
            self.last_save_time = datetime.now(timezone.utc)
            self.save_status = 'Gespeichert'
            self.save_status_kind = 'success'

            # Clear status after 3 seconds
            Clock.schedule_once(lambda dt: self._clear_save_status(), 3.0)

            self.dispatch('on_save_complete')

        except Exception as e:
            print(f"Error saving responses: {e}")
            self.save_status = f'Fehler: {str(e)}'
            self.save_status_kind = 'error'
            self.dispatch('on_save_error')
            raise

    def auto_save(self, *args):
        """Auto-save responses if there are unsaved changes."""
        if self.has_unsaved_changes and self.current_session and self.current_person:
            try:
                self.save_responses()
            except Exception as e:
                print(f"Auto-save failed: {e}")

    def _on_form_responses_changed(self, instance, value):
        """Handle form responses changes for auto-save."""
        # Cancel existing timer
        if self._auto_save_timer:
            self._auto_save_timer.cancel()

        # Schedule new auto-save
        if self.has_unsaved_changes:
            self._auto_save_timer = Clock.schedule_once(
                self.auto_save,
                self.auto_save_interval
            )

    def _clear_save_status(self):
        """Clear save status message."""
        self.save_status = ''
        self.save_status_kind = ''

    # ===== Compare Methods =====

    def run_compare(self):
        """Run comparison for current session."""
        if not self.current_session:
            raise ValueError("No active session")

        try:
            # Load both responses
            resp_a = self.storage.load_responses(
                session_id=self.current_session['id'],
                person='A',
            )
            resp_b = self.storage.load_responses(
                session_id=self.current_session['id'],
                person='B',
            )

            if not resp_a or not resp_b:
                raise ValueError("Need both A and B responses to compare")

            # Run comparison
            self.compare_data = self.compare_service.compare(
                template=self.current_template,
                resp_a=resp_a,
                resp_b=resp_b,
            )

        except Exception as e:
            print(f"Error running compare: {e}")
            raise

    # ===== Navigation =====

    def navigate_to(self, screen_name: str):
        """
        Navigate to a specific screen.

        Args:
            screen_name: Target screen name
        """
        self.active_view = screen_name
        self.dispatch('on_navigate', screen_name)

    # ===== Event Handlers (must be defined) =====

    def on_navigate(self, screen_name: str):
        """Event: Navigation occurred."""
        pass

    def on_session_changed(self):
        """Event: Current session changed."""
        pass

    def on_template_changed(self):
        """Event: Current template changed."""
        pass

    def on_save_complete(self):
        """Event: Save completed successfully."""
        pass

    def on_save_error(self):
        """Event: Save failed."""
        pass

    def on_data_loaded(self):
        """Event: Initial data loaded."""
        pass

    def on_wizard_started(self):
        """Event: Wizard flow started."""
        pass

    def on_wizard_completed(self):
        """Event: Wizard flow completed."""
        pass

    # ===== Wizard Methods =====

    def start_wizard(self):
        """
        Start the wizard flow.

        Flattens template questions and initializes wizard state.
        """
        if not self.current_template:
            raise ValueError("No template loaded")

        # Build structured question list (JSON-friendly dicts)
        questions = flatten_template_questions(self.current_template)
        self.wizard_questions = questions

        self._wizard.start(questions)
        self.current_question_index = self._wizard.index
        self.wizard_started = self._wizard.started

        self.dispatch('on_wizard_started')

    def next_question(self) -> bool:
        """
        Move to next question.

        Returns:
            True if moved, False if already at last question
        """
        moved = self._wizard.next()
        self.current_question_index = self._wizard.index
        return moved

    def previous_question(self) -> bool:
        """
        Move to previous question.

        Returns:
            True if moved, False if already at first question
        """
        moved = self._wizard.prev()
        self.current_question_index = self._wizard.index
        return moved

    def get_current_question(self) -> Optional[Dict[str, Any]]:
        """
        Get current question.

        Returns:
            Question dict or None if wizard not started
        """
        if not self.wizard_started:
            return None

        # Ensure internal wizard state matches Kivy properties without
        # performing unnecessary copies on every call.
        self._sync_wizard_state_from_properties()
        return self._wizard.current()

    def _sync_wizard_state_from_properties(self) -> None:
        """
        Synchronize the internal wizard state from the public properties
        in a lightweight way, avoiding redundant list copies and assignments.
        """
        # Keep questions list in sync only if the reference has changed.
        if self._wizard.questions is not self.wizard_questions:
            self._wizard.questions = list(self.wizard_questions or [])

        # Ensure the started flag is consistent.
        if not self._wizard.started and self.wizard_started:
            self._wizard.started = True

        # Sync the current index only when it differs.
        desired_index = int(self.current_question_index)
        if self._wizard.index != desired_index:
            self._wizard.index = desired_index
    def is_last_question(self) -> bool:
        """Check if current question is the last one."""
        if not self.wizard_questions:
            return False
        return int(self.current_question_index) == len(self.wizard_questions) - 1

    def is_first_question(self) -> bool:
        """Check if current question is the first one."""
        return int(self.current_question_index) == 0

    def get_wizard_progress(self) -> Dict[str, int]:
        """
        Get wizard progress info.

        Returns:
            Dict with 'current' (1-indexed), 'total', 'module_name'
        """
        if not self.wizard_started:
            return {'current': 0, 'total': 0, 'module_name': ''}

        current_q = self.get_current_question()
        return {
            'current': self.current_question_index + 1,
            'total': len(self.wizard_questions),
            'module_name': current_q.get('moduleName', '') if current_q else '',
        }

    def complete_wizard(self):
        """Mark wizard as completed and save."""
        self._wizard.stop()
        self.wizard_started = False
        self.save_responses()
        self.dispatch('on_wizard_completed')
