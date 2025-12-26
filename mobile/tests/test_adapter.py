from mobile.questionnaire.adapter import flatten_template_questions


def test_flatten_template_questions_shape():
    template = {
        "id": "t",
        "name": "T",
        "modules": [
            {
                "id": "m1",
                "name": "Mod 1",
                "questions": [
                    {"id": "Q1", "schema": "enum", "label": "Pick", "options": ["A", "B"]},
                    {"id": "Q2", "schema": "text", "label": "Say", "help": "Explain"},
                    {"id": "Q3", "schema": "scale_0_10", "label": "Rate"},
                ],
            }
        ],
    }

    qs = flatten_template_questions(template)
    assert len(qs) == 3

    q1 = qs[0]
    assert q1["id"] == "Q1"
    assert q1["title"] == "Pick"
    assert q1["type"] == "singleChoice"
    assert q1["options"] == ["A", "B"]
    assert q1["required"] is True
    assert q1["moduleId"] == "m1"
    assert q1["moduleName"] == "Mod 1"

    q3 = qs[2]
    assert q3["type"] == "scale"
    assert q3["validation"]["min"] == 0
    assert q3["validation"]["max"] == 10

