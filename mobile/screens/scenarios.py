"""Scenarios Screen - Browse and explore scenarios."""
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


class ScenariosScreen(Screen):
    """
    Scenarios screen for exploring various scenarios.

    Displays:
    - Scenario categories
    - Scenario cards
    - Filtering options
    """

    app_store = ObjectProperty(None)

    def __init__(self, app_store: AppStore, **kwargs):
        super().__init__(**kwargs)
        self.app_store = app_store

        # Main layout
        main_layout = BoxLayout(orientation='vertical', padding=10, spacing=10)

        # Header
        header_layout = BoxLayout(size_hint_y=None, height=60, spacing=10)

        title = Label(
            text='Szenarien',
            font_size='18sp',
            bold=True,
        )
        header_layout.add_widget(title)

        back_btn = Button(
            text='Zurück',
            size_hint_x=0.3,
            on_press=self._on_back,
        )
        header_layout.add_widget(back_btn)

        main_layout.add_widget(header_layout)

        # Scenarios content (scrollable)
        self.scenarios_scroll = ScrollView()
        self.scenarios_layout = BoxLayout(
            orientation='vertical',
            spacing=15,
            size_hint_y=None,
            padding=10,
        )
        self.scenarios_layout.bind(
            minimum_height=self.scenarios_layout.setter('height')
        )
        self.scenarios_scroll.add_widget(self.scenarios_layout)
        main_layout.add_widget(self.scenarios_scroll)

        self.add_widget(main_layout)

    def on_enter(self):
        """Called when screen is entered."""
        self._render_scenarios()

    def _render_scenarios(self):
        """Render scenarios list."""
        self.scenarios_layout.clear_widgets()

        # Placeholder content
        info = Label(
            text='Szenarien-Funktion\n\n'
                 'Hier können verschiedene Szenarien\n'
                 'erkundet und durchgespielt werden.\n\n'
                 '(In Entwicklung)',
            size_hint_y=None,
            height=150,
        )
        self.scenarios_layout.add_widget(info)

    def _on_back(self, instance):
        """Handle back button press."""
        if self.app_store:
            self.app_store.navigate_to('dashboard')
