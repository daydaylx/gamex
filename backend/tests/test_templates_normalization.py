import pytest

from app.templates.normalize import normalize_template


def test_normalize_legacy_flat_questions_into_modules():
    raw = {
        "id": "legacy",
        "name": "Legacy Template",
        "version": 1,
        "questions": [
            {"id": "Q1", "label": "Test", "schema": "consent_rating"},
        ],
    }
    tpl = normalize_template(raw)
    assert isinstance(tpl["modules"], list)
    assert len(tpl["modules"]) == 1
    assert tpl["modules"][0]["id"] == "default"
    assert tpl["modules"][0]["questions"][0]["id"] == "Q1"


def test_normalize_fills_question_defaults():
    raw = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [
            {"id": "m", "name": "M", "questions": [{"id": "Q1"}]},
        ],
    }
    tpl = normalize_template(raw)
    q = tpl["modules"][0]["questions"][0]
    assert q["schema"] == "consent_rating"
    assert q["risk_level"] == "A"
    assert q["tags"] == []
    assert q["help"] == ""


def test_normalize_rejects_questions_without_id():
    raw = {
        "id": "t",
        "name": "T",
        "version": 1,
        "modules": [{"id": "m", "name": "M", "questions": [{"schema": "enum"}]}],
    }
    with pytest.raises(ValueError, match="question\\.id"):
        normalize_template(raw)

