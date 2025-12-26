from mobile.questionnaire.wizard_state import WizardState


def test_wizard_state_navigation():
    ws = WizardState()
    assert ws.current() is None

    questions = [{"id": "Q1"}, {"id": "Q2"}, {"id": "Q3"}]
    ws.start(questions)

    assert ws.started is True
    assert ws.total() == 3
    assert ws.current()["id"] == "Q1"
    assert ws.is_first() is True
    assert ws.is_last() is False

    assert ws.next() is True
    assert ws.current()["id"] == "Q2"

    assert ws.next() is True
    assert ws.current()["id"] == "Q3"
    assert ws.is_last() is True
    assert ws.next() is False

    assert ws.prev() is True
    assert ws.current()["id"] == "Q2"
    assert ws.prev() is True
    assert ws.current()["id"] == "Q1"
    assert ws.prev() is False

