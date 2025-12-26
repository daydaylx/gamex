from mobile.questionnaire.validation import validate_response


def test_required_single_choice():
    q = {"type": "singleChoice", "required": True, "validation": {}}
    assert validate_response(q, None)[0] is False
    assert validate_response(q, {"value": ""})[0] is False
    assert validate_response(q, {"value": "A"})[0] is True


def test_required_multi_choice_min_1():
    q = {"type": "multiChoice", "required": True, "validation": {"minSelections": 1}}
    assert validate_response(q, None)[0] is False
    assert validate_response(q, {"values": []})[0] is False
    assert validate_response(q, {"values": ["x"]})[0] is True


def test_text_min_length():
    q = {"type": "text", "required": True, "validation": {"minLength": 3}}
    assert validate_response(q, {"text": "a"})[0] is False
    assert validate_response(q, {"text": "abc"})[0] is True


def test_scale_bounds():
    q = {"type": "scale", "required": True, "validation": {"min": 1, "max": 10}}
    assert validate_response(q, None)[0] is False
    assert validate_response(q, {"value": 0})[0] is False
    assert validate_response(q, {"value": 1})[0] is True
    assert validate_response(q, {"value": 11})[0] is False


def test_number_parsing_and_bounds():
    q = {"type": "number", "required": True, "validation": {"min": 0, "max": 10}}
    assert validate_response(q, {"value": ""})[0] is False
    assert validate_response(q, {"value": "x"})[0] is False
    assert validate_response(q, {"value": "5"})[0] is True
    assert validate_response(q, {"value": "11"})[0] is False

