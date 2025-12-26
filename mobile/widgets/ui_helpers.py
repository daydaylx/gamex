from __future__ import annotations

from kivy.uix.label import Label


def make_wrapped_label(
    text: str,
    *,
    font_size: str = "16sp",
    bold: bool = False,
    color=(0.1, 0.1, 0.1, 1),
    padding_y: int = 6,
) -> Label:
    """
    Create a Kivy Label that wraps and auto-sizes its height.
    """
    lbl = Label(
        text=text or "",
        font_size=font_size,
        bold=bold,
        color=color,
        size_hint_y=None,
        halign="left",
        valign="top",
    )

    def _sync_text_size(*_):
        lbl.text_size = (lbl.width, None)
        lbl.texture_update()
        lbl.height = max(lbl.texture_size[1] + padding_y, 24)

    lbl.bind(width=_sync_text_size)
    lbl.bind(text=_sync_text_size)
    _sync_text_size()
    return lbl

