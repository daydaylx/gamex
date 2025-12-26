from __future__ import annotations

from typing import Any, Dict, Optional, Tuple


def _safe_str(v: Any) -> str:
    return "" if v is None else str(v)


def _extract_value(response: Any, key: str) -> Any:
    if isinstance(response, dict):
        return response.get(key)
    return None


def validate_response(question: Dict[str, Any], response: Any) -> Tuple[bool, str]:
    """
    Validate a response for a structured question.

    Note: we keep the *legacy answer shapes* for compatibility:
    - singleChoice: {"value": str}
    - multiChoice: {"values": [str]}
    - text: {"text": str}
    - number: {"value": number}
    - scale: {"value": int}
    - consentRating: {"status": "YES"|"MAYBE"|"NO", ...}
    """
    q_type = question.get("type")
    required = bool(question.get("required", False))
    validation = question.get("validation") or {}

    if not required and (response is None or response == {}):
        return True, ""

    if q_type == "singleChoice":
        v = _extract_value(response, "value")
        if required and not _safe_str(v).strip():
            return False, "Bitte wähle eine Option."
        return True, ""

    if q_type == "multiChoice":
        values = _extract_value(response, "values")
        if not isinstance(values, list):
            values = []
        min_sel = validation.get("minSelections")
        max_sel = validation.get("maxSelections")
        if required and len(values) == 0:
            return False, "Bitte wähle mindestens eine Option."
        if min_sel is not None and len(values) < int(min_sel):
            return False, f"Bitte wähle mindestens {int(min_sel)} Optionen."
        if max_sel is not None and len(values) > int(max_sel):
            return False, f"Bitte wähle höchstens {int(max_sel)} Optionen."
        return True, ""

    if q_type == "text":
        text = _extract_value(response, "text")
        text_s = _safe_str(text)
        if required and not text_s.strip():
            return False, "Dieses Feld ist erforderlich."
        min_len = validation.get("minLength")
        max_len = validation.get("maxLength")
        if min_len is not None and len(text_s.strip()) < int(min_len):
            return False, f"Bitte gib mindestens {int(min_len)} Zeichen ein."
        if max_len is not None and len(text_s) > int(max_len):
            return False, f"Bitte kürze deine Antwort (max. {int(max_len)} Zeichen)."
        return True, ""

    if q_type == "number":
        v = _extract_value(response, "value")
        if v is None or (isinstance(v, str) and not v.strip()):
            return (False, "Dieses Feld ist erforderlich.") if required else (True, "")
        try:
            num = float(v)
        except Exception:
            return False, "Bitte gib eine gültige Zahl ein."
        min_v = validation.get("min")
        max_v = validation.get("max")
        if min_v is not None and num < float(min_v):
            return False, f"Wert muss ≥ {min_v} sein."
        if max_v is not None and num > float(max_v):
            return False, f"Wert muss ≤ {max_v} sein."
        return True, ""

    if q_type == "scale":
        v = _extract_value(response, "value")
        if v is None:
            return (False, "Bitte wähle einen Wert.") if required else (True, "")
        try:
            num = int(v)
        except Exception:
            return False, "Bitte wähle einen gültigen Wert."
        min_v = validation.get("min")
        max_v = validation.get("max")
        if min_v is not None and num < int(min_v):
            return False, f"Wert muss ≥ {int(min_v)} sein."
        if max_v is not None and num > int(max_v):
            return False, f"Wert muss ≤ {int(max_v)} sein."
        return True, ""

    if q_type == "consentRating":
        status = _extract_value(response, "status")
        if required and not _safe_str(status).strip():
            return False, "Bitte wähle einen Status (Ja/Vielleicht/Nein)."
        return True, ""

    # Unknown type: be permissive
    return True, ""


def format_response_for_summary(question: Dict[str, Any], response: Any) -> str:
    q_type = question.get("type")
    if response is None:
        return "—"

    if q_type == "singleChoice":
        return _safe_str(_extract_value(response, "value")).strip() or "—"
    if q_type == "multiChoice":
        values = _extract_value(response, "values")
        if isinstance(values, list) and values:
            return ", ".join([_safe_str(v) for v in values])
        return "—"
    if q_type == "text":
        return _safe_str(_extract_value(response, "text")).strip() or "—"
    if q_type == "number":
        v = _extract_value(response, "value")
        return _safe_str(v).strip() or "—"
    if q_type == "scale":
        v = _extract_value(response, "value")
        return _safe_str(v).strip() or "—"
    if q_type == "consentRating":
        status = _safe_str(_extract_value(response, "status")).strip()
        interest = _extract_value(response, "interest")
        comfort = _extract_value(response, "comfort")
        parts = []
        if status:
            parts.append(status)
        if interest is not None:
            parts.append(f"Interesse {interest}/10")
        if comfort is not None:
            parts.append(f"Komfort {comfort}/10")
        return " · ".join(parts) if parts else "—"

    return "—"

