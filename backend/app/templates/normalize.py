from __future__ import annotations

import copy
from typing import Any, Dict, List, Tuple


def _as_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _ensure_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, str):
        return value
    return str(value)


def _ensure_int(value: Any, default: int = 1) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except Exception:
        return default


def _normalize_question(q: Dict[str, Any], idx: int) -> Dict[str, Any]:
    out = dict(q)

    qid = out.get("id") or out.get("question_id") or out.get("key")
    if qid is not None:
        out["id"] = _ensure_str(qid)

    schema = out.get("schema")
    if not schema:
        # Best-effort inference: keep existing behavior by only filling when missing.
        if isinstance(out.get("options"), list) and out.get("options"):
            out["schema"] = "enum"
        elif isinstance(out.get("values"), list):
            out["schema"] = "multi"
        elif "text" in out:
            out["schema"] = "text"
        else:
            out["schema"] = "consent_rating"

    out["risk_level"] = _ensure_str(out.get("risk_level") or "A")
    out["tags"] = [str(t) for t in _as_list(out.get("tags")) if t is not None]

    if "label" in out:
        out["label"] = _ensure_str(out.get("label"))
    else:
        out["label"] = out.get("id", "")

    out["help"] = _ensure_str(out.get("help") or "")

    # depends_on is intentionally passed through untouched; UI logic interprets it.
    return out


def _normalize_module(m: Dict[str, Any], idx: int) -> Dict[str, Any]:
    out = dict(m)
    mid = out.get("id") or f"module_{idx + 1}"
    out["id"] = _ensure_str(mid)
    out["name"] = _ensure_str(out.get("name") or out["id"])
    out["description"] = _ensure_str(out.get("description") or "")

    questions = out.get("questions")
    if not isinstance(questions, list):
        questions = []
    out["questions"] = [_normalize_question(q, qidx) for qidx, q in enumerate(questions) if isinstance(q, dict)]
    return out


def validate_template(template: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Lightweight shape validation.
    Returns (ok, message). This is intentionally lenient to keep backward-compat.
    """
    if not isinstance(template, dict):
        return False, "template must be an object"
    if not isinstance(template.get("modules"), list):
        return False, "template.modules must be a list"
    for mod in template["modules"]:
        if not isinstance(mod, dict):
            return False, "module must be an object"
        if not isinstance(mod.get("questions"), list):
            return False, "module.questions must be a list"
        for q in mod["questions"]:
            if not isinstance(q, dict):
                return False, "question must be an object"
            if not q.get("id"):
                return False, "question.id is required"
            if not q.get("schema"):
                return False, "question.schema is required"
    return True, "ok"


def normalize_template(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize a template into a stable shape used by core/ and UI.

    - Does not rewrite business meaning.
    - Only fills missing structural defaults and applies best-effort legacy mappings.
    - Keeps existing `id` if present to avoid behavior changes.
    """
    tpl = copy.deepcopy(raw) if isinstance(raw, dict) else {}

    tpl["id"] = _ensure_str(tpl.get("id") or "")
    tpl["name"] = _ensure_str(tpl.get("name") or "")
    tpl["version"] = _ensure_int(tpl.get("version"), default=1)
    tpl["description"] = _ensure_str(tpl.get("description") or "")

    modules = tpl.get("modules")
    if not isinstance(modules, list):
        # Legacy shape: a flat list of questions at top-level
        questions = tpl.get("questions")
        if isinstance(questions, list):
            modules = [{"id": "default", "name": "Fragen", "questions": questions}]
        else:
            modules = []

    tpl["modules"] = [_normalize_module(m, midx) for midx, m in enumerate(modules) if isinstance(m, dict)]

    ok, msg = validate_template(tpl)
    if not ok:
        raise ValueError(f"Invalid template: {msg}")
    return tpl

