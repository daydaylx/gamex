"""
Compare Service

Provides comparison functionality for mobile app.
Reuses backend compare logic.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict

# Add backend to Python path to reuse logic
backend_dir = Path(__file__).parent.parent.parent / 'backend'
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))


class CompareService:
    """
    Comparison service for mobile app.

    Reuses backend comparison logic where possible.
    """

    def __init__(self):
        """Initialize compare service."""
        pass

    def compare(
        self,
        template: Dict[str, Any],
        resp_a: Dict[str, Any],
        resp_b: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compare two sets of responses.

        Args:
            template: Template dictionary
            resp_a: Person A responses
            resp_b: Person B responses

        Returns:
            Comparison result dictionary with summary, items, action_plan
        """
        try:
            # Try to import backend compare logic
            from app.core.compare import compare as core_compare

            result = core_compare(template, resp_a, resp_b)
            return result

        except ImportError:
            # Fallback to simple comparison if backend not available
            return self._simple_compare(template, resp_a, resp_b)

    def _simple_compare(
        self,
        template: Dict[str, Any],
        resp_a: Dict[str, Any],
        resp_b: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Simple comparison fallback.

        Args:
            template: Template dictionary
            resp_a: Person A responses
            resp_b: Person B responses

        Returns:
            Basic comparison result
        """
        items = []
        matches = 0
        mismatches = 0
        total = 0

        # Get all question IDs from template
        question_ids = set()
        for module in template.get('modules', []):
            for question in module.get('questions', []):
                question_ids.add(question.get('id'))

        # Compare responses
        for qid in question_ids:
            total += 1
            ans_a = resp_a.get(qid)
            ans_b = resp_b.get(qid)

            # Simple equality check
            if ans_a == ans_b:
                status = 'match'
                matches += 1
            else:
                status = 'mismatch'
                mismatches += 1

            items.append({
                'question_id': qid,
                'status': status,
                'answer_a': ans_a,
                'answer_b': ans_b,
            })

        return {
            'meta': {
                'session_id': 'current',
                'template_id': template.get('id'),
            },
            'summary': {
                'total_questions': total,
                'matches': matches,
                'mismatches': mismatches,
                'partial_matches': 0,
            },
            'items': items,
            'action_plan': None,
        }
