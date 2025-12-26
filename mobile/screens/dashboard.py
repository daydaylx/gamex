"""Dashboard Screen - Main application entry point."""
from __future__ import annotations

from typing import TYPE_CHECKING

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.properties import ObjectProperty

if TYPE_CHECKING:
    from mobile.store import AppStore


class DashboardScreen(Screen):
    """
    Dashboard screen showing overview and quick actions.

    Displays:
    - Recent sessions
    - Quick start options
    - Navigation to other sections
    """

    app_store = ObjectProperty(None)

    def __init__(self, app_store: AppStore, **kwargs):
        super().__init__(**kwargs)
        self.app_store = app_store

        # Main layout
        main_layout = BoxLayout(orientation='vertical', padding=20, spacing=15)

        # Header
        header = Label(
            text='GameX - Intimacy & Communication',
            size_hint_y=None,
            height=60,
            font_size='20sp',
            bold=True,
        )
        main_layout.add_widget(header)

        # Quick actions
        actions_layout = BoxLayout(orientation='vertical', spacing=10, size_hint_y=None)
        actions_layout.bind(minimum_height=actions_layout.setter('height'))

        # New session button
        new_session_btn = Button(
            text='Neue Session erstellen',
            size_hint_y=None,
            height=50,
            on_press=self._on_new_session,
        )
        actions_layout.add_widget(new_session_btn)

        # Sessions button
        sessions_btn = Button(
            text='Sessions anzeigen',
            size_hint_y=None,
            height=50,
            on_press=lambda x: self._navigate_to_sessions(),
        )
        actions_layout.add_widget(sessions_btn)

        # Scenarios button
        scenarios_btn = Button(
            text='Szenarien erkunden',
            size_hint_y=None,
            height=50,
            on_press=lambda x: self.app_store.navigate_to('scenarios'),
        )
        actions_layout.add_widget(scenarios_btn)

        # Settings button
        settings_btn = Button(
            text='Einstellungen',
            size_hint_y=None,
            height=50,
            on_press=lambda x: self.app_store.navigate_to('settings'),
        )
        actions_layout.add_widget(settings_btn)

        main_layout.add_widget(actions_layout)

        # Recent sessions section
        recent_label = Label(
            text='Letzte Sessions',
            size_hint_y=None,
            height=40,
            font_size='16sp',
        )
        main_layout.add_widget(recent_label)

        # Sessions scroll view
        self.sessions_scroll = ScrollView()
        self.sessions_layout = BoxLayout(
            orientation='vertical',
            spacing=10,
            size_hint_y=None,
        )
        self.sessions_layout.bind(minimum_height=self.sessions_layout.setter('height'))
        self.sessions_scroll.add_widget(self.sessions_layout)
        main_layout.add_widget(self.sessions_scroll)

        self.add_widget(main_layout)

        # Bind to store updates
        if self.app_store:
            self.app_store.bind(sessions=self._update_sessions)

    def on_enter(self):
        """Called when screen is entered."""
        # Refresh sessions
        if self.app_store:
            self.app_store.load_sessions()
            self._update_sessions()

    def _update_sessions(self, *args):
        """Update the sessions list display."""
        self.sessions_layout.clear_widgets()

        if not self.app_store or not self.app_store.sessions:
            no_sessions = Label(
                text='Keine Sessions vorhanden',
                size_hint_y=None,
                height=40,
            )
            self.sessions_layout.add_widget(no_sessions)
            return

        # Display recent sessions (max 5)
        for session in self.app_store.sessions[:5]:
            session_btn = Button(
                text=f"{session['name']}\n{session['created_at'][:10]}",
                size_hint_y=None,
                height=60,
                on_press=lambda x, s=session: self._on_session_select(s),
            )
            self.sessions_layout.add_widget(session_btn)

    def _on_new_session(self, instance):
        """Handle new session button press."""
        # Navigate to session form with no session (create mode)
        if self.app_store:
            self.app_store.current_session = None
            self.app_store.navigate_to('session_form')

    def _navigate_to_sessions(self):
        """Navigate to sessions overview."""
        # For now, just show in dashboard
        # Could create separate sessions screen later
        pass

    def _on_session_select(self, session):
        """
        Handle session selection.

        Args:
            session: Selected session dict
        """
        if self.app_store:
            # Load session (without person initially)
            self.app_store.load_session(session['id'])
            # Navigate to session form
            self.app_store.navigate_to('session_form')
