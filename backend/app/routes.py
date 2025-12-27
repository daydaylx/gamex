import json
import time
import uuid
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response

from app.models import (
    TemplateListItem,
    CreateSessionRequest,
    SessionListItem,
    SessionInfo,
    LoadResponsesRequest,
    SaveResponsesRequest,
    CompareRequest,
    CompareResult,
    ExportRequest,
    AIAnalyzeRequest,
    BackupRequest,
    RestoreRequest,
    # Encryption models
    InitializeKeychainRequest,
    UnlockKeychainRequest,
    ChangePasswordRequest,
    CreateSessionRequestEncrypted,
    LoadResponsesRequestEncrypted,
    SaveResponsesRequestEncrypted,
    CompareRequestEncrypted,
)
from app.backup import create_backup, restore_backup
from app.template_store import list_templates
from app.templates.loader import load_template
from app.compare import compare
from app.ai import openrouter_analyze, list_ai_reports
from app.logging import log_api_call, log_performance
from app.storage import get_storage
from app.core.validation import validate_responses as _validate_responses_core
from app.keychain import KeychainManager
from app.db import db
from app.crypto import encrypt_data, decrypt_data, is_encrypted, InvalidPasswordError
from app.config import config

storage = get_storage()

def validate_responses(template: Dict[str, Any], responses: Dict[str, Any]) -> tuple:
    """Validate responses against template. Returns (errors, warnings) as structured objects."""
    return _validate_responses_core(template, responses)

api_router = APIRouter()

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

@api_router.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True}

@api_router.get("/templates", response_model=list[TemplateListItem])
def templates():
    return list_templates()

@api_router.get("/templates/{template_id}")
def get_template(template_id: str) -> Dict[str, Any]:
    try:
        template = load_template(template_id)
        return template
    except KeyError:
        raise HTTPException(status_code=404, detail="Template not found")

# ========== Info / Education Endpoints ==========

def _parse_markdown_section(filepath: str, section_title: str) -> Optional[str]:
    """
    Parse a specific section from a markdown file.
    Returns the content of the section (without the heading) or None if not found.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the section by title (match ## or ### headings)
        pattern = rf'^#{1,3}\s+{re.escape(section_title)}\s*$'
        lines = content.split('\n')
        
        start_idx = None
        for i, line in enumerate(lines):
            if re.match(pattern, line, re.IGNORECASE | re.MULTILINE):
                start_idx = i + 1
                break
        
        if start_idx is None:
            return None
        
        # Find the end of the section (next heading of same or higher level)
        end_idx = len(lines)
        heading_level = len(re.match(r'^(#{1,3})', lines[start_idx - 1]).group(1))
        
        for i in range(start_idx, len(lines)):
            if re.match(rf'^#{{{1,{heading_level}}}}\s+', lines[i]):
                end_idx = i
                break
        
        section_content = '\n'.join(lines[start_idx:end_idx]).strip()
        return section_content if section_content else None
        
    except Exception as e:
        log_api_call("/api/info", "GET", 500, error=str(e))
        return None

@api_router.get("/info/{topic}")
def get_info_content(topic: str) -> Dict[str, Any]:
    """
    Get educational content from markdown guides.
    
    Supported topics:
    - aftercare: Aftercare guide
    - attachment: Attachment theory
    - subspace: Subspace and altered states
    - power: Power dynamics
    - consent: Consent and negotiation
    - breathplay: Breathplay risks
    - bondage: Bondage safety
    """
    here = os.path.dirname(os.path.dirname(__file__))
    docs_dir = os.path.join(here, "docs")
    
    # Map topics to files and sections
    topic_map = {
        "aftercare": {
            "file": os.path.join(docs_dir, "AFTERCARE_GUIDE.md"),
            "section": "Was ist Aftercare?",
            "title": "Aftercare: Die Pflege nach der Intensität"
        },
        "attachment": {
            "file": os.path.join(docs_dir, "PSYCHOLOGIE_LEITFADEN.md"),
            "section": "Bindungstheorie",
            "title": "Bindungstheorie und Intimität"
        },
        "subspace": {
            "file": os.path.join(docs_dir, "PSYCHOLOGIE_LEITFADEN.md"),
            "section": "Subspace",
            "title": "Subspace und veränderte Bewusstseinszustände"
        },
        "power": {
            "file": os.path.join(docs_dir, "PSYCHOLOGIE_LEITFADEN.md"),
            "section": "Macht",
            "title": "Machtdynamiken und D/s"
        },
        "consent": {
            "file": os.path.join(docs_dir, "PSYCHOLOGIE_LEITFADEN.md"),
            "section": "Konsens",
            "title": "Konsens und Verhandlung"
        },
        "breathplay": {
            "file": os.path.join(docs_dir, "PSYCHOLOGIE_LEITFADEN.md"),
            "section": "Breathplay",
            "title": "Breathplay: Risiken und Psychologie"
        },
        "bondage": {
            "file": os.path.join(docs_dir, "PSYCHOLOGIE_LEITFADEN.md"),
            "section": "Bondage",
            "title": "Bondage: Sicherheit und Psychologie"
        },
    }
    
    if topic not in topic_map:
        raise HTTPException(
            status_code=404, 
            detail=f"Topic '{topic}' not found. Available topics: {', '.join(topic_map.keys())}"
        )
    
    info = topic_map[topic]
    
    # Try to parse the section
    content = _parse_markdown_section(info["file"], info["section"])
    
    if content is None:
        # Fallback: return a generic message
        content = f"Informationen zu '{topic}' werden geladen... (Abschnitt '{info['section']}' nicht gefunden)"
    
    return {
        "topic": topic,
        "title": info["title"],
        "content": content,
        "source": os.path.basename(info["file"])
    }

# ========== Keychain / Encryption Endpoints ==========

@api_router.get("/keychain/status")
def keychain_status():
    """Check keychain initialization status and encryption statistics"""
    return KeychainManager.get_encryption_status()

@api_router.post("/keychain/initialize")
def initialize_keychain(req: InitializeKeychainRequest):
    """
    Initialize keychain with master password (first-time setup).

    This must be done before creating encrypted sessions.
    Password minimum length: 12 characters.
    """
    try:
        result = KeychainManager.initialize(req.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/keychain/unlock")
def unlock_keychain(req: UnlockKeychainRequest):
    """
    Verify master password.

    Returns success status. Frontend should store password in memory
    to use for subsequent operations (don't send master key over wire).
    """
    try:
        # Just verify password is correct (don't return master key!)
        KeychainManager.unlock(req.password)
        return {"status": "unlocked"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InvalidPasswordError:
        raise HTTPException(status_code=401, detail="Incorrect password")

@api_router.post("/keychain/change-password")
def change_keychain_password(req: ChangePasswordRequest):
    """
    Change master password without re-encrypting all session data.

    This is the key advantage of hybrid encryption: only the master key
    needs re-encryption, session keys and data remain unchanged.
    """
    try:
        result = KeychainManager.change_password(req.old_password, req.new_password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InvalidPasswordError:
        raise HTTPException(status_code=401, detail="Incorrect old password")

# ========== Session Endpoints (with encryption support) ==========

@api_router.get("/sessions", response_model=list[SessionListItem])
def sessions():
    rows = storage.list_sessions()
    return [
        SessionListItem(
            id=r["id"],
            name=r["name"],
            template_id=r["template_id"],
            created_at=r["created_at"],
            has_a=bool(r["has_a"]),
            has_b=bool(r["has_b"]),
        )
        for r in rows
    ]

@api_router.post("/sessions", response_model=SessionListItem)
def create_session(req: CreateSessionRequest):
    """
    Create session with optional encryption.

    If password is provided: creates encrypted session (recommended)
    If no password: creates unencrypted session (legacy, not recommended)

    Environment variables:
    - FORCE_ENCRYPTION=true: Require password (reject unencrypted sessions)
    - WARN_UNENCRYPTED=true: Log warning for unencrypted sessions
    """
    # Verify template exists
    try:
        load_template(req.template_id)
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid template_id")

    # Check if encryption is required but not provided
    if config.is_encryption_required() and not req.password:
        raise HTTPException(
            status_code=400,
            detail=(
                "Encryption required. Please provide a password to create an encrypted session. "
                "Set FORCE_ENCRYPTION=false to allow unencrypted sessions (not recommended)."
            )
        )

    # Create encrypted session if password provided
    if req.password:
        # Check if keychain is initialized
        if not KeychainManager.is_initialized():
            # Auto-initialize keychain with provided password
            try:
                KeychainManager.initialize(req.password)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))

        # Unlock keychain and get master key
        try:
            master_key = KeychainManager.unlock(req.password)
        except InvalidPasswordError:
            raise HTTPException(
                status_code=401,
                detail="Incorrect password. Please use the same password you used to initialize the keychain."
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Create session
        session_id = str(uuid.uuid4())
        created_at = _utcnow()

        storage.create_session(
            session_id=session_id,
            name=req.name,
            template_id=req.template_id,
            created_at=created_at,
        )

        # Create and encrypt session key
        KeychainManager.create_session_key(session_id, master_key)

        return SessionListItem(
            id=session_id,
            name=req.name,
            template_id=req.template_id,
            created_at=created_at,
            has_a=False,
            has_b=False,
            encrypted=True,
        )

    # Create unencrypted session (legacy path)
    else:
        if config.should_warn_unencrypted():
            import logging
            logging.warning(
                f"Creating unencrypted session '{req.name}'. "
                "Consider using encrypted sessions for better security."
            )

        session_id = str(uuid.uuid4())
        created_at = _utcnow()

        storage.create_session(
            session_id=session_id,
            name=req.name,
            template_id=req.template_id,
            created_at=created_at,
        )

        return SessionListItem(
            id=session_id,
            name=req.name,
            template_id=req.template_id,
            created_at=created_at,
            has_a=False,
            has_b=False,
            encrypted=False,
        )

@api_router.post("/sessions/encrypted", response_model=SessionListItem)
def create_encrypted_session(req: CreateSessionRequestEncrypted):
    """
    Create encrypted session (requires initialized keychain + master password).

    This endpoint:
    1. Verifies master password
    2. Creates session
    3. Generates random session key
    4. Encrypts session key with master key
    5. Stores encrypted session key in database

    All future responses for this session will be encrypted.
    """
    # Verify keychain initialized
    if not KeychainManager.is_initialized():
        raise HTTPException(
            status_code=400,
            detail="Keychain not initialized. Call /api/keychain/initialize first."
        )

    # Verify template exists
    try:
        load_template(req.template_id)
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid template_id")

    # Unlock keychain and get master key
    try:
        master_key = KeychainManager.unlock(req.password)
    except InvalidPasswordError:
        raise HTTPException(status_code=401, detail="Incorrect password")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Create session
    session_id = str(uuid.uuid4())
    created_at = _utcnow()

    storage.create_session(
        session_id=session_id,
        name=req.name,
        template_id=req.template_id,
        created_at=created_at,
    )

    # Create and encrypt session key
    KeychainManager.create_session_key(session_id, master_key)

    return SessionListItem(
        id=session_id,
        name=req.name,
        template_id=req.template_id,
        created_at=created_at,
        has_a=False,
        has_b=False,
        encrypted=True,
    )

def _load_session_row(session_id: str):
    try:
        return storage.get_session_row(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")

@api_router.get("/sessions/{session_id}", response_model=SessionInfo)
def session_info(session_id: str):
    srow = _load_session_row(session_id)
    tpl = load_template(srow["template_id"])

    has_a, has_b = storage.has_responses(session_id)

    return SessionInfo(
        id=srow["id"],
        name=srow["name"],
        template=tpl,
        created_at=srow["created_at"],
        has_a=bool(has_a),
        has_b=bool(has_b),
    )

@api_router.post("/sessions/{session_id}/responses/{person}/load")
def load_responses(session_id: str, person: str, req: LoadResponsesRequestEncrypted):
    """
    Load responses (supports both encrypted and unencrypted sessions).

    For encrypted sessions: password required in request body.
    For unencrypted sessions: password optional (ignored).
    """
    if person not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Invalid person")

    srow = _load_session_row(session_id)
    data = storage.load_responses(session_id=session_id, person=person)

    if not data:
        return {"responses": {}, "encrypted": False}

    # Check if data is encrypted
    if is_encrypted(data):
        # Encrypted session - password required
        if not req.password:
            raise HTTPException(
                status_code=401,
                detail="Password required for encrypted session"
            )

        try:
            # Unlock keychain and get session key
            master_key = KeychainManager.unlock(req.password)
            session_key = KeychainManager.get_session_key(session_id, master_key)

            # Decrypt data
            plaintext = decrypt_data(data, session_key)
            return {"responses": json.loads(plaintext), "encrypted": True}

        except InvalidPasswordError:
            raise HTTPException(status_code=401, detail="Incorrect password")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    else:
        # Unencrypted session (legacy)
        return {"responses": data, "encrypted": False}

@api_router.post("/sessions/{session_id}/responses/{person}/save")
def save_responses(session_id: str, person: str, req: SaveResponsesRequestEncrypted):
    """
    Save responses with automatic encryption for encrypted sessions.

    For encrypted sessions: password required, data encrypted before storage.
    For unencrypted sessions: password optional, data stored as plaintext.
    """
    if person not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Invalid person")

    srow = _load_session_row(session_id)

    # Basic sanity: must be dict
    if not isinstance(req.responses, dict):
        raise HTTPException(status_code=400, detail="responses must be object/dict")

    # Validate responses against template (before encryption)
    tpl = load_template(srow["template_id"])
    validation_errors, validation_warnings = validate_responses(tpl, req.responses)

    # Return warnings but only block on errors
    if validation_errors:
        return JSONResponse(
            status_code=400,
            content={
                "message": "Validation errors",
                "errors": validation_errors,
                "warnings": validation_warnings,
            },
        )

    # Check if session is encrypted
    with db() as conn:
        row = conn.execute(
            "SELECT encryption_version FROM sessions WHERE id = ?",
            (session_id,)
        ).fetchone()

    is_encrypted_session = row and row["encryption_version"] and row["encryption_version"] >= 1

    now = _utcnow()

    if is_encrypted_session:
        # Encrypted session - encrypt before saving
        if not req.password:
            raise HTTPException(
                status_code=401,
                detail="Password required for encrypted session"
            )

        try:
            # Unlock keychain and get session key
            master_key = KeychainManager.unlock(req.password)
            session_key = KeychainManager.get_session_key(session_id, master_key)

            # Encrypt responses
            plaintext = json.dumps(req.responses, ensure_ascii=False)
            encrypted = encrypt_data(plaintext, session_key)

            # Save encrypted data
            storage.save_responses(
                session_id=session_id,
                person=person,
                responses=encrypted,
                updated_at=now
            )

        except InvalidPasswordError:
            raise HTTPException(status_code=401, detail="Incorrect password")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    else:
        # Unencrypted session (legacy) - save as plaintext
        storage.save_responses(
            session_id=session_id,
            person=person,
            responses=req.responses,
            updated_at=now
        )

    return {"status": "saved", "updated_at": now}

def _load_both_responses(session_id: str, password: Optional[str] = None):
    """
    Load both responses with encryption support.

    Args:
        session_id: Session UUID
        password: Master password (required for encrypted sessions)

    Returns:
        (session_row, responses_a, responses_b)

    Raises:
        HTTPException: If responses missing or password incorrect
    """
    srow = _load_session_row(session_id)
    try:
        resp_a_raw, resp_b_raw = storage.load_both_responses(session_id=session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Need both A and B responses to compare")

    # Check if encrypted
    if is_encrypted(resp_a_raw) or is_encrypted(resp_b_raw):
        # Encrypted session
        if not password:
            raise HTTPException(
                status_code=401,
                detail="Password required for encrypted session"
            )

        try:
            # Unlock and get session key
            master_key = KeychainManager.unlock(password)
            session_key = KeychainManager.get_session_key(session_id, master_key)

            # Decrypt both responses
            resp_a = json.loads(decrypt_data(resp_a_raw, session_key)) if is_encrypted(resp_a_raw) else resp_a_raw
            resp_b = json.loads(decrypt_data(resp_b_raw, session_key)) if is_encrypted(resp_b_raw) else resp_b_raw

        except InvalidPasswordError:
            raise HTTPException(status_code=401, detail="Incorrect password")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    else:
        # Unencrypted session (legacy)
        resp_a = resp_a_raw
        resp_b = resp_b_raw

    return srow, resp_a, resp_b

@api_router.post("/sessions/{session_id}/compare", response_model=CompareResult)
def compare_session(session_id: str, req: CompareRequestEncrypted):
    """
    Compare responses (supports encrypted and unencrypted sessions).

    For encrypted sessions: password required in request body.
    """
    start = time.time()
    try:
        srow, resp_a, resp_b = _load_both_responses(session_id, password=req.password)
        tpl = load_template(srow["template_id"])
        
        compare_start = time.time()
        result = compare(tpl, resp_a, resp_b)
        compare_duration = (time.time() - compare_start) * 1000
        log_performance("compare", compare_duration, 
                      session_id=session_id, 
                      template_id=tpl.get("id"),
                      question_count=len(result["items"]))
        
        total_duration = (time.time() - start) * 1000
        log_api_call(f"/sessions/{session_id}/compare", "POST", 200, total_duration)
        
        return result
    except Exception as e:
        total_duration = (time.time() - start) * 1000
        log_api_call(f"/sessions/{session_id}/compare", "POST", 500, total_duration)
        raise

@api_router.post("/sessions/{session_id}/export/json")
def export_json(session_id: str, req: CompareRequestEncrypted):
    """Export session to JSON (supports encrypted sessions with password)"""
    srow, resp_a, resp_b = _load_both_responses(session_id, password=req.password)
    tpl = load_template(srow["template_id"])
    result = compare(tpl, resp_a, resp_b)

    payload = {
        "session": {"id": srow["id"], "name": srow["name"], "created_at": srow["created_at"]},
        "template": {"id": tpl.get("id"), "name": tpl.get("name"), "version": tpl.get("version")},
        "responses": {"A": resp_a, "B": resp_b},
        "compare": result,
    }
    data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    fname = f"intimacy_export_{session_id}.json"
    return Response(content=data, media_type="application/json", headers={"Content-Disposition": f'attachment; filename="{fname}"'})

@api_router.post("/sessions/{session_id}/export/markdown")
def export_markdown(session_id: str, req: CompareRequestEncrypted):
    """Export session to Markdown (supports encrypted sessions with password)"""
    srow, resp_a, resp_b = _load_both_responses(session_id, password=req.password)
    tpl = load_template(srow["template_id"])
    result = compare(tpl, resp_a, resp_b)

    lines = []
    lines.append(f"# Report: {srow['name']}")
    lines.append(f"- Session ID: `{srow['id']}`")
    lines.append(f"- Template: `{tpl.get('name')}` v{tpl.get('version')}")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- MATCH: {result['summary']['counts']['MATCH']}")
    lines.append(f"- EXPLORE: {result['summary']['counts']['EXPLORE']}")
    lines.append(f"- BOUNDARY: {result['summary']['counts']['BOUNDARY']}")
    lines.append("")
    lines.append("## Items (sorted)")
    lines.append("")
    for it in result["items"]:
        lines.append(f"### {it['pair_status']} | {it['module_name']} | {it['question_id']}")
        lines.append(f"**{it['label']}**")
        if it.get("risk_level") == "C":
            lines.append(f"- Risk: **High (C)**")
        if it.get("flags"):
            lines.append(f"- Flags: {', '.join(it['flags'])}")
        # Show minimal per-side summary without forcing free text
        a = it.get("a", {}) or {}
        b = it.get("b", {}) or {}
        if it.get("schema") == "consent_rating":
            lines.append(f"- A: {a.get('status')} | interest {a.get('interest')} | comfort {a.get('comfort')}")
            lines.append(f"- B: {b.get('status')} | interest {b.get('interest')} | comfort {b.get('comfort')}")
        elif it.get("schema") in ("scale_1_10", "enum", "multi"):
            lines.append(f"- A: {a}")
            lines.append(f"- B: {b}")
        else:
            lines.append(f"- A: {a}")
            lines.append(f"- B: {b}")
        lines.append("")

    md = "\n".join(lines).encode("utf-8")
    fname = f"intimacy_report_{session_id}.md"
    return Response(content=md, media_type="text/markdown", headers={"Content-Disposition": f'attachment; filename="{fname}"'})

@api_router.get("/scenarios")
def get_scenarios():
    import os
    here = os.path.dirname(__file__)
    path = os.path.join(here, "templates", "scenarios.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        # Handle both list and dict formats
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and "scenarios" in data:
            return data["scenarios"]
        else:
            return []

@api_router.post("/sessions/{session_id}/ai/analyze")
async def ai_analyze(session_id: str, req: AIAnalyzeRequest):
    """AI analysis (supports both encrypted and unencrypted sessions)"""
    srow, resp_a, resp_b = _load_both_responses(session_id, password=req.password)
    tpl = load_template(srow["template_id"])
    result = compare(tpl, resp_a, resp_b)

    if req.provider != "openrouter":
        raise HTTPException(status_code=400, detail="Only openrouter supported currently")

    try:
        report = await openrouter_analyze(
            session_id=session_id,
            compare_result=result,
            api_key=req.api_key,
            model=req.model,
            base_url=req.base_url,
            max_tokens=req.max_tokens,
            redact_free_text=req.redact_free_text,
        )
        return report
    except ValueError as e:
        # AI provider URL validation failed
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/sessions/{session_id}/ai/list")
def ai_list(session_id: str, req: CompareRequest):
    return {"reports": list_ai_reports(session_id)}

@api_router.post("/sessions/{session_id}/backup")
def backup_session(session_id: str, req: BackupRequest):
    """Create a plaintext backup of a session."""
    try:
        backup_data = create_backup(session_id)
        return backup_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logging.exception(f"Backup failed for session {session_id}")
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@api_router.post("/sessions/restore")
def restore_session(req: RestoreRequest):
    """Restore a session from a plaintext backup."""
    try:
        new_session_id = restore_backup(
            req.backup,
            req.new_name
        )
        return {
            "session_id": new_session_id,
            "message": "Session restored successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logging.exception("Restore session failed")
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
