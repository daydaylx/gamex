"""
Backup and Restore functionality for sessions.
Allows plaintext backups of session data that can be restored later.
"""
import json
import uuid
from typing import Dict, Any
from datetime import datetime, timezone

from app.db import db


def create_backup(session_id: str) -> Dict[str, Any]:
    """
    Create a plaintext backup of a session including all responses.
    
    Args:
        session_id: The session ID to backup
        
    Returns:
        Dict containing plaintext backup data
    """
    # Load session data
    with db() as conn:
        session_row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?", 
            (session_id,)
        ).fetchone()
        
        if not session_row:
            raise ValueError("Session not found")

        template_row = conn.execute(
            "SELECT id, name, version, json, created_at FROM templates WHERE id = ?",
            (session_row["template_id"],),
        ).fetchone()

        # Load responses
        responses_a = conn.execute(
            "SELECT json FROM responses WHERE session_id=? AND person='A'",
            (session_id,)
        ).fetchone()
        
        responses_b = conn.execute(
            "SELECT json FROM responses WHERE session_id=? AND person='B'",
            (session_id,)
        ).fetchone()
        
        # Load AI reports
        ai_reports_rows = conn.execute(
            "SELECT id, provider, model, json, created_at FROM ai_reports WHERE session_id=?",
            (session_id,)
        ).fetchall()
        
        ai_reports = []
        for row in ai_reports_rows:
            ai_reports.append({
                "id": row["id"],
                "provider": row["provider"],
                "model": row["model"],
                "json": json.loads(row["json"]),
                "created_at": row["created_at"]
            })
    
    responses_out_a = json.loads(responses_a["json"]) if responses_a else None
    responses_out_b = json.loads(responses_b["json"]) if responses_b else None

    # Create backup package
    backup_data = {
        "version": "2.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "session": {
            "id": session_id,
            "name": session_row["name"],
            "template_id": session_row["template_id"],
            "created_at": session_row["created_at"],
        },
        "template": (json.loads(template_row["json"]) if template_row else None),
        "responses": {
            "A": responses_out_a,
            "B": responses_out_b
        },
        "ai_reports": ai_reports
    }

    return {
        "backup_id": str(uuid.uuid4()),
        "session_id": session_id,
        "session_name": session_row["name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "backup": backup_data,
        "version": "2.0"
    }


def restore_backup(backup_data: Dict[str, Any], new_name: str = None) -> str:
    """
    Restore a session from a plaintext backup.
    
    Args:
        backup_data: Backup payload as dict
        new_name: Optional new name for the restored session
        
    Returns:
        The new session ID
    """
    # Validate backup format
    if backup_data.get("version") != "2.0":
        raise ValueError("Unsupported backup version")
    
    session_data = backup_data.get("session", {})
    if not session_data:
        raise ValueError("Invalid backup: missing session data")
    
    # Generate new session ID to avoid conflicts
    new_session_id = str(uuid.uuid4())
    original_session_id = session_data["id"]
    
    # Create new session
    session_name = new_name if new_name else f"{session_data['name']} (Restored)"
    if session_name is None:
        session_name = f"{session_data['name']} (Restored)"
    
    with db() as conn:
        # Restore template (if present)
        tpl = backup_data.get("template")
        if isinstance(tpl, dict) and tpl.get("id"):
            conn.execute(
                "INSERT OR REPLACE INTO templates(id, name, version, json, created_at) VALUES (?,?,?,?,?)",
                (
                    tpl.get("id"),
                    tpl.get("name") or "Restored Template",
                    int(tpl.get("version") or 1),
                    json.dumps(tpl, ensure_ascii=False),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )

        # Insert session with new ID
        conn.execute(
            """INSERT INTO sessions(id, name, template_id, created_at)
               VALUES (?,?,?,?)""",
            (
                new_session_id,
                session_name,
                session_data["template_id"],
                datetime.now(timezone.utc).isoformat(),
            )
        )
        
        # Restore responses
        responses = backup_data.get("responses", {})
        
        if responses.get("A"):
            conn.execute(
                "INSERT INTO responses(session_id, person, json, updated_at) VALUES (?,?,?,?)",
                (new_session_id, "A", json.dumps(responses["A"], ensure_ascii=False), datetime.now(timezone.utc).isoformat())
            )
        
        if responses.get("B"):
            conn.execute(
                "INSERT INTO responses(session_id, person, json, updated_at) VALUES (?,?,?,?)",
                (new_session_id, "B", json.dumps(responses["B"], ensure_ascii=False), datetime.now(timezone.utc).isoformat())
            )
        
        # Restore AI reports
        ai_reports = backup_data.get("ai_reports", [])
        for report in ai_reports:
            new_report_id = str(uuid.uuid4())
            report_json = report.get("json") if isinstance(report, dict) else None
            if not isinstance(report_json, dict):
                continue
            conn.execute(
                """INSERT INTO ai_reports(id, session_id, created_at, provider, model, json)
                   VALUES (?,?,?,?,?,?)""",
                (
                    new_report_id,
                    new_session_id,
                    report["created_at"],
                    report["provider"],
                    report["model"],
                    json.dumps(report_json, ensure_ascii=False),
                )
            )
    
    return new_session_id
