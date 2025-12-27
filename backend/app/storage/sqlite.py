from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from app.db import db


@dataclass(frozen=True)
class SqliteStorageProvider:
    """
    Storage provider backed by SQLite via `app.db.db()`.

    This class intentionally contains no business logic; it only persists and
    retrieves data in the shapes already used by the API layer.
    """

    def list_sessions(self) -> List[Dict[str, Any]]:
        with db() as conn:
            rows = conn.execute(
                """
                SELECT s.id, s.name, s.template_id, s.created_at,
                       (SELECT 1 FROM responses r WHERE r.session_id=s.id AND r.person='A') AS has_a,
                       (SELECT 1 FROM responses r WHERE r.session_id=s.id AND r.person='B') AS has_b
                FROM sessions s
                ORDER BY s.created_at DESC
                """
            ).fetchall()
        out: List[Dict[str, Any]] = []
        for r in rows:
            out.append(
                {
                    "id": r["id"],
                    "name": r["name"],
                    "template_id": r["template_id"],
                    "created_at": r["created_at"],
                    "has_a": bool(r["has_a"]),
                    "has_b": bool(r["has_b"]),
                }
            )
        return out

    def create_session(self, *, session_id: str, name: str, template_id: str, created_at: str) -> None:
        with db() as conn:
            conn.execute(
                "INSERT INTO sessions(id, name, template_id, created_at) VALUES (?,?,?,?)",
                (session_id, name, template_id, created_at),
            )

    def get_session_row(self, session_id: str) -> Dict[str, Any]:
        with db() as conn:
            row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            raise KeyError("Session not found")
        return {
            "id": row["id"],
            "name": row["name"],
            "template_id": row["template_id"],
            "created_at": row["created_at"],
        }

    def has_responses(self, session_id: str) -> Tuple[bool, bool]:
        with db() as conn:
            has_a = conn.execute(
                "SELECT 1 FROM responses WHERE session_id=? AND person='A'",
                (session_id,),
            ).fetchone()
            has_b = conn.execute(
                "SELECT 1 FROM responses WHERE session_id=? AND person='B'",
                (session_id,),
            ).fetchone()
        return bool(has_a), bool(has_b)

    def load_responses(self, *, session_id: str, person: str) -> Optional[Dict[str, Any]]:
        with db() as conn:
            row = conn.execute(
                "SELECT json FROM responses WHERE session_id=? AND person=?",
                (session_id, person),
            ).fetchone()
        if not row:
            return None
        try:
            result = json.loads(row["json"])
            return result
        except json.JSONDecodeError as e:
            import logging
            logging.error(f"JSON decode failed for session {session_id}, person {person}: {e}")
            raise

    def save_responses(
        self,
        *,
        session_id: str,
        person: str,
        responses: Dict[str, Any],
        updated_at: str,
    ) -> None:
        payload = json.dumps(responses, ensure_ascii=False)
        with db() as conn:
            conn.execute(
                "INSERT INTO responses(session_id, person, json, updated_at) VALUES (?,?,?,?) "
                "ON CONFLICT(session_id, person) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at",
                (session_id, person, payload, updated_at),
            )

    def load_both_responses(self, *, session_id: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        with db() as conn:
            ra = conn.execute(
                "SELECT json FROM responses WHERE session_id=? AND person='A'",
                (session_id,),
            ).fetchone()
            rb = conn.execute(
                "SELECT json FROM responses WHERE session_id=? AND person='B'",
                (session_id,),
            ).fetchone()
        if not ra or not rb:
            raise ValueError("Need both A and B responses to compare")
        return json.loads(ra["json"]), json.loads(rb["json"])

