from __future__ import annotations

from typing import Callable, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.properties import BooleanProperty, StringProperty, ObjectProperty


class NavigationBar(BoxLayout):
    """
    Bottom navigation bar (Zurück / Weiter) with large touch targets.
    """

    back_text = StringProperty("← Zurück")
    next_text = StringProperty("Weiter →")
    back_disabled = BooleanProperty(False)
    next_disabled = BooleanProperty(False)

    on_back = ObjectProperty(None, allownone=True)
    on_next = ObjectProperty(None, allownone=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "horizontal"
        self.size_hint_y = None
        self.height = "72dp"
        self.spacing = 10
        self.padding = [0, 10, 0, 10]

        self.back_btn = Button(text=self.back_text, size_hint_x=0.35, on_press=self._handle_back)
        self.add_widget(self.back_btn)

        self.add_widget(BoxLayout(size_hint_x=0.3))

        self.next_btn = Button(text=self.next_text, size_hint_x=0.35, on_press=self._handle_next)
        self.add_widget(self.next_btn)

        self.bind(back_text=lambda *_: setattr(self.back_btn, "text", self.back_text))
        self.bind(next_text=lambda *_: setattr(self.next_btn, "text", self.next_text))
        self.bind(back_disabled=lambda *_: setattr(self.back_btn, "disabled", self.back_disabled))
        self.bind(next_disabled=lambda *_: setattr(self.next_btn, "disabled", self.next_disabled))

    def _handle_back(self, *_):
        if self.on_back:
            self.on_back()

    def _handle_next(self, *_):
        if self.on_next:
            self.on_next()

