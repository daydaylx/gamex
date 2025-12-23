import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response

from app.db import db
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
)
from app.template_store import list_templates, load_template
from app.crypto import create_key_material, verify_password, verify_pin, encrypt_json, decrypt_json, hash_pin
from app.compare import compare
from app.ai import openrouter_analyze, list_ai_reports
from app.logging import log_api_call, log_performance

def validate_responses(template: Dict[str, Any], responses: Dict[str, Any]) -> tuple:
    """Validate responses against template. Returns (errors, warnings) as structured objects."""
    errors = []
    warnings = []
    
    if not template or "modules" not in template:
        return errors, warnings
    
    question_map = {}
    for mod in template.get("modules", []):
        for q in mod.get("questions", []):
            question_map[q.get("id")] = q
    
    for qid, resp_data in responses.items():
        if not isinstance(resp_data, dict):
            continue
            
        question = question_map.get(qid)
        if not question:
            warnings.append({
                "question_id": qid,
                "question_label": qid,
                "field": None,
                "message": f"Unknown question ID (may be from different template version)",
                "type": "unknown_question"
            })
            continue
        
        schema = question.get("schema")
        risk_level = question.get("risk_level", "A")
        label = question.get("label", qid)
        
        if schema == "consent_rating":
            # Dom/Sub Varianten
            if "dom_status" in resp_data or "sub_status" in resp_data:
                dom_status = resp_data.get("dom_status")
                sub_status = resp_data.get("sub_status")
                conditions = resp_data.get("conditions", "").strip()
                
                if dom_status == "MAYBE" and not conditions:
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "dom_conditions",
                        "message": "Dom Status 'VIELLEICHT' erfordert Bedingungen",
                        "type": "missing_required"
                    })
                if sub_status == "MAYBE" and not conditions:
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "sub_conditions",
                        "message": "Sub Status 'VIELLEICHT' erfordert Bedingungen",
                        "type": "missing_required"
                    })
                
                # Validate ranges für dom/sub
                for variant in ["dom", "sub"]:
                    interest = resp_data.get(f"{variant}_interest")
                    comfort = resp_data.get(f"{variant}_comfort")
                    if interest is not None and (interest < 0 or interest > 4):
                        errors.append({
                            "question_id": qid,
                            "question_label": label,
                            "field": f"{variant}_interest",
                            "message": f"{variant.capitalize()} Interesse muss zwischen 0 und 4 liegen",
                            "type": "range_error"
                        })
                    if comfort is not None and (comfort < 0 or comfort > 4):
                        errors.append({
                            "question_id": qid,
                            "question_label": label,
                            "field": f"{variant}_comfort",
                            "message": f"{variant.capitalize()} Komfort muss zwischen 0 und 4 liegen",
                            "type": "range_error"
                        })
                    
                    # Low comfort high interest warning
                    if interest is not None and comfort is not None:
                        if interest >= 3 and comfort <= 2:
                            warnings.append({
                                "question_id": qid,
                                "question_label": label,
                                "field": f"{variant}_interest",
                                "message": f"{variant.capitalize()}: Hohes Interesse ({interest}) aber niedriger Komfort ({comfort})",
                                "type": "low_comfort_high_interest"
                            })
            
            # Active/Passive Varianten
            elif "active_status" in resp_data or "passive_status" in resp_data:
                active_status = resp_data.get("active_status")
                passive_status = resp_data.get("passive_status")
                conditions = resp_data.get("conditions", "").strip()
                
                if active_status == "MAYBE" and not conditions:
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "active_conditions",
                        "message": "Aktiv Status 'VIELLEICHT' erfordert Bedingungen",
                        "type": "missing_required"
                    })
                if passive_status == "MAYBE" and not conditions:
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "passive_conditions",
                        "message": "Passiv Status 'VIELLEICHT' erfordert Bedingungen",
                        "type": "missing_required"
                    })
                
                # Validate ranges für active/passive
                for variant in ["active", "passive"]:
                    interest = resp_data.get(f"{variant}_interest")
                    comfort = resp_data.get(f"{variant}_comfort")
                    if interest is not None and (interest < 0 or interest > 4):
                        errors.append({
                            "question_id": qid,
                            "question_label": label,
                            "field": f"{variant}_interest",
                            "message": f"{variant.capitalize()} Interesse muss zwischen 0 und 4 liegen",
                            "type": "range_error"
                        })
                    if comfort is not None and (comfort < 0 or comfort > 4):
                        errors.append({
                            "question_id": qid,
                            "question_label": label,
                            "field": f"{variant}_comfort",
                            "message": f"{variant.capitalize()} Komfort muss zwischen 0 und 4 liegen",
                            "type": "range_error"
                        })
                    
                    # Low comfort high interest warning
                    if interest is not None and comfort is not None:
                        if interest >= 3 and comfort <= 2:
                            warnings.append({
                                "question_id": qid,
                                "question_label": label,
                                "field": f"{variant}_interest",
                                "message": f"{variant.capitalize()}: Hohes Interesse ({interest}) aber niedriger Komfort ({comfort})",
                                "type": "low_comfort_high_interest"
                            })
            
            # Standard consent_rating
            else:
                status = resp_data.get("status")
                conditions = resp_data.get("conditions", "").strip()
                interest = resp_data.get("interest")
                comfort = resp_data.get("comfort")
                
                # MAYBE requires conditions
                if status == "MAYBE" and not conditions:
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "conditions",
                        "message": "Bei Status 'VIELLEICHT' müssen Bedingungen angegeben werden",
                        "type": "missing_required"
                    })
                
                # Validate ranges
                if interest is not None and (interest < 0 or interest > 4):
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "interest",
                        "message": "Interesse muss zwischen 0 und 4 liegen",
                        "type": "range_error"
                    })
                if comfort is not None and (comfort < 0 or comfort > 4):
                    errors.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "comfort",
                        "message": "Komfort muss zwischen 0 und 4 liegen",
                        "type": "range_error"
                    })
                
                # Low comfort high interest warning
                if interest is not None and comfort is not None:
                    if interest >= 3 and comfort <= 2:
                        warnings.append({
                            "question_id": qid,
                            "question_label": label,
                            "field": "interest",
                            "message": f"Hohes Interesse ({interest}) aber niedriger Komfort ({comfort})",
                            "type": "low_comfort_high_interest"
                        })
                
                # High-risk questions should have conditions if YES
                if risk_level == "C" and status == "YES" and not conditions:
                    warnings.append({
                        "question_id": qid,
                        "question_label": label,
                        "field": "conditions",
                        "message": "High-Risk Frage: Bitte Bedingungen für Sicherheit notieren",
                        "type": "high_risk_missing_conditions"
                    })
        
        elif schema == "scale_0_10":
            value = resp_data.get("value")
            if value is not None and (value < 0 or value > 10):
                errors.append({
                    "question_id": qid,
                    "question_label": label,
                    "field": "value",
                    "message": "Wert muss zwischen 0 und 10 liegen",
                    "type": "range_error"
                })
    
    return errors, warnings

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
    with db() as conn:
        rows = conn.execute("""
            SELECT s.id, s.name, s.template_id, s.created_at,
                   (SELECT 1 FROM responses r WHERE r.session_id=s.id AND r.person='A') AS has_a,
                   (SELECT 1 FROM responses r WHERE r.session_id=s.id AND r.person='B') AS has_b
            FROM sessions s
            ORDER BY s.created_at DESC
        """).fetchall()

    out = []
    for r in rows:
        out.append(SessionListItem(
            id=r["id"],
            name=r["name"],
            template_id=r["template_id"],
            created_at=r["created_at"],
            has_a=bool(r["has_a"]),
            has_b=bool(r["has_b"]),
        ))
    return out

@api_router.post("/sessions", response_model=SessionListItem)
def create_session(req: CreateSessionRequest):
    # verify template exists
    try:
        load_template(req.template_id)
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid template_id")

    session_id = str(uuid.uuid4())
    km = create_key_material(req.password)

    pin_a_hash = hash_pin(req.pin_a, km.salt, "A") if req.pin_a else None
    pin_b_hash = hash_pin(req.pin_b, km.salt, "B") if req.pin_b else None

    with db() as conn:
        conn.execute(
            "INSERT INTO sessions(id, name, template_id, created_at, salt, pw_verifier, pin_a_hash, pin_b_hash) VALUES (?,?,?,?,?,?,?,?)",
            (session_id, req.name, req.template_id, _utcnow(), km.salt, km.verifier, pin_a_hash, pin_b_hash),
        )

    return SessionListItem(
        id=session_id,
        name=req.name,
        template_id=req.template_id,
        created_at=_utcnow(),
        has_a=False,
        has_b=False,
    )

def _load_session_row(session_id: str):
    with db() as conn:
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row

def _require_password(session_row, password: str):
    salt = session_row["salt"]
    if not verify_password(password, salt, session_row["pw_verifier"]):
        raise HTTPException(status_code=401, detail="Wrong password")
    return salt

@api_router.get("/sessions/{session_id}", response_model=SessionInfo)
def session_info(session_id: str):
    srow = _load_session_row(session_id)
    tpl = load_template(srow["template_id"])

    with db() as conn:
        has_a = conn.execute("SELECT 1 FROM responses WHERE session_id=? AND person='A'", (session_id,)).fetchone()
        has_b = conn.execute("SELECT 1 FROM responses WHERE session_id=? AND person='B'", (session_id,)).fetchone()

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
    salt = _require_password(srow, req.password)

    stored_pin_hash = srow["pin_a_hash"] if person == "A" else srow["pin_b_hash"]
    if not verify_pin(req.pin, stored_pin_hash, salt, person):
        raise HTTPException(status_code=401, detail="Wrong PIN")

    with db() as conn:
        row = conn.execute("SELECT encrypted_blob FROM responses WHERE session_id=? AND person=?", (session_id, person)).fetchone()
    if not row:
        return {"responses": {}}

    try:
        plaintext = decrypt_json(req.password, salt, row["encrypted_blob"])
        return {"responses": json.loads(plaintext)}
    except ValueError:
        raise HTTPException(status_code=401, detail="Decrypt failed")

@api_router.post("/sessions/{session_id}/responses/{person}/save")
def save_responses(session_id: str, person: str, req: SaveResponsesRequest):
    if person not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Invalid person")
    srow = _load_session_row(session_id)
    salt = _require_password(srow, req.password)

    stored_pin_hash = srow["pin_a_hash"] if person == "A" else srow["pin_b_hash"]
    if not verify_pin(req.pin, stored_pin_hash, salt, person):
        raise HTTPException(status_code=401, detail="Wrong PIN")

    # basic sanity: must be dict
    if not isinstance(req.responses, dict):
        raise HTTPException(status_code=400, detail="responses must be object/dict")

    # Validate responses against template
    tpl = load_template(srow["template_id"])
    validation_errors, validation_warnings = validate_responses(tpl, req.responses)
    
    # Return warnings but only block on errors
    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail=json.dumps({
                "message": "Validation errors",
                "errors": validation_errors,
                "warnings": validation_warnings
            })
        )

    blob = encrypt_json(req.password, salt, json.dumps(req.responses, ensure_ascii=False))

    with db() as conn:
        conn.execute(
            "INSERT INTO responses(session_id, person, encrypted_blob, updated_at) VALUES (?,?,?,?) "
            "ON CONFLICT(session_id, person) DO UPDATE SET encrypted_blob=excluded.encrypted_blob, updated_at=excluded.updated_at",
            (session_id, person, blob, _utcnow()),
        )
    return {"ok": True, "updated_at": _utcnow()}

def _load_both_responses(session_id: str, password: str):
    srow = _load_session_row(session_id)
    salt = _require_password(srow, password)
    with db() as conn:
        ra = conn.execute("SELECT encrypted_blob FROM responses WHERE session_id=? AND person='A'", (session_id,)).fetchone()
        rb = conn.execute("SELECT encrypted_blob FROM responses WHERE session_id=? AND person='B'", (session_id,)).fetchone()
    if not ra or not rb:
        raise HTTPException(status_code=400, detail="Need both A and B responses to compare")

    resp_a = json.loads(decrypt_json(password, salt, ra["encrypted_blob"]))
    resp_b = json.loads(decrypt_json(password, salt, rb["encrypted_blob"]))
    return srow, salt, resp_a, resp_b

@api_router.post("/sessions/{session_id}/compare", response_model=CompareResult)
def compare_session(session_id: str, req: CompareRequest):
    start = time.time()
    try:
        srow, _salt, resp_a, resp_b = _load_both_responses(session_id, req.password)
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
    srow, _salt, resp_a, resp_b = _load_both_responses(session_id, req.password)
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
    srow, _salt, resp_a, resp_b = _load_both_responses(session_id, req.password)
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
        return json.load(f)

@api_router.post("/sessions/{session_id}/ai/analyze")
async def ai_analyze(session_id: str, req: AIAnalyzeRequest):
    srow, salt, resp_a, resp_b = _load_both_responses(session_id, req.password)
    tpl = load_template(srow["template_id"])
    result = compare(tpl, resp_a, resp_b)

    if req.provider != "openrouter":
        raise HTTPException(status_code=400, detail="Only openrouter supported currently")

    report = await openrouter_analyze(
        session_id=session_id,
        password=req.password,
        salt=salt,
        compare_result=result,
        api_key=req.api_key,
        model=req.model,
        base_url=req.base_url,
        max_tokens=req.max_tokens,
        redact_free_text=req.redact_free_text,
    )
    return report

@api_router.post("/sessions/{session_id}/ai/list")
def ai_list(session_id: str, req: CompareRequest):
    srow = _load_session_row(session_id)
    salt = _require_password(srow, req.password)
    return {"reports": list_ai_reports(session_id, req.password, salt)}


