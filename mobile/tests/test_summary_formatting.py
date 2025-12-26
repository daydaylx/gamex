from mobile.questionnaire.validation import format_response_for_summary


def test_format_response_for_summary_none():
    assert format_response_for_summary({"type": "text"}, None) == "—"


def test_format_response_for_summary_single_choice():
    q = {"type": "singleChoice"}
    assert format_response_for_summary(q, {"value": "A"}) == "A"
    assert format_response_for_summary(q, {"value": ""}) == "—"


def test_format_response_for_summary_multi_choice():
    q = {"type": "multiChoice"}
    assert format_response_for_summary(q, {"values": ["B", "A"]}) == "B, A"
    assert format_response_for_summary(q, {"values": []}) == "—"


def test_format_response_for_summary_text():
    q = {"type": "text"}
    assert format_response_for_summary(q, {"text": " Hallo "}) == "Hallo"
    assert format_response_for_summary(q, {"text": ""}) == "—"


def test_format_response_for_summary_number_and_scale():
    assert format_response_for_summary({"type": "number"}, {"value": "5"}) == "5"
    assert format_response_for_summary({"type": "scale"}, {"value": 7}) == "7"


def test_format_response_for_summary_consent_rating():
    q = {"type": "consentRating"}
    assert format_response_for_summary(q, {"status": "YES"}) == "YES"
    assert format_response_for_summary(q, {"status": "MAYBE", "interest": 8, "comfort": 4}) == "MAYBE · Interesse 8/10 · Komfort 4/10"

