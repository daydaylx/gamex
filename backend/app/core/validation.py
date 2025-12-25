from __future__ import annotations

from typing import Any, Dict, List, Tuple


def _build_question_map(template: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    question_map: Dict[str, Dict[str, Any]] = {}
    for mod in template.get("modules", []) or []:
        for q in mod.get("questions", []) or []:
            qid = q.get("id")
            if qid:
                question_map[qid] = q
    return question_map


def validate_responses(template: Dict[str, Any], responses: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Validate responses against template.

    Returns (errors, warnings) as structured objects.
    This function is pure domain logic (no IO, no FastAPI concepts).
    """
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not template or "modules" not in template:
        return errors, warnings

    question_map = _build_question_map(template)

    for qid, resp_data in (responses or {}).items():
        if not isinstance(resp_data, dict):
            continue

        question = question_map.get(qid)
        if not question:
            warnings.append(
                {
                    "question_id": qid,
                    "question_label": qid,
                    "field": None,
                    "message": "Unknown question ID (may be from different template version)",
                    "type": "unknown_question",
                }
            )
            continue

        schema = question.get("schema")
        risk_level = question.get("risk_level", "A")
        label = question.get("label", qid)

        if schema == "consent_rating":
            _validate_consent_rating(qid, resp_data, label, risk_level, errors, warnings)
        elif schema == "scale_0_10":
            value = resp_data.get("value")
            if value is not None and (value < 0 or value > 10):
                errors.append(
                    {
                        "question_id": qid,
                        "question_label": label,
                        "field": "value",
                        "message": "Wert muss zwischen 0 und 10 liegen",
                        "type": "range_error",
                    }
                )

    return errors, warnings


def _validate_consent_rating(
    qid: str,
    resp_data: Dict[str, Any],
    label: str,
    risk_level: str,
    errors: List[Dict[str, Any]],
    warnings: List[Dict[str, Any]],
) -> None:
    # Dom/Sub Varianten
    if "dom_status" in resp_data or "sub_status" in resp_data:
        dom_status = resp_data.get("dom_status")
        sub_status = resp_data.get("sub_status")
        conditions = (resp_data.get("conditions", "") or "").strip()

        if dom_status == "MAYBE" and not conditions:
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "dom_conditions",
                    "message": "Dom Status 'VIELLEICHT' erfordert Bedingungen",
                    "type": "missing_required",
                }
            )
        if sub_status == "MAYBE" and not conditions:
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "sub_conditions",
                    "message": "Sub Status 'VIELLEICHT' erfordert Bedingungen",
                    "type": "missing_required",
                }
            )

        for variant in ["dom", "sub"]:
            interest = resp_data.get(f"{variant}_interest")
            comfort = resp_data.get(f"{variant}_comfort")
            if interest is not None and (interest < 0 or interest > 4):
                errors.append(
                    {
                        "question_id": qid,
                        "question_label": label,
                        "field": f"{variant}_interest",
                        "message": f"{variant.capitalize()} Interesse muss zwischen 0 und 4 liegen",
                        "type": "range_error",
                    }
                )
            if comfort is not None and (comfort < 0 or comfort > 4):
                errors.append(
                    {
                        "question_id": qid,
                        "question_label": label,
                        "field": f"{variant}_comfort",
                        "message": f"{variant.capitalize()} Komfort muss zwischen 0 und 4 liegen",
                        "type": "range_error",
                    }
                )
            if interest is not None and comfort is not None:
                if interest >= 3 and comfort <= 2:
                    warnings.append(
                        {
                            "question_id": qid,
                            "question_label": label,
                            "field": f"{variant}_interest",
                            "message": f"{variant.capitalize()}: Hohes Interesse ({interest}) aber niedriger Komfort ({comfort})",
                            "type": "low_comfort_high_interest",
                        }
                    )

    # Active/Passive Varianten
    elif "active_status" in resp_data or "passive_status" in resp_data:
        active_status = resp_data.get("active_status")
        passive_status = resp_data.get("passive_status")
        conditions = (resp_data.get("conditions", "") or "").strip()

        if active_status == "MAYBE" and not conditions:
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "active_conditions",
                    "message": "Aktiv Status 'VIELLEICHT' erfordert Bedingungen",
                    "type": "missing_required",
                }
            )
        if passive_status == "MAYBE" and not conditions:
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "passive_conditions",
                    "message": "Passiv Status 'VIELLEICHT' erfordert Bedingungen",
                    "type": "missing_required",
                }
            )

        for variant in ["active", "passive"]:
            interest = resp_data.get(f"{variant}_interest")
            comfort = resp_data.get(f"{variant}_comfort")
            if interest is not None and (interest < 0 or interest > 4):
                errors.append(
                    {
                        "question_id": qid,
                        "question_label": label,
                        "field": f"{variant}_interest",
                        "message": f"{variant.capitalize()} Interesse muss zwischen 0 und 4 liegen",
                        "type": "range_error",
                    }
                )
            if comfort is not None and (comfort < 0 or comfort > 4):
                errors.append(
                    {
                        "question_id": qid,
                        "question_label": label,
                        "field": f"{variant}_comfort",
                        "message": f"{variant.capitalize()} Komfort muss zwischen 0 und 4 liegen",
                        "type": "range_error",
                    }
                )
            if interest is not None and comfort is not None:
                if interest >= 3 and comfort <= 2:
                    warnings.append(
                        {
                            "question_id": qid,
                            "question_label": label,
                            "field": f"{variant}_interest",
                            "message": f"{variant.capitalize()}: Hohes Interesse ({interest}) aber niedriger Komfort ({comfort})",
                            "type": "low_comfort_high_interest",
                        }
                    )

    # Standard consent_rating
    else:
        status = resp_data.get("status")
        conditions = (resp_data.get("conditions", "") or "").strip()
        interest = resp_data.get("interest")
        comfort = resp_data.get("comfort")

        if status == "MAYBE" and not conditions:
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "conditions",
                    "message": "Bei Status 'VIELLEICHT' müssen Bedingungen angegeben werden",
                    "type": "missing_required",
                }
            )

        if interest is not None and (interest < 0 or interest > 4):
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "interest",
                    "message": "Interesse muss zwischen 0 und 4 liegen",
                    "type": "range_error",
                }
            )
        if comfort is not None and (comfort < 0 or comfort > 4):
            errors.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "comfort",
                    "message": "Komfort muss zwischen 0 und 4 liegen",
                    "type": "range_error",
                }
            )

        if interest is not None and comfort is not None:
            if interest >= 3 and comfort <= 2:
                warnings.append(
                    {
                        "question_id": qid,
                        "question_label": label,
                        "field": "interest",
                        "message": f"Hohes Interesse ({interest}) aber niedriger Komfort ({comfort})",
                        "type": "low_comfort_high_interest",
                    }
                )

        if risk_level == "C" and status == "YES" and not conditions:
            warnings.append(
                {
                    "question_id": qid,
                    "question_label": label,
                    "field": "conditions",
                    "message": "High-Risk Frage: Bitte Bedingungen für Sicherheit notieren",
                    "type": "high_risk_missing_conditions",
                }
            )

