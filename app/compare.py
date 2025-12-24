from __future__ import annotations

import json
import time
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.logging import log_performance

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

def _load_scenarios() -> List[Dict[str, Any]]:
    try:
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
    except Exception:
        return []

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
        interest = entry.get("interest")
        comfort = entry.get("comfort")
        # Return False if either value is missing
        if interest is None or comfort is None:
            return False
        i = int(interest)
        c = int(comfort)
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
    
    # Filter by comfort level (both >= 3)
    comfort_filtered = []
    for m in matches:
        ca = _safe_int(m["a"].get("comfort")) or 0
        cb = _safe_int(m["b"].get("comfort")) or 0
        if ca >= 3 and cb >= 3:
            comfort_filtered.append(m)
    
    # Calculate enhanced score
    scored = []
    for m in comfort_filtered:
        ia = _safe_int(m["a"].get("interest")) or 0
        ib = _safe_int(m["b"].get("interest")) or 0
        ca = _safe_int(m["a"].get("comfort")) or 0
        cb = _safe_int(m["b"].get("comfort")) or 0
        
        # Base score: interest + comfort
        base_score = (ia + ib) + (ca + cb)
        
        # Bonus für moderate risk (nicht nur high-risk)
        risk_bonus = 0
        if m.get("risk_level") == "B":
            risk_bonus = 1
        elif m.get("risk_level") == "A":
            risk_bonus = 2
        
        score = base_score + risk_bonus
        scored.append((score, m))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    
    # Tag-basierte Diversität
    plan = []
    used_modules = set()
    used_tags = set()
    tag_categories = {
        "soft": ["kissing", "touching", "cuddling"],
        "toy": ["toy", "vibrator", "plug"],
        "kink": ["bdsm", "roleplay", "fetish"],
        "intense": ["impact", "breath", "edge"]
    }
    
    # First pass: versuche verschiedene Tags
    for score, m in scored:
        if len(plan) >= 3:
            break
        tags = set(m.get("tags", []))
        category = None
        for cat, tag_list in tag_categories.items():
            if tags.intersection(tag_list):
                category = cat
                break
        
        if category and category not in used_tags:
            plan.append(m)
            used_modules.add(m["module_id"])
            used_tags.add(category)
    
    # Second pass: verschiedene Module
    for score, m in scored:
        if len(plan) >= 3:
            break
        if m["module_id"] not in used_modules and m not in plan:
            plan.append(m)
            used_modules.add(m["module_id"])
    
    # Third pass: fill remaining slots
    for score, m in scored:
        if len(plan) >= 3:
            break
        if m not in plan:
            plan.append(m)
    
    return plan

def compare(template: Dict[str, Any], resp_a: Dict[str, Any], resp_b: Dict[str, Any]) -> Dict[str, Any]:
    start = time.time()
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
                # Handle Dom/Sub variants
                if a.get("dom_status") is not None or b.get("dom_status") is not None:
                    # Dom/Sub variant logic
                    dom_sa = a.get("dom_status")
                    dom_sb = b.get("dom_status")
                    sub_sa = a.get("sub_status")
                    sub_sb = b.get("sub_status")
                    
                    dom_status = _status_pair(dom_sa or "MAYBE", dom_sb or "MAYBE")
                    sub_status = _status_pair(sub_sa or "MAYBE", sub_sb or "MAYBE")
                    
                    # Overall status is worst case
                    if dom_status == "BOUNDARY" or sub_status == "BOUNDARY":
                        pair_status = "BOUNDARY"
                    elif dom_status == "MATCH" and sub_status == "MATCH":
                        pair_status = "MATCH"
                    else:
                        pair_status = "EXPLORE"
                    
                    # Calculate deltas for both
                    dom_ia = _safe_int(a.get("dom_interest"))
                    dom_ib = _safe_int(b.get("dom_interest"))
                    dom_ca = _safe_int(a.get("dom_comfort"))
                    dom_cb = _safe_int(b.get("dom_comfort"))
                    sub_ia = _safe_int(a.get("sub_interest"))
                    sub_ib = _safe_int(b.get("sub_interest"))
                    sub_ca = _safe_int(a.get("sub_comfort"))
                    sub_cb = _safe_int(b.get("sub_comfort"))
                    
                    row["delta_interest"] = max(_abs_delta(dom_ia, dom_ib) or 0, _abs_delta(sub_ia, sub_ib) or 0)
                    row["delta_comfort"] = max(_abs_delta(dom_ca, dom_cb) or 0, _abs_delta(sub_ca, sub_cb) or 0)
                    
                    row["dom_status"] = dom_status
                    row["sub_status"] = sub_status
                
                # Handle active/passive variants
                elif a.get("active_status") is not None or b.get("active_status") is not None:
                    # Active/Passive logic
                    active_sa = a.get("active_status")
                    active_sb = b.get("active_status")
                    passive_sa = a.get("passive_status")
                    passive_sb = b.get("passive_status")
                    
                    active_status = _status_pair(active_sa or "MAYBE", active_sb or "MAYBE")
                    passive_status = _status_pair(passive_sa or "MAYBE", passive_sb or "MAYBE")
                    
                    # Overall status is worst case
                    if active_status == "BOUNDARY" or passive_status == "BOUNDARY":
                        pair_status = "BOUNDARY"
                    elif active_status == "MATCH" and passive_status == "MATCH":
                        pair_status = "MATCH"
                    else:
                        pair_status = "EXPLORE"
                    
                    # Calculate deltas for both
                    active_ia = _safe_int(a.get("active_interest"))
                    active_ib = _safe_int(b.get("active_interest"))
                    active_ca = _safe_int(a.get("active_comfort"))
                    active_cb = _safe_int(b.get("active_comfort"))
                    passive_ia = _safe_int(a.get("passive_interest"))
                    passive_ib = _safe_int(b.get("passive_interest"))
                    passive_ca = _safe_int(a.get("passive_comfort"))
                    passive_cb = _safe_int(b.get("passive_comfort"))
                    
                    row["delta_interest"] = max(_abs_delta(active_ia, active_ib) or 0, _abs_delta(passive_ia, passive_ib) or 0)
                    row["delta_comfort"] = max(_abs_delta(active_ca, active_cb) or 0, _abs_delta(passive_ca, passive_cb) or 0)
                    
                    row["active_status"] = active_status
                    row["passive_status"] = passive_status
                
                # Standard consent_rating
                else:
                    sa = a.get("status")
                    sb = b.get("status")
                    if sa and sb:
                        pair_status = _status_pair(sa, sb)
                    else:
                        pair_status = "EXPLORE"

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

    # 2. Compare Scenarios
    scenarios = _load_scenarios()
    for scen in scenarios:
        sid = scen["id"]
        key = f"SCENARIO_{sid}"
        
        sa = resp_a.get(key)
        sb = resp_b.get(key)
        
        if sa or sb:
            choice_a = sa.get("choice") if isinstance(sa, dict) else None
            choice_b = sb.get("choice") if isinstance(sb, dict) else None
            
            p_status = "EXPLORE"
            if choice_a and choice_b:
                if choice_a == choice_b:
                    p_status = "MATCH"
                else:
                    risk_a = sa.get("risk_type")
                    risk_b = sb.get("risk_type")
                    risky_types = ["active", "explore", "masochism", "submission", "fantasy_active"]
                    stop_types = ["boundary", "safety", "no"]
                    
                    if (risk_a in risky_types and risk_b in stop_types) or \
                       (risk_b in risky_types and risk_a in stop_types):
                        p_status = "BOUNDARY"
            
            if p_status in summary["counts"]:
                summary["counts"][p_status] += 1
                
            items.append({
                "question_id": sid,
                "module_id": "scenarios",
                "module_name": f"Szenario: {scen.get('category')}",
                "label": scen.get("title"),
                "help": scen.get("description"),
                "schema": "scenario",
                "risk_level": "B",
                "tags": ["scenario"],
                "a": sa,
                "b": sb,
                "pair_status": p_status,
                "flags": ["scenario"]
            })

    # Sort for presentation: boundaries first, then explore, then matches; high risk within groups
    order = {"BOUNDARY": 0, "EXPLORE": 1, "MATCH": 2}
    items.sort(key=lambda r: (order.get(r["pair_status"], 9), 0 if r.get("risk_level") == "C" else 1, r.get("module_name", ""), r.get("question_id", "")))

    action_plan = _generate_action_plan(items)

    duration = (time.time() - start) * 1000
    log_performance("compare_operation", duration,
                   template_id=template.get("id"),
                   item_count=len(items))
    
    meta = {"template_id": template.get("id"), "template_name": template.get("name"), "template_version": template.get("version")}
    return {"meta": meta, "summary": summary, "items": items, "action_plan": action_plan}