import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db import db
from app.models import TemplateListItem

DEFAULT_TEMPLATE_ID = "unified_v1"

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

def ensure_default_template() -> None:
    with db() as conn:
        row = conn.execute("SELECT id FROM templates WHERE id = ?", (DEFAULT_TEMPLATE_ID,)).fetchone()
        if row:
            return

    here = os.path.dirname(__file__)
    path = os.path.join(here, "templates", "default_template.json")
    with open(path, "r", encoding="utf-8") as f:
        tpl = json.load(f)

    save_template(DEFAULT_TEMPLATE_ID, tpl["name"], tpl["version"], tpl)

def save_template(template_id: str, name: str, version: int, tpl_json: Dict[str, Any]) -> None:
    with db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO templates(id, name, version, json, created_at) VALUES (?,?,?,?,?)",
            (template_id, name, version, json.dumps(tpl_json, ensure_ascii=False), _utcnow())
        )

def list_templates() -> List[TemplateListItem]:
    with db() as conn:
        rows = conn.execute("SELECT id, name, version FROM templates ORDER BY created_at DESC").fetchall()
    return [TemplateListItem(id=r["id"], name=r["name"], version=int(r["version"])) for r in rows]

def load_template(template_id: str) -> Dict[str, Any]:
    with db() as conn:
        row = conn.execute("SELECT json FROM templates WHERE id = ?", (template_id,)).fetchone()
    if not row:
        raise KeyError(f"Template not found: {template_id}")
    return json.loads(row["json"])


