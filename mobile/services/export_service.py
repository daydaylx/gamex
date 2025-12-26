"""
Export Service

Provides export functionality for mobile app (JSON, Markdown).
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict


class ExportService:
    """
    Export service for creating backups and reports.
    """

    def __init__(self):
        """Initialize export service."""
        pass

    def export_session_json(
        self,
        session: Dict[str, Any],
        responses_a: Dict[str, Any],
        responses_b: Dict[str, Any],
    ) -> str:
        """
        Export session to JSON format.

        Args:
            session: Session metadata
            responses_a: Person A responses
            responses_b: Person B responses

        Returns:
            JSON string
        """
        data = {
            'session': session,
            'responses': {
                'A': responses_a,
                'B': responses_b,
            },
            'exported_at': datetime.utcnow().isoformat(),
        }

        return json.dumps(data, indent=2, ensure_ascii=False)

    def export_compare_markdown(
        self,
        session: Dict[str, Any],
        compare_result: Dict[str, Any],
    ) -> str:
        """
        Export comparison report to Markdown format.

        Args:
            session: Session metadata
            compare_result: Comparison result

        Returns:
            Markdown string
        """
        md_lines = [
            f"# Vergleichsbericht: {session.get('name', 'Session')}",
            "",
            f"**Erstellt am:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            "",
            "## Zusammenfassung",
            "",
        ]

        # Summary
        summary = compare_result.get('summary', {})
        md_lines.extend([
            f"- **Gesamt:** {summary.get('total_questions', 0)}",
            f"- **Übereinstimmungen:** {summary.get('matches', 0)}",
            f"- **Teilweise:** {summary.get('partial_matches', 0)}",
            f"- **Unterschiede:** {summary.get('mismatches', 0)}",
            "",
        ])

        # Items
        items = compare_result.get('items', [])
        if items:
            md_lines.extend([
                "## Details",
                "",
            ])

            for item in items:
                status = item.get('status', 'unknown')
                question = item.get('question', item.get('question_id', 'Unbekannt'))

                status_emoji = {
                    'match': '✅',
                    'partial': '⚠️',
                    'mismatch': '❌',
                }.get(status, '❓')

                md_lines.append(f"### {status_emoji} {question}")
                md_lines.append("")

                # Add answers if available
                if 'answer_a' in item and 'answer_b' in item:
                    md_lines.extend([
                        f"**Person A:** {item['answer_a']}",
                        f"**Person B:** {item['answer_b']}",
                        "",
                    ])

        # Action plan
        action_plan = compare_result.get('action_plan')
        if action_plan:
            md_lines.extend([
                "## Aktionsplan",
                "",
            ])

            for i, action in enumerate(action_plan, 1):
                text = action.get('text', 'Aktion')
                md_lines.append(f"{i}. {text}")

            md_lines.append("")

        return "\n".join(md_lines)

    def export_backup(self, all_data: Dict[str, Any]) -> str:
        """
        Export complete app backup.

        Args:
            all_data: Complete application data

        Returns:
            JSON string
        """
        backup = {
            'version': '1.0',
            'app': 'GameX Mobile',
            'exported_at': datetime.utcnow().isoformat(),
            'data': all_data,
        }

        return json.dumps(backup, indent=2, ensure_ascii=False)
