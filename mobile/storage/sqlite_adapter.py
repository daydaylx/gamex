"""
SQLite Storage Adapter for GameX Mobile

Provides the same data model as backend/app/storage/sqlite.py
for offline-first mobile functionality.
"""
from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class SqliteStorage:
    """
    SQLite storage adapter for mobile app.

    Mirrors the backend storage implementation with offline-first
    capabilities and data migration support.
    """

    def __init__(self, db_path: Path):
        """
        Initialize storage with database path.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path

    def _get_connection(self) -> sqlite3.Connection:
        """
        Get database connection with row factory configured.

        Returns:
            SQLite connection
        """
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_db(self):
        """Initialize database schema."""
        with self._get_connection() as conn:
            # Create sessions table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    template_id TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)

            # Create responses table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS responses (
                    session_id TEXT NOT NULL,
                    person TEXT NOT NULL CHECK(person IN ('A', 'B')),
                    json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (session_id, person),
                    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
                )
            """)

            # Create index for faster lookups
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_sessions_created
                ON sessions(created_at DESC)
            """)

            conn.commit()

    # ===== Session Methods =====

    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        List all sessions with response status.

        Returns:
            List of session dictionaries
        """
        with self._get_connection() as conn:
            rows = conn.execute("""
                SELECT s.id, s.name, s.template_id, s.created_at,
                       (SELECT 1 FROM responses r WHERE r.session_id=s.id AND r.person='A') AS has_a,
                       (SELECT 1 FROM responses r WHERE r.session_id=s.id AND r.person='B') AS has_b
                FROM sessions s
                ORDER BY s.created_at DESC
            """).fetchall()

        sessions = []
        for row in rows:
            sessions.append({
                'id': row['id'],
                'name': row['name'],
                'template_id': row['template_id'],
                'created_at': row['created_at'],
                'has_a': bool(row['has_a']),
                'has_b': bool(row['has_b']),
            })

        return sessions

    def create_session(
        self,
        name: str,
        template_id: str,
        session_id: Optional[str] = None,
    ) -> str:
        """
        Create a new session.

        Args:
            name: Session name
            template_id: Template identifier
            session_id: Optional session ID (generated if not provided)

        Returns:
            Session ID
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        created_at = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO sessions(id, name, template_id, created_at) VALUES (?,?,?,?)",
                (session_id, name, template_id, created_at),
            )
            conn.commit()

        return session_id

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """
        Get session by ID.

        Args:
            session_id: Session identifier

        Returns:
            Session dictionary

        Raises:
            KeyError: If session not found
        """
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ?",
                (session_id,)
            ).fetchone()

        if not row:
            raise KeyError(f"Session not found: {session_id}")

        # Check for responses
        has_a, has_b = self.has_responses(session_id)

        return {
            'id': row['id'],
            'name': row['name'],
            'template_id': row['template_id'],
            'created_at': row['created_at'],
            'has_a': has_a,
            'has_b': has_b,
        }

    def delete_session(self, session_id: str):
        """
        Delete a session and all associated responses.

        Args:
            session_id: Session identifier
        """
        with self._get_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            conn.commit()

    # ===== Response Methods =====

    def has_responses(self, session_id: str) -> Tuple[bool, bool]:
        """
        Check if session has responses for persons A and B.

        Args:
            session_id: Session identifier

        Returns:
            Tuple of (has_a, has_b) booleans
        """
        with self._get_connection() as conn:
            has_a = conn.execute(
                "SELECT 1 FROM responses WHERE session_id=? AND person='A'",
                (session_id,),
            ).fetchone()

            has_b = conn.execute(
                "SELECT 1 FROM responses WHERE session_id=? AND person='B'",
                (session_id,),
            ).fetchone()

        return bool(has_a), bool(has_b)

    def load_responses(
        self,
        session_id: str,
        person: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Load responses for a specific session and person.

        Args:
            session_id: Session identifier
            person: Person identifier ("A" or "B")

        Returns:
            Responses dictionary or None if not found
        """
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT json FROM responses WHERE session_id=? AND person=?",
                (session_id, person),
            ).fetchone()

        if not row:
            return None

        try:
            return json.loads(row['json'])
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in responses: {e}")

    def save_responses(
        self,
        session_id: str,
        person: str,
        responses: Dict[str, Any],
    ):
        """
        Save responses for a session and person.

        Args:
            session_id: Session identifier
            person: Person identifier ("A" or "B")
            responses: Responses dictionary
        """
        payload = json.dumps(responses, ensure_ascii=False)
        updated_at = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO responses(session_id, person, json, updated_at)
                VALUES (?,?,?,?)
                ON CONFLICT(session_id, person)
                DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at
            """, (session_id, person, payload, updated_at))
            conn.commit()

    def load_both_responses(
        self,
        session_id: str,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Load both A and B responses for comparison.

        Args:
            session_id: Session identifier

        Returns:
            Tuple of (responses_a, responses_b)

        Raises:
            ValueError: If both responses are not available
        """
        with self._get_connection() as conn:
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

        return json.loads(ra['json']), json.loads(rb['json'])

    # ===== Backup/Restore =====

    def export_to_json(self, session_id: str) -> Dict[str, Any]:
        """
        Export session and responses to JSON format.

        Args:
            session_id: Session identifier

        Returns:
            Complete session data as dictionary
        """
        session = self.get_session(session_id)

        # Load responses if available
        resp_a = self.load_responses(session_id, 'A')
        resp_b = self.load_responses(session_id, 'B')

        return {
            'session': session,
            'responses': {
                'A': resp_a,
                'B': resp_b,
            },
        }

    def import_from_json(self, data: Dict[str, Any]) -> str:
        """
        Import session from JSON backup.

        Args:
            data: Backup data dictionary

        Returns:
            Imported session ID
        """
        session_data = data.get('session', {})

        # Create session
        session_id = self.create_session(
            name=session_data.get('name', 'Imported Session'),
            template_id=session_data.get('template_id', 'default'),
            session_id=session_data.get('id'),  # Preserve original ID if provided
        )

        # Import responses
        responses = data.get('responses', {})
        if responses.get('A'):
            self.save_responses(session_id, 'A', responses['A'])
        if responses.get('B'):
            self.save_responses(session_id, 'B', responses['B'])

        return session_id

    def export_all_to_json(self) -> Dict[str, Any]:
        """
        Export all sessions to JSON format.

        Returns:
            Complete database backup
        """
        sessions = self.list_sessions()

        backup = {
            'version': '1.0',
            'exported_at': datetime.now(timezone.utc).isoformat(),
            'sessions': [],
        }

        for session in sessions:
            session_data = self.export_to_json(session['id'])
            backup['sessions'].append(session_data)

        return backup

    def import_all_from_json(self, backup: Dict[str, Any]):
        """
        Import all sessions from JSON backup.

        Args:
            backup: Complete backup dictionary
        """
        for session_data in backup.get('sessions', []):
            try:
                self.import_from_json(session_data)
            except Exception as e:
                print(f"Error importing session: {e}")
                # Continue with next session
                continue
