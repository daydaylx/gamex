from __future__ import annotations

from typing import Any, Dict, List

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.scrollview import ScrollView

from mobile.questionnaire.validation import format_response_for_summary, validate_response
from mobile.widgets.ui_helpers import make_wrapped_label


class SummaryPage(BoxLayout):
    """
    Summary of all answers (read-only).
    """

    def __init__(self, *, questions: List[Dict[str, Any]], responses: Dict[str, Any], **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = 12
        self.padding = [10, 10, 10, 10]

        self.add_widget(make_wrapped_label("Zusammenfassung", font_size="22sp", bold=True))
        self.add_widget(
            make_wrapped_label(
                "Bitte prüfe deine Antworten. Du kannst jederzeit zurückgehen und etwas ändern.",
                font_size="15sp",
                color=(0.35, 0.35, 0.35, 1),
            )
        )

        scroll = ScrollView()
        container = BoxLayout(orientation="vertical", spacing=10, size_hint_y=None)
        container.bind(minimum_height=container.setter("height"))
        scroll.add_widget(container)
        self.add_widget(scroll)

        for q in questions:
            qid = q.get("id")
            title = q.get("title") or qid
            resp = responses.get(qid)
            answer_text = format_response_for_summary(q, resp)

            ok, _ = validate_response(q, resp)
            title_color = (0.1, 0.1, 0.1, 1) if ok else (0.8, 0.2, 0.2, 1)

            block = BoxLayout(orientation="vertical", spacing=4, size_hint_y=None)
            block.bind(minimum_height=block.setter("height"))
            block.add_widget(make_wrapped_label(title, font_size="16sp", bold=True, color=title_color))
            block.add_widget(make_wrapped_label(answer_text, font_size="15sp", color=(0.25, 0.25, 0.25, 1)))

            container.add_widget(block)

