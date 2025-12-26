from __future__ import annotations

from typing import Any, Callable, Dict, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.widget import Widget

from mobile.questionnaire.validation import validate_response
from mobile.widgets.help_accordion import HelpAccordion
from mobile.widgets.question_inputs import (
    ConsentRatingInput,
    MultiChoiceInput,
    NumberAnswerInput,
    ScaleInput,
    SingleChoiceInput,
    TextAnswerInput,
)
from mobile.widgets.ui_helpers import make_wrapped_label


class QuestionPage(BoxLayout):
    """
    Renders exactly one question + its input + validation error.
    """

    def __init__(
        self,
        *,
        question: Dict[str, Any],
        response: Any,
        on_change: Callable[[str, Any], None],
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = 12
        self.padding = [10, 10, 10, 10]
        self.size_hint_y = None
        self.bind(minimum_height=self.setter("height"))

        self.question = question
        self._on_change_cb = on_change
        self._response = response

        title = question.get("title") or ""
        required = bool(question.get("required", False))
        title_suffix = " *" if required else ""
        self.add_widget(make_wrapped_label(title + title_suffix, font_size="20sp", bold=True))

        desc = (question.get("description") or "").strip()
        if desc:
            self.add_widget(make_wrapped_label(desc, font_size="15sp", color=(0.35, 0.35, 0.35, 1)))

        help_text = (question.get("help") or "").strip()
        help_details = (question.get("helpDetails") or "").strip()
        if help_text or help_details:
            self.add_widget(HelpAccordion(help_text=help_text, details_text=help_details))

        self.input_widget = self._build_input(question, response)
        self.add_widget(self.input_widget)

        self.error_label = make_wrapped_label(
            "",
            font_size="14sp",
            color=(0.8, 0.2, 0.2, 1),
        )
        self.error_label.opacity = 0
        self.error_label.height = 0
        self.add_widget(self.error_label)

    def _build_input(self, question: Dict[str, Any], response: Any) -> Widget:
        q_type = question.get("type")
        qid = question.get("id", "")
        options = list(question.get("options", []) or [])
        validation = question.get("validation") or {}

        def _changed(new_response: Any) -> None:
            self._response = new_response
            self._set_error("")
            self._on_change_cb(qid, new_response)

        if q_type == "scale":
            min_v = int(validation.get("min", 1))
            max_v = int(validation.get("max", 10))
            step = int(validation.get("step", 1) or 1)
            return ScaleInput(min_v=min_v, max_v=max_v, step=step, response=response, on_change=_changed)

        if q_type == "singleChoice":
            return SingleChoiceInput(qid=qid, options=options, response=response, on_change=_changed)

        if q_type == "multiChoice":
            return MultiChoiceInput(options=options, response=response, on_change=_changed)

        if q_type == "text":
            return TextAnswerInput(response=response, on_change=_changed)

        if q_type == "number":
            return NumberAnswerInput(response=response, on_change=_changed)

        if q_type == "consentRating":
            return ConsentRatingInput(response=response, on_change=_changed)

        # Fallback
        return TextAnswerInput(response=response, on_change=_changed)

    def _set_error(self, msg: str) -> None:
        msg = (msg or "").strip()
        if msg:
            self.error_label.text = msg
            self.error_label.opacity = 1
            # Force Kivy to recompute the label's texture/height.
            # Reassigning the text property triggers the internal update mechanism
            # so that the layout is refreshed correctly when the error message changes.
            self.error_label.text = self.error_label.text
        else:
            self.error_label.text = ""
            self.error_label.opacity = 0
            self.error_label.height = 0

    def is_valid(self) -> bool:
        ok, _ = validate_response(self.question, self._response)
        return ok

    def validate_and_show_error(self) -> bool:
        ok, msg = validate_response(self.question, self._response)
        self._set_error("" if ok else msg)
        return ok

