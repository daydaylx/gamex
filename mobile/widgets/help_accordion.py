from __future__ import annotations

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.properties import BooleanProperty, StringProperty

from mobile.widgets.ui_helpers import make_wrapped_label


class HelpAccordion(BoxLayout):
    """
    Collapsible help text ("Was bedeutet das?") for long/optional explanations.
    """

    expanded = BooleanProperty(False)
    help_text = StringProperty("")
    details_text = StringProperty("")

    def __init__(self, help_text: str = "", details_text: str = "", **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = 6
        self.size_hint_y = None
        self.height = 0
        self.padding = [0, 0, 0, 0]

        self.help_text = help_text or ""
        self.details_text = details_text or ""

        if not (self.help_text.strip() or self.details_text.strip()):
            # Nothing to render
            return

        self.toggle_btn = Button(
            text="Was bedeutet das?",
            size_hint_y=None,
            height="44dp",
            on_press=self._toggle,
        )
        self.add_widget(self.toggle_btn)

        body = "\n\n".join([t for t in [self.help_text.strip(), self.details_text.strip()] if t])
        self.body_label = make_wrapped_label(
            body,
            font_size="14sp",
            color=(0.35, 0.35, 0.35, 1),
        )
        self.body_label.opacity = 0
        self.body_label.height = 0
        self.add_widget(self.body_label)

        self.bind(expanded=self._sync)
        self._sync()

    def _toggle(self, *_):
        self.expanded = not self.expanded

    def _sync(self, *_):
        if not hasattr(self, "toggle_btn"):
            return

        if self.expanded:
            self.toggle_btn.text = "Hilfe ausblenden"
            self.body_label.opacity = 1
            # Force Kivy to recompute the label's texture/height based on the current text
            self.body_label.text = self.body_label.text
        else:
            self.toggle_btn.text = "Was bedeutet das?"
            self.body_label.opacity = 0
            self.body_label.height = 0

        # Recompute total height
        h = self.toggle_btn.height
        if self.expanded:
            h += self.body_label.height + self.spacing
        self.height = h

