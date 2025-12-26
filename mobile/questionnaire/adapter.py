from __future__ import annotations

from typing import Any, Dict, List

from mobile.questionnaire.models import Question, QuestionValidation


def _map_schema_to_type(schema: str) -> str:
    schema = (schema or "").strip()
    mapping = {
        "enum": "singleChoice",
        "multi": "multiChoice",
        "text": "text",
        "scale_0_10": "scale",
        "consent_rating": "consentRating",
        # Support a future/alternate naming
        "number": "number",
        "scale": "scale",
    }
    return mapping.get(schema, "text")


def _default_validation_for(schema: str, q: Dict[str, Any], required: bool) -> QuestionValidation:
    q_type = _map_schema_to_type(schema)

    if q_type == "scale":
        # Default scale from legacy schema
        if schema == "scale_0_10":
            return QuestionValidation(min=0, max=10, step=1)
        # Fallback
        return QuestionValidation(min=1, max=10, step=1)

    if q_type == "number":
        # If template provides bounds, honor them
        v = q.get("validation") or {}
        return QuestionValidation(
            min=v.get("min"),
            max=v.get("max"),
            step=v.get("step"),
        )

    if q_type == "text":
        # Keep it permissive; required is enforced separately.
        v = q.get("validation") or {}
        min_len = v.get("minLength")
        max_len = v.get("maxLength")
        if required and min_len is None:
            min_len = 1
        return QuestionValidation(minLength=min_len, maxLength=max_len)

    if q_type == "multiChoice":
        v = q.get("validation") or {}
        min_sel = v.get("minSelections")
        max_sel = v.get("maxSelections")
        if required and min_sel is None:
            min_sel = 1
        return QuestionValidation(minSelections=min_sel, maxSelections=max_sel)

    return QuestionValidation()


def flatten_template_questions(template: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convert a backend-style template into a structured, wizard-friendly question list.

    Output is JSON-friendly dicts (so it can live inside Kivy properties easily).
    """
    questions: List[Dict[str, Any]] = []

    for module in template.get("modules", []) or []:
        module_id = module.get("id", "")
        module_name = module.get("name", "")
        for q in module.get("questions", []) or []:
            schema = q.get("schema", "text")
            required = bool(q.get("required", True))
            q_type = _map_schema_to_type(schema)
            validation = _default_validation_for(schema, q, required)

            qq = Question(
                id=str(q.get("id", "")),
                title=str(q.get("label", "")),
                description=str(q.get("description", "")) if q.get("description") else "",
                help=str(q.get("help", "")) if q.get("help") else "",
                helpDetails=str(q.get("info_details", "")) if q.get("info_details") else "",
                type=q_type,  # type: ignore[arg-type]
                options=list(q.get("options", []) or []),
                required=required,
                validation=validation,
                template_schema=str(schema),
                moduleId=str(module_id),
                moduleName=str(module_name),
                raw=dict(q),
            )
            questions.append(qq.model_dump(by_alias=True))

    return questions

