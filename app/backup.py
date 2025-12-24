"""
Backup and Restore functionality for sessions.
Allows encrypted backups of session data that can be restored later.
"""
import base64
import json
import uuid
from typing import Dict, Any
from datetime import datetime, timezone

from app.db import db
from app.crypto import encrypt_json, decrypt_json, verify_password


def create_backup(session_id: str, password: str) -> Dict[str, Any]:
    """
    Create an encrypted backup of a session including all responses.
    
    Args:
        session_id: The session ID to backup
        password: The session password for decryption/encryption
        
    Returns:
        Dict containing encrypted backup data
    """
    # Load session data
    with db() as conn:
        session_row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?", 
            (session_id,)
        ).fetchone()
        
        if not session_row:
            raise ValueError("Session not found")
        
        # Verify password
        salt = session_row["salt"]
        if not verify_password(password, salt, session_row["pw_verifier"]):
            raise ValueError("Invalid password")
        
        # Load responses
        responses_a = conn.execute(
            "SELECT encrypted_blob FROM responses WHERE session_id=? AND person='A'",
            (session_id,)
        ).fetchone()
        
        responses_b = conn.execute(
            "SELECT encrypted_blob FROM responses WHERE session_id=? AND person='B'",
            (session_id,)
        ).fetchone()
        
        # Load AI reports
        ai_reports_rows = conn.execute(
            "SELECT id, provider, model, encrypted_blob, created_at FROM ai_reports WHERE session_id=?",
            (session_id,)
        ).fetchall()
        
        ai_reports = []
        for row in ai_reports_rows:
            ai_reports.append({
                "id": row["id"],
                "provider": row["provider"],
                "model": row["model"],
                "encrypted_blob": base64.b64encode(row["encrypted_blob"]).decode('utf-8'),
                "created_at": row["created_at"]
            })
    
    # Decrypt responses and re-encrypt with backup-specific key
    decrypted_a = None
    decrypted_b = None
    
    if responses_a:
        decrypted_a = json.loads(decrypt_json(password, salt, responses_a["encrypted_blob"]))
    
    if responses_b:
        decrypted_b = json.loads(decrypt_json(password, salt, responses_b["encrypted_blob"]))
    
    # Create backup package
    backup_data = {
        "version": "1.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "session": {
            "id": session_id,
            "name": session_row["name"],
            "template_id": session_row["template_id"],
            "created_at": session_row["created_at"],
            "salt": base64.b64encode(session_row["salt"]).decode('utf-8'),
            "pw_verifier": session_row["pw_verifier"],
            "pin_a_hash": session_row["pin_a_hash"],
            "pin_b_hash": session_row["pin_b_hash"]
        },
        "responses": {
            "A": decrypted_a,
            "B": decrypted_b
        },
        "ai_reports": ai_reports
    }
    
    # Encrypt backup with a new key derived from the password
    # This ensures the backup can only be opened with the original password
    backup_salt = salt  # Use same salt for consistency
    encrypted_backup = encrypt_json(password, backup_salt, json.dumps(backup_data, ensure_ascii=False))
    
    return {
        "backup_id": str(uuid.uuid4()),
        "session_id": session_id,
        "session_name": session_row["name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "encrypted_data": base64.b64encode(encrypted_backup).decode('utf-8'),
        "salt": base64.b64encode(backup_salt).decode('utf-8'),
        "version": "1.0"
    }


def restore_backup(encrypted_backup_b64: str, salt_b64: str, password: str, new_name: str = None) -> str:
    """
    Restore a session from an encrypted backup.
    
    Args:
        encrypted_backup_b64: Base64-encoded encrypted backup data
        salt_b64: Base64-encoded salt
        password: The password to decrypt the backup
        new_name: Optional new name for the restored session
        
    Returns:
        The new session ID
    """
    # Decode and decrypt
    encrypted_backup = base64.b64decode(encrypted_backup_b64)
    salt = base64.b64decode(salt_b64)
    
    try:
        backup_json = decrypt_json(password, salt, encrypted_backup)
        backup_data = json.loads(backup_json)
    except Exception as e:
        raise ValueError(f"Failed to decrypt backup: {e}")
    
    # Validate backup format
    if backup_data.get("version") != "1.0":
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
        # Insert session with new ID
        # Decode salt from base64 to bytes (database expects BLOB)
        original_salt_bytes = base64.b64decode(session_data["salt"])
        conn.execute(
            """INSERT INTO sessions(id, name, template_id, created_at, salt, pw_verifier, pin_a_hash, pin_b_hash) 
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                new_session_id,
                session_name,
                session_data["template_id"],
                datetime.now(timezone.utc).isoformat(),
                original_salt_bytes,
                session_data["pw_verifier"],
                session_data["pin_a_hash"],
                session_data["pin_b_hash"]
            )
        )
        
        # Restore responses
        responses = backup_data.get("responses", {})
        # original_salt_bytes already decoded above (line 165)
        
        if responses.get("A"):
            encrypted_a = encrypt_json(password, original_salt_bytes, json.dumps(responses["A"], ensure_ascii=False))
            conn.execute(
                "INSERT INTO responses(session_id, person, encrypted_blob, updated_at) VALUES (?,?,?,?)",
                (new_session_id, "A", encrypted_a, datetime.now(timezone.utc).isoformat())
            )
        
        if responses.get("B"):
            encrypted_b = encrypt_json(password, original_salt_bytes, json.dumps(responses["B"], ensure_ascii=False))
            conn.execute(
                "INSERT INTO responses(session_id, person, encrypted_blob, updated_at) VALUES (?,?,?,?)",
                (new_session_id, "B", encrypted_b, datetime.now(timezone.utc).isoformat())
            )
        
        # Restore AI reports
        ai_reports = backup_data.get("ai_reports", [])
        for report in ai_reports:
            new_report_id = str(uuid.uuid4())
            encrypted_blob = base64.b64decode(report["encrypted_blob"])
            conn.execute(
                """INSERT INTO ai_reports(id, session_id, created_at, provider, model, encrypted_blob) 
                   VALUES (?,?,?,?,?,?)""",
                (
                    new_report_id,
                    new_session_id,
                    report["created_at"],
                    report["provider"],
                    report["model"],
                    encrypted_blob
                )
            )
    
    return new_session_id
