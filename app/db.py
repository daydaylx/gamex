import os
import sqlite3
from contextlib import contextmanager
from typing import Iterator

DB_PATH = os.environ.get("INTIMACY_TOOL_DB", os.path.abspath("intimacy_tool.sqlite3"))

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def db() -> Iterator[sqlite3.Connection]:
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db() -> None:
    with db() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version INTEGER NOT NULL,
            json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            template_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            salt BLOB NOT NULL,
            pw_verifier TEXT NOT NULL,
            pin_a_hash TEXT,
            pin_b_hash TEXT,
            FOREIGN KEY(template_id) REFERENCES templates(id)
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            session_id TEXT NOT NULL,
            person TEXT NOT NULL CHECK(person IN ('A','B')),
            encrypted_blob BLOB NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY(session_id, person),
            FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS ai_reports (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            encrypted_blob BLOB NOT NULL,
            FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
        """)



