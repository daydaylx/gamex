"""Compare Report Screen - Display comparison results."""
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


class CompareReportScreen(Screen):
    """
    Compare report screen showing comparison results.

    Displays:
    - Summary statistics
    - Matched/mismatched items
    - Action plan
    - Export options
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
            text='Vergleichsbericht',
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

        # Report content (scrollable)
        self.report_scroll = ScrollView()
        self.report_layout = BoxLayout(
            orientation='vertical',
            spacing=15,
            size_hint_y=None,
            padding=10,
        )
        self.report_layout.bind(minimum_height=self.report_layout.setter('height'))
        self.report_scroll.add_widget(self.report_layout)
        main_layout.add_widget(self.report_scroll)

        self.add_widget(main_layout)

        # Bind to store
        if self.app_store:
            self.app_store.bind(compare_data=self._render_report)

    def on_enter(self):
        """Called when screen is entered."""
        self._render_report()

    def _render_report(self, *args):
        """Render the comparison report."""
        self.report_layout.clear_widgets()

        if not self.app_store or not self.app_store.compare_data:
            no_data = Label(
                text='Keine Vergleichsdaten vorhanden.\n\n'
                     'Bitte erst beide Personen A und B antworten lassen,\n'
                     'dann "Vergleichen" drücken.',
                size_hint_y=None,
                height=100,
            )
            self.report_layout.add_widget(no_data)
            return

        compare_data = self.app_store.compare_data

        # Summary section
        self._add_summary(compare_data.get('summary', {}))

        # Items section
        self._add_items(compare_data.get('items', []))

        # Action plan section
        action_plan = compare_data.get('action_plan')
        if action_plan:
            self._add_action_plan(action_plan)

    def _add_summary(self, summary):
        """Add summary section."""
        summary_label = Label(
            text='Zusammenfassung',
            size_hint_y=None,
            height=40,
            font_size='16sp',
            bold=True,
        )
        self.report_layout.add_widget(summary_label)

        # Display summary stats
        total = summary.get('total_questions', 0)
        matches = summary.get('matches', 0)
        partial = summary.get('partial_matches', 0)
        mismatches = summary.get('mismatches', 0)

        stats_text = (
            f'Gesamt: {total}\n'
            f'Übereinstimmungen: {matches}\n'
            f'Teilweise: {partial}\n'
            f'Unterschiede: {mismatches}'
        )

        stats_label = Label(
            text=stats_text,
            size_hint_y=None,
            height=100,
        )
        self.report_layout.add_widget(stats_label)

    def _add_items(self, items):
        """Add items section."""
        if not items:
            return

        items_label = Label(
            text=f'Details ({len(items)} Einträge)',
            size_hint_y=None,
            height=40,
            font_size='16sp',
            bold=True,
        )
        self.report_layout.add_widget(items_label)

        # Show first few items as examples
        for item in items[:5]:
            item_text = (
                f"• {item.get('question', 'Frage')}\n"
                f"  Status: {item.get('status', 'unknown')}"
            )
            item_label = Label(
                text=item_text,
                size_hint_y=None,
                height=60,
                text_size=(self.width - 40, None),
            )
            item_label.bind(
                width=lambda instance, value: setattr(
                    instance, 'text_size', (value - 40, None)
                )
            )
            self.report_layout.add_widget(item_label)

        if len(items) > 5:
            more_label = Label(
                text=f'... und {len(items) - 5} weitere',
                size_hint_y=None,
                height=30,
            )
            self.report_layout.add_widget(more_label)

    def _add_action_plan(self, action_plan):
        """Add action plan section."""
        plan_label = Label(
            text='Aktionsplan',
            size_hint_y=None,
            height=40,
            font_size='16sp',
            bold=True,
        )
        self.report_layout.add_widget(plan_label)

        # Display action items
        for i, action in enumerate(action_plan[:10], 1):
            action_text = f"{i}. {action.get('text', 'Aktion')}"
            action_label = Label(
                text=action_text,
                size_hint_y=None,
                height=40,
                text_size=(self.width - 40, None),
            )
            action_label.bind(
                width=lambda instance, value: setattr(
                    instance, 'text_size', (value - 40, None)
                )
            )
            self.report_layout.add_widget(action_label)

    def _on_back(self, instance):
        """Handle back button press."""
        if self.app_store:
            self.app_store.navigate_to('session_form')
