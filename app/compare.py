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
    if a in ("NO", "HARD_LIMIT") or b in ("NO", "HARD_LIMIT"):
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

def _generate_action_plan(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Filter for MATCH items of type consent_rating
    matches = [
        it for it in items 
        if it["pair_status"] == "MATCH" 
        and it.get("schema") == "consent_rating"
    ]
    
    # Calculate score (avg interest + avg comfort)
    scored = []
    for m in matches:
        ia = _safe_int(m["a"].get("interest")) or 0
        ib = _safe_int(m["b"].get("interest")) or 0
        ca = _safe_int(m["a"].get("comfort")) or 0
        cb = _safe_int(m["b"].get("comfort")) or 0
        score = (ia + ib) + (ca + cb) # Higher is better
        scored.append((score, m))
        
    # Sort descending
    scored.sort(key=lambda x: x[0], reverse=True)
    
    # Pick top 3 unique modules if possible
    plan = []
    used_modules = set()
    
    # First pass: try to get different modules
    for score, m in scored:
        if len(plan) >= 3: break
        if m["module_id"] not in used_modules:
            plan.append(m)
            used_modules.add(m["module_id"])
            
    # Second pass: fill if needed
    if len(plan) < 3:
        for score, m in scored:
            if len(plan) >= 3: break
            if m not in plan:
                plan.append(m)
                
    return plan

def compare(template: Dict[str, Any], resp_a: Dict[str, Any], resp_b: Dict[str, Any]) -> Dict[str, Any]:
    items: List[Dict[str, Any]] = []
    summary = {
        "counts": {"MATCH": 0, "EXPLORE": 0, "BOUNDARY": 0},
        "flags": {"low_comfort_high_interest": 0, "big_delta": 0, "high_risk": 0, "hard_limit_violation": 0},
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

                # Check for Hard Limit Violations (One wants it, other has hard limit)
                wants_it = ["YES", "MAYBE"]
                if (sa == "HARD_LIMIT" and sb in wants_it) or (sb == "HARD_LIMIT" and sa in wants_it):
                    flags.append("hard_limit_violation")
                    summary["flags"]["hard_limit_violation"] += 1

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

    action_plan = _generate_action_plan(items)

    meta = {"template_id": template.get("id"), "template_name": template.get("name"), "template_version": template.get("version")}
    return {"meta": meta, "summary": summary, "items": items, "action_plan": action_plan}