from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

from app.db import db

# Security: Whitelist of allowed AI provider base URLs
ALLOWED_AI_PROVIDERS = {
    "https://openrouter.ai/api/v1",
    "https://api.openai.com/v1",
    "https://api.anthropic.com/v1",
}

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

def _validate_ai_provider_url(base_url: str) -> bool:
    """
    Validate that the AI provider URL is in the whitelist.
    Returns True if valid, False otherwise.
    """
    # Normalize URL (remove trailing slash)
    normalized_url = base_url.rstrip("/")
    return normalized_url in ALLOWED_AI_PROVIDERS

def _build_prompt(compare_result: Dict[str, Any]) -> str:
    # Keep it non-explicit. Focus on consent, boundaries, planning.
    return (
        "Du bist ein neutraler Auswerter von zwei Fragebögen zu Intimität, Rollen/Kontrolle und optionalen Themen.\n"
        "Priorität: Sicherheit, Konsens, keine Überredung. Ein 'NEIN' ist final. 'VIELLEICHT' gilt nur unter Bedingungen.\n"
        "Aufgabe:\n"
        "1) Matches (JA/JA) zusammenfassen und 5 konkrete, low-risk Ideen vorschlagen (ohne explizite Anleitungen).\n"
        "2) Explore (VIELLEICHT beteiligt) inkl. Bedingungen beider und einem vorsichtigen Einstieg je Thema.\n"
        "3) Grenzenliste (mind. ein NEIN) ohne Diskussion.\n"
        "4) Risiko-Flags erklären (Diskrepanzen, niedriger Komfort bei hohem Interesse, High-Risk).\n"
        "5) Szenarien-Check: Prüfe Diskrepanzen in den 'Szenarien' (Schema 'scenario'). Wenn einer 'A' (Machen) und der andere 'D' (Klären) oder 'C' (Gehen) wählt, thematisiere das als konkreten Gesprächsbedarf.\n"
        "6) 4-Wochen-Plan: 3 Experimente + Debrief-Fragen.\n"
        "Ausgabe: Überschriften + Bulletpoints, konkret, nicht explizit pornografisch.\n\n"
        "Eingabedaten (Vergleichsergebnis als JSON):\n"
        f"{json.dumps(compare_result, ensure_ascii=False)}"
    )

def redact(compare_result: Dict[str, Any], drop_free_text: bool = True) -> Dict[str, Any]:
    if not drop_free_text:
        return compare_result

    red = json.loads(json.dumps(compare_result))
    for item in red.get("items", []):
        for side in ("a", "b"):
            if isinstance(item.get(side), dict):
                item[side].pop("notes", None)
                item[side].pop("conditions", None)
                item[side].pop("text", None)
    return red

async def openrouter_analyze(
    session_id: str,
    compare_result: Dict[str, Any],
    api_key: str,
    model: str,
    base_url: str,
    max_tokens: int,
    redact_free_text: bool,
) -> Dict[str, Any]:
    # Security: Validate AI provider URL is whitelisted
    if not _validate_ai_provider_url(base_url):
        raise ValueError(
            f"AI provider URL not allowed. Must be one of: {', '.join(ALLOWED_AI_PROVIDERS)}"
        )

    payload_compare = redact(compare_result, drop_free_text=redact_free_text)
    prompt = _build_prompt(payload_compare)

    url = base_url.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Du arbeitest sachlich, consent-orientiert, nicht explizit und ohne Überredung."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.5,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()

    text = ""
    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        import logging
        logging.warning(f"AI response parsing failed: {type(e).__name__}: {e}")
        # Fallback: return full response as JSON
        text = json.dumps(data, ensure_ascii=False)
    except Exception as e:
        import logging
        logging.exception("Unexpected error in AI response parsing")
        # Re-raise unexpected exceptions to avoid hiding bugs
        raise

    report_id = str(uuid.uuid4())
    payload = json.dumps({"text": text}, ensure_ascii=False)

    with db() as conn:
        conn.execute(
            "INSERT INTO ai_reports(id, session_id, created_at, provider, model, json) VALUES (?,?,?,?,?,?)",
            (report_id, session_id, _utcnow(), "openrouter", model, payload),
        )

    return {"id": report_id, "created_at": _utcnow(), "provider": "openrouter", "model": model, "text": text}

def list_ai_reports(session_id: str):
    with db() as conn:
        rows = conn.execute(
            "SELECT id, created_at, provider, model, json FROM ai_reports WHERE session_id = ? ORDER BY created_at DESC",
            (session_id,),
        ).fetchall()
    out = []
    for r in rows:
        payload = json.loads(r["json"])
        out.append({
            "id": r["id"],
            "created_at": r["created_at"],
            "provider": r["provider"],
            "model": r["model"],
            "text": payload.get("text",""),
        })
    return out










