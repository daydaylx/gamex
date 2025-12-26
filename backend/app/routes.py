import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

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
)
from app.backup import create_backup, restore_backup
from app.template_store import list_templates
from app.templates.loader import load_template
from app.compare import compare
from app.ai import openrouter_analyze, list_ai_reports
from app.logging import log_api_call, log_performance
from app.storage import get_storage
from app.core.validation import validate_responses as _validate_responses_core

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
        return load_template(template_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Template not found")

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
    # verify template exists
    try:
        load_template(req.template_id)
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid template_id")

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
def load_responses(session_id: str, person: str, req: LoadResponsesRequest):
    if person not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Invalid person")
    srow = _load_session_row(session_id)

    data = storage.load_responses(session_id=session_id, person=person)
    if not data:
        return {"responses": {}}
    return {"responses": data}

@api_router.post("/sessions/{session_id}/responses/{person}/save")
def save_responses(session_id: str, person: str, req: SaveResponsesRequest):
    if person not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Invalid person")
    srow = _load_session_row(session_id)

    # basic sanity: must be dict
    if not isinstance(req.responses, dict):
        raise HTTPException(status_code=400, detail="responses must be object/dict")

    # Validate responses against template
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
    now = _utcnow()
    storage.save_responses(session_id=session_id, person=person, responses=req.responses, updated_at=now)
    return {"ok": True, "updated_at": now}

def _load_both_responses(session_id: str):
    srow = _load_session_row(session_id)
    try:
        resp_a, resp_b = storage.load_both_responses(session_id=session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Need both A and B responses to compare")
    return srow, resp_a, resp_b

@api_router.post("/sessions/{session_id}/compare", response_model=CompareResult)
def compare_session(session_id: str, req: CompareRequest):
    start = time.time()
    try:
        srow, resp_a, resp_b = _load_both_responses(session_id)
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
def export_json(session_id: str, req: ExportRequest):
    srow, resp_a, resp_b = _load_both_responses(session_id)
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
def export_markdown(session_id: str, req: ExportRequest):
    srow, resp_a, resp_b = _load_both_responses(session_id)
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
        elif it.get("schema") in ("scale_0_10", "enum", "multi"):
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
    srow, resp_a, resp_b = _load_both_responses(session_id)
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
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
