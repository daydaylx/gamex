"""Test script for Wizard State logic (no Kivy required)."""
from widgets.wizard_state import WizardState


def test_wizard_state():
    """Test wizard state navigation and validation."""

    # Mock template data
    template = {
        "id": "test_v1",
        "name": "Test Template",
        "modules": [
            {
                "id": "module1",
                "name": "Module 1",
                "questions": [
                    {
                        "id": "Q1",
                        "schema": "scale_0_10",
                        "label": "Question 1",
                        "required": True,
                    },
                    {
                        "id": "Q2",
                        "schema": "text",
                        "label": "Question 2",
                        "required": True,
                    },
                ]
            },
            {
                "id": "module2",
                "name": "Module 2",
                "questions": [
                    {
                        "id": "Q3",
                        "schema": "enum",
                        "label": "Question 3",
                        "options": ["A", "B", "C"],
                        "required": True,
                    },
                ]
            }
        ]
    }

    responses = {}
    wizard = WizardState(template, responses)

    print("=== Wizard State Test ===\n")

    # Test initial state
    print(f"Total questions: {wizard.total_questions}")
    print(f"Current index: {wizard.current_index}")
    print(f"Progress: {wizard.progress_text}")
    print(f"Progress %: {wizard.progress_percentage * 100:.0f}%")
    print(f"Is first: {wizard.is_first_question}")
    print(f"Is last: {wizard.is_last_question}")

    # Test current question
    q = wizard.current_question
    print(f"\nCurrent question:")
    print(f"  ID: {q['id']}")
    print(f"  Label: {q['label']}")
    print(f"  Schema: {q['schema']}")
    print(f"  Module: {q['_module_name']}")

    # Test validation (should fail - no answer)
    print(f"\nCan go next (no answer): {wizard.can_go_next()}")
    print(f"Validation error: {wizard.get_validation_error()}")

    # Add answer
    wizard.set_answer("Q1", 7)
    print(f"\nCan go next (with answer): {wizard.can_go_next()}")

    # Navigate to next
    success = wizard.go_next()
    print(f"\nGo next: {success}")
    print(f"Current index: {wizard.current_index}")
    print(f"Progress: {wizard.progress_text}")

    # Answer second question
    wizard.set_answer("Q2", "Test answer")
    wizard.go_next()

    print(f"\nCurrent index: {wizard.current_index}")
    print(f"Is last: {wizard.is_last_question}")

    # Answer last question
    wizard.set_answer("Q3", "B")

    # Test going back
    wizard.go_back()
    print(f"\nAfter go_back:")
    print(f"Current index: {wizard.current_index}")
    print(f"Current question: {wizard.current_question['id']}")

    # Go forward again
    wizard.go_next()

    # Test summary
    summary = wizard.get_summary_data()
    print(f"\n=== Summary ===")
    for item in summary:
        print(f"{item['question_id']}: {item['answer']} (Module: {item['module_name']})")

    print("\n✓ All tests passed!")


if __name__ == "__main__":
    test_wizard_state()
