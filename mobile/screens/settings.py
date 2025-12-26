"""Settings Screen - Application settings and preferences."""
from __future__ import annotations

from typing import TYPE_CHECKING

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.switch import Switch
from kivy.properties import ObjectProperty

if TYPE_CHECKING:
    from mobile.store import AppStore


class SettingsScreen(Screen):
    """
    Settings screen for app configuration.

    Includes:
    - Auto-save settings
    - Validation settings
    - Data management (backup/restore)
    - About information
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
            text='Einstellungen',
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

        # Settings content (scrollable)
        settings_scroll = ScrollView()
        self.settings_layout = BoxLayout(
            orientation='vertical',
            spacing=15,
            size_hint_y=None,
            padding=10,
        )
        self.settings_layout.bind(
            minimum_height=self.settings_layout.setter('height')
        )
        settings_scroll.add_widget(self.settings_layout)
        main_layout.add_widget(settings_scroll)

        self.add_widget(main_layout)

        # Render settings
        self._render_settings()

    def _render_settings(self):
        """Render settings options."""
        # Auto-save setting
        autosave_layout = BoxLayout(size_hint_y=None, height=40)
        autosave_layout.add_widget(Label(text='Auto-Speichern'))
        autosave_switch = Switch(active=True)
        autosave_layout.add_widget(autosave_switch)
        self.settings_layout.add_widget(autosave_layout)

        # Validation setting
        validation_layout = BoxLayout(size_hint_y=None, height=40)
        validation_layout.add_widget(Label(text='Validierung'))
        validation_switch = Switch(active=False)
        if self.app_store:
            validation_switch.bind(
                active=lambda instance, value: setattr(
                    self.app_store, 'validation_enabled', value
                )
            )
        validation_layout.add_widget(validation_switch)
        self.settings_layout.add_widget(validation_layout)

        # Data management section
        data_label = Label(
            text='Datenverwaltung',
            size_hint_y=None,
            height=40,
            font_size='16sp',
            bold=True,
        )
        self.settings_layout.add_widget(data_label)

        # Backup button
        backup_btn = Button(
            text='Backup erstellen',
            size_hint_y=None,
            height=50,
            on_press=self._on_backup,
        )
        self.settings_layout.add_widget(backup_btn)

        # Restore button
        restore_btn = Button(
            text='Backup wiederherstellen',
            size_hint_y=None,
            height=50,
            on_press=self._on_restore,
        )
        self.settings_layout.add_widget(restore_btn)

        # About section
        about_label = Label(
            text='Über',
            size_hint_y=None,
            height=40,
            font_size='16sp',
            bold=True,
        )
        self.settings_layout.add_widget(about_label)

        # Version info
        version_label = Label(
            text='GameX Mobile v1.0.0\n\n'
                 'Eine mobile Anwendung für\n'
                 'Intimität und Kommunikation in Beziehungen.',
            size_hint_y=None,
            height=100,
        )
        self.settings_layout.add_widget(version_label)

    def _on_backup(self, instance):
        """Handle backup button press."""
        # TODO: Implement backup functionality
        pass

    def _on_restore(self, instance):
        """Handle restore button press."""
        # TODO: Implement restore functionality
        pass

    def _on_back(self, instance):
        """Handle back button press."""
        if self.app_store:
            self.app_store.navigate_to('dashboard')
