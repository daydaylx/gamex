"""
GameX Mobile - Kivy Application Entry Point

A mobile-optimized Kivy application for relationship communication and intimacy exploration.
Ports functionality from the web app with offline-first architecture.
"""
from __future__ import annotations

import os
from pathlib import Path

from kivy.app import App
from kivy.config import Config
from kivy.core.window import Window
from kivy.uix.screenmanager import ScreenManager, Screen, SlideTransition

# Configure Kivy before importing other Kivy modules
Config.set('kivy', 'exit_on_escape', '0')
Config.set('graphics', 'width', '360')
Config.set('graphics', 'height', '640')
Config.set('graphics', 'minimum_width', '320')
Config.set('graphics', 'minimum_height', '480')

from mobile.screens.dashboard import DashboardScreen
from mobile.screens.session_form import SessionFormScreen
from mobile.screens.compare_report import CompareReportScreen
from mobile.screens.scenarios import ScenariosScreen
from mobile.screens.settings import SettingsScreen
from mobile.store import AppStore


class GameXApp(App):
    """
    Main Kivy application for GameX Mobile.

    Manages screen navigation and integrates with the central AppStore
    for state management across all screens.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.store = AppStore()
        self.sm = None

    def build(self):
        """
        Build the application UI.

        Returns:
            ScreenManager: Root widget containing all application screens
        """
        # Set app title
        self.title = 'GameX - Intimacy & Communication'

        # Create screen manager with slide transition
        self.sm = ScreenManager(transition=SlideTransition(duration=0.2))

        # Initialize screens
        self.sm.add_widget(DashboardScreen(name='dashboard', app_store=self.store))
        self.sm.add_widget(SessionFormScreen(name='session_form', app_store=self.store))
        self.sm.add_widget(CompareReportScreen(name='compare_report', app_store=self.store))
        self.sm.add_widget(ScenariosScreen(name='scenarios', app_store=self.store))
        self.sm.add_widget(SettingsScreen(name='settings', app_store=self.store))

        # Start with dashboard
        self.sm.current = 'dashboard'

        # Setup app store callbacks
        self._setup_store_bindings()

        # Initialize data
        self.store.init_app()

        return self.sm

    def _setup_store_bindings(self):
        """Setup event bindings between store and screens."""
        # Listen for navigation events from store
        self.store.bind(on_navigate=self._on_navigate)

    def _on_navigate(self, instance, screen_name: str):
        """
        Handle navigation events from store.

        Args:
            instance: Store instance
            screen_name: Target screen name
        """
        if screen_name in self.sm.screen_names:
            self.sm.current = screen_name

    def on_start(self):
        """Called when the application starts."""
        # Setup keyboard handling for Android back button
        Window.bind(on_keyboard=self._on_keyboard)

    def on_pause(self):
        """
        Called when app is paused (Android home button).

        Returns:
            bool: True to allow pause, False to prevent
        """
        # Save any pending changes
        self.store.auto_save()
        return True

    def on_resume(self):
        """Called when app resumes from pause."""
        # Refresh data if needed
        pass

    def _on_keyboard(self, window, key, *args):
        """
        Handle keyboard events (especially Android back button).

        Args:
            window: Window instance
            key: Key code (27 = back button on Android)

        Returns:
            bool: True if handled, False otherwise
        """
        if key == 27:  # Back button
            return self._handle_back_button()
        return False

    def _handle_back_button(self) -> bool:
        """
        Handle Android back button press.

        Returns:
            bool: True if handled, False to exit app
        """
        current = self.sm.current

        # From any screen except dashboard, go back to dashboard
        if current != 'dashboard':
            self.sm.current = 'dashboard'
            return True

        # From dashboard, allow app to exit
        return False


def main():
    """Application entry point."""
    # Ensure required directories exist
    app_dir = Path(__file__).parent
    data_dir = app_dir / 'data'
    data_dir.mkdir(exist_ok=True)

    # Run the app
    GameXApp().run()


if __name__ == '__main__':
    main()
