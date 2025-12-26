from __future__ import annotations

from typing import Any, Callable, Dict, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.slider import Slider
from kivy.uix.textinput import TextInput
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.checkbox import CheckBox

from mobile.widgets.ui_helpers import make_wrapped_label


OnAnswerChange = Callable[[Any], None]


class BaseInput(BoxLayout):
    def __init__(self, *, response: Any, on_change: OnAnswerChange, **kwargs):
        super().__init__(**kwargs)
        self.orientation = "vertical"
        self.spacing = 10
        self.size_hint_y = None
        self.bind(minimum_height=self.setter("height"))

        self._on_change = on_change
        self.set_response(response)

    def set_response(self, response: Any) -> None:
        self.response = response


class ScaleInput(BaseInput):
    def __init__(
        self,
        *,
        min_v: int,
        max_v: int,
        step: int = 1,
        response: Any,
        on_change: OnAnswerChange,
        **kwargs,
    ):
        self._min = int(min_v)
        self._max = int(max_v)
        self._step = int(step) if step else 1
        self._touched = False
        super().__init__(response=response, on_change=on_change, **kwargs)

        self.value_label = make_wrapped_label(
            "Noch nicht beantwortet",
            font_size="20sp",
            bold=True,
            color=(0.2, 0.6, 0.8, 1),
        )
        self.add_widget(self.value_label)

        self.slider = Slider(
            min=self._min,
            max=self._max,
            value=(self._min + self._max) / 2,
            step=self._step,
            size_hint_y=None,
            height="44dp",
        )
        self.slider.bind(value=self._on_slider)
        self.add_widget(self.slider)

        ticks = BoxLayout(size_hint_y=None, height="24dp")
        ticks.add_widget(Label(text=str(self._min), font_size="12sp"))
        ticks.add_widget(Label(text=str(int((self._min + self._max) / 2)), font_size="12sp"))
        ticks.add_widget(Label(text=str(self._max), font_size="12sp"))
        self.add_widget(ticks)

        # Apply existing response after widgets exist
        self.set_response(self.response)

    def set_response(self, response: Any) -> None:
        self.response = response
        if isinstance(response, dict) and response.get("value") is not None:
            try:
                v = int(response["value"])
                self.slider.value = v
                self.value_label.text = str(v)
                self._touched = True
            except Exception:
                pass

    def _on_slider(self, _inst, value: float) -> None:
        v = int(value)
        self.value_label.text = str(v)
        self._touched = True
        self._on_change({"value": v})

    @property
    def touched(self) -> bool:
        return self._touched


class SingleChoiceInput(BaseInput):
    def __init__(self, *, qid: str, options: list[str], response: Any, on_change: OnAnswerChange, **kwargs):
        self._qid = qid
        self._options = options
        self._selected: Optional[str] = None
        self._buttons: list[ToggleButton] = []
        super().__init__(response=response, on_change=on_change, **kwargs)

        for opt in self._options:
            btn = ToggleButton(
                text=opt,
                size_hint_y=None,
                height="56dp",
                font_size="16sp",
                group=f"single_{self._qid}",
            )
            btn.bind(state=lambda inst, st, o=opt: self._on_toggle(o, st))
            self.add_widget(btn)
            self._buttons.append(btn)

        self.set_response(self.response)

    def set_response(self, response: Any) -> None:
        self.response = response
        if isinstance(response, dict):
            v = response.get("value")
            if v:
                self._selected = str(v)
                for b in self._buttons:
                    b.state = "down" if b.text == self._selected else "normal"

    def _on_toggle(self, option: str, state: str) -> None:
        if state == "down":
            self._selected = option
            self._on_change({"value": option})


class MultiChoiceInput(BaseInput):
    def __init__(self, *, options: list[str], response: Any, on_change: OnAnswerChange, **kwargs):
        self._options = options
        self._selected: set[str] = set()
        self._checkboxes: dict[str, CheckBox] = {}
        super().__init__(response=response, on_change=on_change, **kwargs)

        for opt in self._options:
            row = BoxLayout(size_hint_y=None, height="48dp", spacing=12)
            cb = CheckBox(size_hint_x=None, width="44dp")
            cb.bind(active=lambda inst, active, o=opt: self._on_check(o, active))
            self._checkboxes[opt] = cb
            row.add_widget(cb)
            row.add_widget(make_wrapped_label(opt, font_size="16sp"))
            self.add_widget(row)

        self.set_response(self.response)

    def set_response(self, response: Any) -> None:
        self.response = response
        values = []
        if isinstance(response, dict) and isinstance(response.get("values"), list):
            values = [str(v) for v in response.get("values", [])]
        self._selected = set(values)
        for opt, cb in self._checkboxes.items():
            cb.active = opt in self._selected

    def _on_check(self, option: str, active: bool) -> None:
        if active:
            self._selected.add(option)
        else:
            self._selected.discard(option)
        self._on_change({"values": sorted(list(self._selected))})


class TextAnswerInput(BaseInput):
    def __init__(self, *, response: Any, on_change: OnAnswerChange, **kwargs):
        super().__init__(response=response, on_change=on_change, **kwargs)

        self.text_input = TextInput(
            hint_text="Deine Antwort…",
            multiline=True,
            size_hint_y=None,
            height="140dp",
            font_size="16sp",
        )
        self.text_input.bind(text=self._on_text)
        self.add_widget(self.text_input)
        self.set_response(self.response)

    def set_response(self, response: Any) -> None:
        self.response = response
        if isinstance(response, dict) and response.get("text") is not None:
            txt = str(response.get("text", ""))
            if self.text_input.text != txt:
                self.text_input.text = txt

    def _on_text(self, _inst, value: str) -> None:
        self._on_change({"text": value})


class NumberAnswerInput(BaseInput):
    def __init__(self, *, response: Any, on_change: OnAnswerChange, **kwargs):
        super().__init__(response=response, on_change=on_change, **kwargs)

        self.text_input = TextInput(
            hint_text="Zahl eingeben…",
            multiline=False,
            input_filter="float",
            size_hint_y=None,
            height="52dp",
            font_size="16sp",
        )
        self.text_input.bind(text=self._on_text)
        self.add_widget(self.text_input)
        self.set_response(self.response)

    def set_response(self, response: Any) -> None:
        self.response = response
        if isinstance(response, dict) and response.get("value") is not None:
            txt = str(response.get("value"))
            if self.text_input.text != txt:
                self.text_input.text = txt

    def _on_text(self, _inst, value: str) -> None:
        # Store as string; validation/parser will handle numeric conversion.
        self._on_change({"value": value})


class ConsentRatingInput(BaseInput):
    """
    Minimal consent rating input (status + interest + comfort + notes).

    Response shape is compatible with backend compare:
    {"status": "YES"|"MAYBE"|"NO", "interest": int, "comfort": int, "notes": str}
    """

    def __init__(self, *, response: Any, on_change: OnAnswerChange, **kwargs):
        self._status: Optional[str] = None
        super().__init__(response=response, on_change=on_change, **kwargs)

        # Status buttons
        self.add_widget(make_wrapped_label("Status:", font_size="16sp", bold=True))
        status_row = BoxLayout(size_hint_y=None, height="56dp", spacing=8)
        self._status_buttons: dict[str, ToggleButton] = {}
        for sid, label in [("YES", "Ja"), ("MAYBE", "Vielleicht"), ("NO", "Nein")]:
            btn = ToggleButton(
                text=label,
                group=f"consent_{id(self)}",
                size_hint_y=None,
                height="56dp",
                font_size="16sp",
            )
            btn.bind(state=lambda inst, st, s=sid: self._on_status(s, st))
            self._status_buttons[sid] = btn
            status_row.add_widget(btn)
        self.add_widget(status_row)

        # Interest
        self.add_widget(make_wrapped_label("Interesse (0–10):", font_size="14sp", color=(0.35, 0.35, 0.35, 1)))
        self._interest_value = make_wrapped_label("5", font_size="18sp", bold=True, color=(0.2, 0.6, 0.8, 1))
        self.interest_slider = Slider(min=0, max=10, value=5, step=1, size_hint_y=None, height="44dp")
        self.interest_slider.bind(value=self._on_interest)
        self.add_widget(self._interest_value)
        self.add_widget(self.interest_slider)

        # Comfort
        self.add_widget(make_wrapped_label("Komfort (0–10):", font_size="14sp", color=(0.35, 0.35, 0.35, 1)))
        self._comfort_value = make_wrapped_label("5", font_size="18sp", bold=True, color=(0.2, 0.6, 0.8, 1))
        self.comfort_slider = Slider(min=0, max=10, value=5, step=1, size_hint_y=None, height="44dp")
        self.comfort_slider.bind(value=self._on_comfort)
        self.add_widget(self._comfort_value)
        self.add_widget(self.comfort_slider)

        # Notes
        self.add_widget(make_wrapped_label("Notizen (optional):", font_size="14sp", color=(0.35, 0.35, 0.35, 1)))
        self.notes_input = TextInput(
            hint_text="Optional…",
            multiline=True,
            size_hint_y=None,
            height="96dp",
            font_size="14sp",
        )
        self.notes_input.bind(text=lambda *_: self._emit())
        self.add_widget(self.notes_input)

        self.set_response(self.response)

    def set_response(self, response: Any) -> None:
        self.response = response
        if isinstance(response, dict):
            status = response.get("status")
            if status in self._status_buttons:
                self._status = status
                self._status_buttons[status].state = "down"

            interest = response.get("interest")
            if interest is not None:
                try:
                    self.interest_slider.value = int(interest)
                except Exception:
                    pass

            comfort = response.get("comfort")
            if comfort is not None:
                try:
                    self.comfort_slider.value = int(comfort)
                except Exception:
                    pass

            notes = response.get("notes")
            if notes is not None:
                self.notes_input.text = str(notes)

        self._interest_value.text = str(int(self.interest_slider.value))
        self._comfort_value.text = str(int(self.comfort_slider.value))

    def _on_status(self, status: str, state: str) -> None:
        if state == "down":
            self._status = status
            self._emit()

    def _on_interest(self, _inst, value: float) -> None:
        self._interest_value.text = str(int(value))
        self._emit()

    def _on_comfort(self, _inst, value: float) -> None:
        self._comfort_value.text = str(int(value))
        self._emit()

    def _emit(self) -> None:
        self._on_change(
            {
                "status": self._status,
                "interest": int(self.interest_slider.value),
                "comfort": int(self.comfort_slider.value),
                "notes": self.notes_input.text,
            }
        )

