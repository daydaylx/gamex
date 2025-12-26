import os
import sqlite3
from contextlib import contextmanager
from typing import Iterator

def _default_db_path() -> str:
    """
    Default location for local (plaintext) storage.

    Prefer XDG dirs on Linux; fall back to ~/.local/share.
    """
    xdg_data = os.environ.get("XDG_DATA_HOME")
    if xdg_data:
        base = xdg_data
    else:
        home = os.path.expanduser("~")
        base = os.path.join(home, ".local", "share")
    path_dir = os.path.join(base, "intimacy-tool")
    os.makedirs(path_dir, exist_ok=True)
    return os.path.join(path_dir, "intimacy_tool.sqlite3")

def get_db_path() -> str:
    env = os.environ.get("INTIMACY_TOOL_DB")
    if env:
        return os.path.abspath(env)
    return _default_db_path()

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
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

def _migrate_sessions_for_encryption(conn: sqlite3.Connection) -> None:
    """
    Add encryption-related columns to sessions table if they don't exist.
    Safe to run multiple times (idempotent).
    """
    # Check existing columns
    cols = [r["name"] for r in conn.execute("PRAGMA table_info(sessions)").fetchall()]

    # Add encrypted_session_key column
    if "encrypted_session_key" not in cols:
        conn.execute("ALTER TABLE sessions ADD COLUMN encrypted_session_key TEXT")

    # Add session_salt column
    if "session_salt" not in cols:
        conn.execute("ALTER TABLE sessions ADD COLUMN session_salt TEXT")

    # Add encryption_version column
    if "encryption_version" not in cols:
        conn.execute("ALTER TABLE sessions ADD COLUMN encryption_version INTEGER DEFAULT 0")

    # Note: encryption_version = 0 means unencrypted (legacy)
    #       encryption_version = 1 means encrypted with hybrid system

def init_db() -> None:
    with db() as conn:
        # Detect legacy encrypted schema early and fail loudly to avoid silently
        # corrupting or wiping user data.
        existing = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
        ).fetchone()
        if existing:
            cols = [r["name"] for r in conn.execute("PRAGMA table_info(sessions)").fetchall()]
            if "salt" in cols or "pw_verifier" in cols or "pin_a_hash" in cols or "pin_b_hash" in cols:
                raise RuntimeError(
                    "Legacy encrypted database schema detected. "
                    "This version stores data locally in plaintext and cannot read the old encrypted schema. "
                    "Please export/backup with the old version and remove the existing DB file before starting."
                )

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
            FOREIGN KEY(template_id) REFERENCES templates(id)
        );
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            session_id TEXT NOT NULL,
            person TEXT NOT NULL CHECK(person IN ('A','B')),
            json TEXT NOT NULL,
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
            json TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
        """)

        # Encryption tables (hybrid encryption system)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS keychain (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            encrypted_master_key TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            version INTEGER DEFAULT 1
        );
        """)

        # Add encryption columns to sessions table (migration-safe)
        _migrate_sessions_for_encryption(conn)










