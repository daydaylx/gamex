from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

def _get(resp: Dict[str, Any], qid: str) -> Dict[str, Any]:
    v = resp.get(qid)
    return v if isinstance(v, dict) else {}

def _status_pair(a: str, b: str) -> str:
    # boundaries override everything
    if a == "NO" or b == "NO":
        return "BOUNDARY"
    if a == "YES" and b == "YES":
        return "MATCH"
    return "EXPLORE"

def _flag_low_comfort_high_interest(entry: Dict[str, Any]) -> bool:
    try:
        i = int(entry.get("interest", -1))
        c = int(entry.get("comfort", -1))
        return i >= 3 and c <= 2
    except Exception:
        return False

def _abs_delta(a: Optional[int], b: Optional[int]) -> Optional[int]:
    if a is None or b is None:
        return None
    return abs(a - b)

def _safe_int(v: Any) -> Optional[int]:
    try:
        if v is None:
            return None
        return int(v)
    except Exception:
        return None

def compare(template: Dict[str, Any], resp_a: Dict[str, Any], resp_b: Dict[str, Any]) -> Dict[str, Any]:
    items: List[Dict[str, Any]] = []
    summary = {
        "counts": {"MATCH": 0, "EXPLORE": 0, "BOUNDARY": 0},
        "flags": {"low_comfort_high_interest": 0, "big_delta": 0, "high_risk": 0},
        "generated_at": _utcnow()
    }

    modules = template.get("modules", [])
    for mod in modules:
        mod_id = mod.get("id", "")
        mod_name = mod.get("name", "")
        for q in mod.get("questions", []):
            qid = q.get("id")
            schema = q.get("schema")
            risk = q.get("risk_level", "A")
            label = q.get("label", "")
            help_text = q.get("help", "")
            tags = q.get("tags", [])

            row: Dict[str, Any] = {
                "question_id": qid,
                "module_id": mod_id,
                "module_name": mod_name,
                "label": label,
                "help": help_text,
                "schema": schema,
                "risk_level": risk,
                "tags": tags,
            }

            a = _get(resp_a, qid)
            b = _get(resp_b, qid)
            row["a"] = a
            row["b"] = b

            flags: List[str] = []
            pair_status = None

            if schema == "consent_rating":
                sa = a.get("status")
                sb = b.get("status")
                if sa and sb:
                    pair_status = _status_pair(sa, sb)
                else:
                    pair_status = "EXPLORE"  # incomplete treated as explore

                ia = _safe_int(a.get("interest"))
                ib = _safe_int(b.get("interest"))
                ca = _safe_int(a.get("comfort"))
                cb = _safe_int(b.get("comfort"))

                row["delta_interest"] = _abs_delta(ia, ib)
                row["delta_comfort"] = _abs_delta(ca, cb)

                if _flag_low_comfort_high_interest(a) or _flag_low_comfort_high_interest(b):
                    flags.append("low_comfort_high_interest")
                    summary["flags"]["low_comfort_high_interest"] += 1

                if (row["delta_interest"] is not None and row["delta_interest"] >= 3) or (row["delta_comfort"] is not None and row["delta_comfort"] >= 3):
                    flags.append("big_delta")
                    summary["flags"]["big_delta"] += 1

            elif schema == "scale_0_10":
                va = _safe_int(a.get("value"))
                vb = _safe_int(b.get("value"))
                row["delta_value"] = _abs_delta(va, vb)
                pair_status = "MATCH" if (va is not None and vb is not None and row["delta_value"] <= 1) else "EXPLORE"
                if row.get("delta_value") is not None and row["delta_value"] >= 4:
                    flags.append("big_delta")
                    summary["flags"]["big_delta"] += 1

            elif schema == "enum":
                va = a.get("value")
                vb = b.get("value")
                row["match_value"] = (va == vb and va is not None)
                pair_status = "MATCH" if row["match_value"] else "EXPLORE"

            elif schema == "multi":
                la = a.get("values") if isinstance(a.get("values"), list) else []
                lb = b.get("values") if isinstance(b.get("values"), list) else []
                inter = sorted(list(set(la).intersection(set(lb))))
                row["intersection"] = inter
                pair_status = "MATCH" if len(inter) > 0 else "EXPLORE"

            elif schema == "text":
                # not matchable automatically
                pair_status = "EXPLORE"

            else:
                pair_status = "EXPLORE"

            if risk == "C":
                flags.append("high_risk")
                summary["flags"]["high_risk"] += 1

            row["pair_status"] = pair_status
            row["flags"] = flags

            if pair_status in summary["counts"]:
                summary["counts"][pair_status] += 1

            items.append(row)

    # Sort for presentation: boundaries first, then explore, then matches; high risk within groups
    order = {"BOUNDARY": 0, "EXPLORE": 1, "MATCH": 2}
    items.sort(key=lambda r: (order.get(r["pair_status"], 9), 0 if r.get("risk_level") == "C" else 1, r.get("module_name",""), r.get("question_id","")))

    meta = {"template_id": template.get("id"), "template_name": template.get("name"), "template_version": template.get("version")}
    return {"meta": meta, "summary": summary, "items": items}


