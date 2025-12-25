from app.core.validation import validate_responses


def test_core_validation_unknown_question_warning():
    template = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"id": "Q1", "schema": "consent_rating", "label": "Q1"}]}],
    }
    errors, warnings = validate_responses(template, {"Q_UNKNOWN": {"status": "YES"}})
    assert errors == []
    assert any(w.get("type") == "unknown_question" for w in warnings)


def test_core_validation_maybe_requires_conditions():
    template = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"id": "Q1", "schema": "consent_rating", "label": "Q1"}]}],
    }
    errors, _warnings = validate_responses(template, {"Q1": {"status": "MAYBE", "interest": 2, "comfort": 2}})
    assert any(e.get("type") == "missing_required" and e.get("field") == "conditions" for e in errors)


def test_core_validation_interest_range_error():
    template = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"id": "Q1", "schema": "consent_rating", "label": "Q1"}]}],
    }
    errors, _warnings = validate_responses(template, {"Q1": {"status": "YES", "interest": 5, "comfort": 3}})
    assert any(e.get("type") == "range_error" and e.get("field") == "interest" for e in errors)


def test_core_validation_dom_maybe_requires_conditions():
    template = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"id": "Q1", "schema": "consent_rating", "label": "Q1"}]}],
    }
    errors, _warnings = validate_responses(
        template,
        {"Q1": {"dom_status": "MAYBE", "dom_interest": 2, "dom_comfort": 2, "sub_status": "YES", "sub_interest": 2, "sub_comfort": 2}},
    )
    assert any(e.get("field") == "dom_conditions" and e.get("type") == "missing_required" for e in errors)


def test_core_validation_active_maybe_requires_conditions():
    template = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"id": "Q1", "schema": "consent_rating", "label": "Q1"}]}],
    }
    errors, _warnings = validate_responses(
        template,
        {"Q1": {"active_status": "MAYBE", "active_interest": 2, "active_comfort": 2, "passive_status": "YES", "passive_interest": 2, "passive_comfort": 2}},
    )
    assert any(e.get("field") == "active_conditions" and e.get("type") == "missing_required" for e in errors)


def test_core_validation_high_risk_yes_warns_without_conditions():
    template = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"id": "Q1", "schema": "consent_rating", "risk_level": "C", "label": "Q1"}]}],
    }
    _errors, warnings = validate_responses(template, {"Q1": {"status": "YES", "interest": 3, "comfort": 4}})
    assert any(w.get("type") == "high_risk_missing_conditions" for w in warnings)

