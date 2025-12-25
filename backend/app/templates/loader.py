from __future__ import annotations

from typing import Any, Dict

from app.template_store import load_template as _load_raw_template
from app.templates.normalize import normalize_template


def load_template(template_id: str) -> Dict[str, Any]:
    """
    Load a template from persistence and return a normalized template object.

    Backward-compatibility note:
    - The DB key (`template_id`) and the JSON's internal `id` may differ historically.
      Normalization intentionally does not rewrite `id` to avoid behavior changes.
    """
    raw = _load_raw_template(template_id)
    return normalize_template(raw)

