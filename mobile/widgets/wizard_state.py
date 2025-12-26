"""Wizard State Management for Questionnaire Flow."""
from __future__ import annotations

from typing import List, Dict, Any, Optional


class WizardState:
    """
    Manages wizard navigation state and question flow.

    Responsibilities:
    - Track current question index
    - Provide navigation (next/previous)
    - Calculate progress
    - Validate current question
    - Flatten template structure into linear question list
    """

    def __init__(self, template: Dict[str, Any], responses: Dict[str, Any]):
        """
        Initialize wizard state.

        Args:
            template: Template dictionary with modules and questions
            responses: Existing responses dict (question_id -> value)
        """
        self.template = template
        self.responses = responses

        # Flatten questions from modules
        self.questions = self._flatten_questions(template)

        # Navigation state
        self.current_index = 0
        self.total_questions = len(self.questions)

    def _flatten_questions(self, template: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Flatten template modules into a single question list.

        Args:
            template: Template with modules

        Returns:
            List of all questions with module metadata
        """
        questions = []

        for module in template.get('modules', []):
            module_id = module.get('id', '')
            module_name = module.get('name', '')

            for question in module.get('questions', []):
                # Add module context to question
                question_with_context = dict(question)
                question_with_context['_module_id'] = module_id
                question_with_context['_module_name'] = module_name
                questions.append(question_with_context)

        return questions

    @property
    def current_question(self) -> Optional[Dict[str, Any]]:
        """Get current question."""
        if 0 <= self.current_index < self.total_questions:
            return self.questions[self.current_index]
        return None

    @property
    def is_first_question(self) -> bool:
        """Check if on first question."""
        return self.current_index == 0

    @property
    def is_last_question(self) -> bool:
        """Check if on last question."""
        return self.current_index >= self.total_questions - 1

    @property
    def progress_text(self) -> str:
        """Get progress text like 'Frage 3 von 12'."""
        return f"Frage {self.current_index + 1} von {self.total_questions}"

    @property
    def progress_percentage(self) -> float:
        """Get progress as percentage (0.0 to 1.0)."""
        if self.total_questions == 0:
            return 0.0
        return (self.current_index + 1) / self.total_questions

    def can_go_next(self) -> bool:
        """
        Check if can navigate to next question.

        Validates that current question is answered if required.

        Returns:
            True if can proceed
        """
        question = self.current_question
        if not question:
            return False

        # Check if question is required
        is_required = question.get('required', True)  # Default: required

        if not is_required:
            return True

        # Check if answered
        question_id = question.get('id')
        answer = self.responses.get(question_id)

        # Validate based on question type
        schema = question.get('schema', 'text')

        if schema in ['scale_0_10', 'enum', 'consent_rating']:
            # Must have a value
            return answer is not None and answer != ''
        elif schema == 'text':
            # Text must not be empty (if required)
            return bool(answer and str(answer).strip())

        return bool(answer)

    def can_go_back(self) -> bool:
        """Check if can navigate to previous question."""
        return not self.is_first_question

    def go_next(self) -> bool:
        """
        Move to next question.

        Returns:
            True if moved successfully
        """
        if self.can_go_next() and not self.is_last_question:
            self.current_index += 1
            return True
        return False

    def go_back(self) -> bool:
        """
        Move to previous question.

        Returns:
            True if moved successfully
        """
        if self.can_go_back():
            self.current_index -= 1
            return True
        return False

    def get_answer(self, question_id: str) -> Any:
        """Get answer for a question."""
        return self.responses.get(question_id)

    def set_answer(self, question_id: str, value: Any):
        """Set answer for a question."""
        self.responses[question_id] = value

    def get_validation_error(self) -> Optional[str]:
        """
        Get validation error for current question.

        Returns:
            Error message or None if valid
        """
        if not self.current_question:
            return None

        question = self.current_question
        is_required = question.get('required', True)

        if not is_required:
            return None

        question_id = question.get('id')
        answer = self.responses.get(question_id)

        if answer is None or answer == '':
            return "Bitte beantworte diese Frage"

        schema = question.get('schema', 'text')

        if schema == 'text' and not str(answer).strip():
            return "Bitte gib eine Antwort ein"

        return None

    def get_summary_data(self) -> List[Dict[str, Any]]:
        """
        Get summary of all questions and answers.

        Returns:
            List of dicts with question, answer, module info
        """
        summary = []

        for question in self.questions:
            question_id = question.get('id')
            answer = self.responses.get(question_id)

            summary.append({
                'question_id': question_id,
                'question_text': question.get('label', ''),
                'module_name': question.get('_module_name', ''),
                'answer': answer,
                'schema': question.get('schema', 'text'),
            })

        return summary
