from app.core.compare import compare, _status_pair


def test_core_status_pair_match():
    assert _status_pair("YES", "YES") == "MATCH"


def test_core_status_pair_boundary():
    assert _status_pair("NO", "YES") == "BOUNDARY"
    assert _status_pair("YES", "HARD_LIMIT") == "BOUNDARY"


def test_core_compare_consent_match(sample_template):
    resp_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
    resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
    result = compare(sample_template, resp_a, resp_b, scenarios=[])
    q1 = next(it for it in result["items"] if it["question_id"] == "Q1")
    assert q1["pair_status"] == "MATCH"


def test_core_compare_consent_boundary(sample_template):
    resp_a = {"Q1": {"status": "NO", "interest": 0, "comfort": 0}}
    resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}
    result = compare(sample_template, resp_a, resp_b, scenarios=[])
    q1 = next(it for it in result["items"] if it["question_id"] == "Q1")
    assert q1["pair_status"] == "BOUNDARY"


def test_core_compare_scale_match(sample_template):
    resp_a = {"Q2": {"value": 7}}
    resp_b = {"Q2": {"value": 8}}
    result = compare(sample_template, resp_a, resp_b, scenarios=[])
    q2 = next(it for it in result["items"] if it["question_id"] == "Q2")
    assert q2["pair_status"] == "MATCH"
    assert q2["delta_value"] == 1


def test_core_compare_enum_explore(sample_template):
    resp_a = {"Q3": {"value": "Option1"}}
    resp_b = {"Q3": {"value": "Option2"}}
    result = compare(sample_template, resp_a, resp_b, scenarios=[])
    q3 = next(it for it in result["items"] if it["question_id"] == "Q3")
    assert q3["pair_status"] == "EXPLORE"


def test_core_compare_scenario_boundary(sample_template):
    scenarios = [
        {"id": "S01", "title": "Test", "category": "X", "description": "D"},
    ]
    resp_a = {"SCENARIO_S01": {"choice": "D", "risk_type": "active"}}
    resp_b = {"SCENARIO_S01": {"choice": "A", "risk_type": "boundary"}}
    result = compare(sample_template, resp_a, resp_b, scenarios=scenarios)
    s1 = next(it for it in result["items"] if it["question_id"] == "S01")
    assert s1["pair_status"] == "BOUNDARY"

