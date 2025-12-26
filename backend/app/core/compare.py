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
    except (json.JSONDecodeError, IOError, OSError) as e:
        # #region agent log
        import json as _json; import time as _time; _log_data = {'location': 'core/compare.py:29', 'message': 'ERROR: exception in _load_scenarios', 'data': {'error_type': type(e).__name__, 'error_msg': str(e)}, 'timestamp': int(_time.time() * 1000), 'sessionId': 'debug-session', 'runId': 'post-fix', 'hypothesisId': 'D'}; _log_file = open('/home/d/Schreibtisch/gamex/.cursor/debug.log', 'a'); _log_file.write(_json.dumps(_log_data) + '\n'); _log_file.close()
        # #endregion
        return []
    except Exception as e:
        # #region agent log
        import json as _json; import time as _time; _log_data = {'location': 'core/compare.py:33', 'message': 'ERROR: unexpected exception in _load_scenarios', 'data': {'error_type': type(e).__name__, 'error_msg': str(e)}, 'timestamp': int(_time.time() * 1000), 'sessionId': 'debug-session', 'runId': 'post-fix', 'hypothesisId': 'D'}; _log_file = open('/home/d/Schreibtisch/gamex/.cursor/debug.log', 'a'); _log_file.write(_json.dumps(_log_data) + '\n'); _log_file.close()
        # #endregion
        # Re-raise unexpected exceptions to avoid hiding bugs
        raise

def normalize_answer(answer: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalisiert eine Antwort, um neue Felder mit Standardwerten zu füllen.
    Rückwärtskompatibel: Alte Antworten funktionieren weiterhin.
    
    Neue Felder:
    - intensity (1-5, default 3)
    - hardNo (boolean, optional - wird aus status="NO" abgeleitet wenn nicht gesetzt)
    - contextFlags (array, default [])
    - confidence (1-5, optional, getrennt von comfort)
    """
    normalized = answer.copy() if isinstance(answer, dict) else {}
    
    # Für consent_rating Antworten
    if "status" in normalized or "dom_status" in normalized or "sub_status" in normalized or "active_status" in normalized or "passive_status" in normalized:
        # Setze intensity default auf 3, falls nicht vorhanden
        if "intensity" not in normalized:
            normalized["intensity"] = 3
        elif normalized.get("intensity") is None:
            normalized["intensity"] = 3
        else:
            # Stelle sicher, dass intensity im gültigen Bereich ist
            try:
                intensity = int(normalized["intensity"])
                if intensity < 1:
                    normalized["intensity"] = 1
                elif intensity > 5:
                    normalized["intensity"] = 5
                else:
                    normalized["intensity"] = intensity
            except (ValueError, TypeError):
                normalized["intensity"] = 3
        
        # Konvertiere alten status="NO" zu hardNo=true (nur wenn hardNo nicht explizit gesetzt ist)
        if "hardNo" not in normalized:
            status = normalized.get("status")
            if status == "NO" or status == "HARD_LIMIT":
                normalized["hardNo"] = True
            else:
                normalized["hardNo"] = False
        
        # Stelle sicher, dass contextFlags ein Array ist
        if "contextFlags" not in normalized:
            normalized["contextFlags"] = []
        elif not isinstance(normalized.get("contextFlags"), list):
            normalized["contextFlags"] = []
        
        # confidence (optional, getrennt von comfort)
        if "confidence" in normalized and normalized.get("confidence") is not None:
            try:
                confidence = int(normalized["confidence"])
                if confidence < 1:
                    normalized["confidence"] = 1
                elif confidence > 5:
                    normalized["confidence"] = 5
                else:
                    normalized["confidence"] = confidence
            except (ValueError, TypeError):
                # Entferne ungültige confidence
                normalized.pop("confidence", None)
    
    return normalized

def _get(resp: Dict[str, Any], qid: str) -> Dict[str, Any]:
    v = resp.get(qid)
    answer = v if isinstance(v, dict) else {}
    return normalize_answer(answer)

def _status_pair(a: str, b: str) -> str:
    # boundaries override everything
    if a in ("NO", "HARD_LIMIT") or b in ("NO", "HARD_LIMIT"):
        return "MISMATCH"
    if a == "YES" and b == "YES":
        return "MATCH"
    return "EXPLORE"

def _classify_bucket(
    pair_status: str,
    schema: str,
    a: Dict[str, Any],
    b: Dict[str, Any],
    risk_level: str
) -> str:
    """
    Klassifiziert ein Item in einen Bucket basierend auf Antworten und Kontext.
    
    Buckets:
    - DOABLE NOW: Beide YES, comfort >= 3, Low-Medium-Risiko
    - EXPLORE: Beide YES/MAYBE, oder Interesse hoch aber Komfort niedrig
    - TALK FIRST: MAYBE mit Bedingungen, oder High-Risk-Items
    - MISMATCH: Einer YES/MAYBE, anderer NO/HARD_LIMIT
    """
    if pair_status == "MISMATCH":
        return "MISMATCH"
    
    if schema != "consent_rating":
        # Für non-consent_rating: MATCH -> DOABLE NOW, EXPLORE -> EXPLORE
        if pair_status == "MATCH":
            return "DOABLE NOW"
        return "EXPLORE"
    
    # Für consent_rating: detailliertere Klassifizierung
    status_a = a.get("status")
    status_b = b.get("status")
    comfort_a = _safe_int(a.get("comfort")) or 0
    comfort_b = _safe_int(b.get("comfort")) or 0
    interest_a = _safe_int(a.get("interest")) or 0
    interest_b = _safe_int(b.get("interest")) or 0
    conditions_a = a.get("conditions", "").strip()
    conditions_b = b.get("conditions", "").strip()
    
    # MISMATCH: Einer will es, anderer nicht
    if (status_a in ("YES", "MAYBE") and status_b in ("NO", "HARD_LIMIT")) or \
       (status_b in ("YES", "MAYBE") and status_a in ("NO", "HARD_LIMIT")):
        return "MISMATCH"
    
    # Beide YES
    if status_a == "YES" and status_b == "YES":
        # DOABLE NOW: beide comfort >= 3 und low-medium risk
        if comfort_a >= 3 and comfort_b >= 3 and risk_level in ("A", "B"):
            return "DOABLE NOW"
        # Sonst EXPLORE (z.B. wenn comfort niedrig)
        return "EXPLORE"
    
    # Beide MAYBE oder Mischung YES/MAYBE
    if status_a in ("YES", "MAYBE") and status_b in ("YES", "MAYBE"):
        # TALK FIRST: wenn MAYBE mit Bedingungen oder High-Risk
        if risk_level == "C":
            return "TALK FIRST"
        if (status_a == "MAYBE" and conditions_a) or (status_b == "MAYBE" and conditions_b):
            return "TALK FIRST"
        # EXPLORE: wenn Interesse hoch aber Komfort niedrig
        if (interest_a >= 3 and comfort_a <= 2) or (interest_b >= 3 and comfort_b <= 2):
            return "EXPLORE"
        # Sonst TALK FIRST bei MAYBE
        if status_a == "MAYBE" or status_b == "MAYBE":
            return "TALK FIRST"
        return "EXPLORE"
    
    # Fallback
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
    except (ValueError, TypeError, KeyError) as e:
        # #region agent log
        import json as _json; import time as _time; _log_data = {'location': 'core/compare.py:187', 'message': 'ERROR: exception in _flag_low_comfort_high_interest', 'data': {'error_type': type(e).__name__, 'error_msg': str(e)}, 'timestamp': int(_time.time() * 1000), 'sessionId': 'debug-session', 'runId': 'post-fix', 'hypothesisId': 'D'}; _log_file = open('/home/d/Schreibtisch/gamex/.cursor/debug.log', 'a'); _log_file.write(_json.dumps(_log_data) + '\n'); _log_file.close()
        # #endregion
        return False
    except Exception as e:
        # #region agent log
        import json as _json; import time as _time; _log_data = {'location': 'core/compare.py:191', 'message': 'ERROR: unexpected exception in _flag_low_comfort_high_interest', 'data': {'error_type': type(e).__name__, 'error_msg': str(e)}, 'timestamp': int(_time.time() * 1000), 'sessionId': 'debug-session', 'runId': 'post-fix', 'hypothesisId': 'D'}; _log_file = open('/home/d/Schreibtisch/gamex/.cursor/debug.log', 'a'); _log_file.write(_json.dumps(_log_data) + '\n'); _log_file.close()
        # #endregion
        # Re-raise unexpected exceptions to avoid hiding bugs
        raise

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

def _generate_conversation_prompts(item: Dict[str, Any]) -> List[str]:
    """
    Generiert 2-3 Gesprächs-Prompts für ein Item basierend auf Bucket, Flags und Bedingungen.
    Regelbasiert, nicht KI-generiert.
    """
    prompts = []
    bucket = item.get("bucket", item.get("pair_status", "EXPLORE"))
    schema = item.get("schema")
    risk_level = item.get("risk_level", "A")
    flags = item.get("flags", [])
    a = item.get("a", {})
    b = item.get("b", {})
    label = item.get("label", "")
    conditions_a = a.get("conditions", "").strip()
    conditions_b = b.get("conditions", "").strip()
    
    if bucket == "DOABLE NOW":
        prompts.append(f"Beide möchtet ihr '{label}'. Perfekt für den Einstieg!")
        if risk_level == "B":
            prompts.append("Da es mittleres Risiko ist, sprecht kurz über eure Erwartungen vorher.")
        else:
            prompts.append("Redet kurz über eure Erwartungen und genießt es!")
    
    elif bucket == "EXPLORE":
        prompts.append(f"Beide seid ihr interessiert an '{label}', aber es gibt noch Klärungsbedarf.")
        if "low_comfort_high_interest" in flags:
            prompts.append("Ein*e von euch hat hohes Interesse aber niedrigen Komfort - sprecht darüber, wie ihr es sicherer machen könnt.")
        else:
            prompts.append("Sprecht über eure Erwartungen und wie ihr es gemeinsam erkunden könnt.")
        if conditions_a or conditions_b:
            conditions_text = f"{conditions_a} / {conditions_b}".strip(" /")
            prompts.append(f"Bedingungen: {conditions_text}")
    
    elif bucket == "TALK FIRST":
        prompts.append(f"'{label}' erfordert ein ausführliches Gespräch vorher.")
        if risk_level == "C":
            prompts.append("⚠️ HIGH RISK: Plant ausreichend Zeit für Sicherheits-Gespräch und Vorbereitung ein.")
        if conditions_a or conditions_b:
            conditions_text = f"{conditions_a} / {conditions_b}".strip(" /")
            prompts.append(f"Besprecht eure Bedingungen: {conditions_text}")
        else:
            prompts.append("Besprecht genau, unter welchen Bedingungen es für euch beide ok wäre.")
    
    elif bucket == "MISMATCH":
        prompts.append(f"Bei '{label}' gibt es eine Unstimmigkeit - einer möchte es, der/die andere nicht.")
        if "hard_limit_violation" in flags:
            prompts.append("⚠️ WICHTIG: Einer hat ein Hard Limit - respektiert das absolut.")
        prompts.append("Das ist ok! Sprecht darüber, warum es nicht passt, ohne Druck auszuüben.")
    
    # Füge allgemeine Prompts hinzu wenn noch Platz
    if len(prompts) < 2:
        if risk_level == "C":
            prompts.append("Erfordert viel Kommunikation und Sicherheits-Vorbereitung.")
        if schema == "consent_rating":
            prompts.append("Kommuniziert offen über eure Bedürfnisse und Grenzen.")
    
    return prompts[:3]  # Maximal 3 Prompts

def _generate_action_plan(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Filter for DOABLE NOW items of type consent_rating
    matches = [
        it for it in items 
        if it.get("bucket", it.get("pair_status")) == "DOABLE NOW"
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
        "counts": {"DOABLE NOW": 0, "EXPLORE": 0, "TALK FIRST": 0, "MISMATCH": 0},
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
            
            # Klassifiziere in neuen Bucket
            bucket = _classify_bucket(pair_status, schema, a, b, risk)
            row["bucket"] = bucket
            
            row["flags"] = flags
            
            # Generiere Gesprächs-Prompts
            row["conversationPrompts"] = _generate_conversation_prompts(row)

            # Aktualisiere Counts mit neuem Bucket
            if bucket in summary["counts"]:
                summary["counts"][bucket] += 1

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
                        p_status = "MISMATCH"
            
            # Klassifiziere Szenario in Bucket
            scenario_bucket = _classify_bucket(p_status, "scenario", sa if isinstance(sa, dict) else {}, sb if isinstance(sb, dict) else {}, "B")
            
            if scenario_bucket in summary["counts"]:
                summary["counts"][scenario_bucket] += 1
                
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
                "bucket": scenario_bucket,
                "flags": ["scenario"],
                "conversationPrompts": _generate_conversation_prompts({
                    "bucket": scenario_bucket,
                    "schema": "scenario",
                    "risk_level": "B",
                    "flags": ["scenario"],
                    "a": sa,
                    "b": sb,
                    "label": scen.get("title", "")
                })
            })

    # Sort for presentation: mismatches first, then talk first, then explore, then doable now; high risk within groups
    bucket_order = {"MISMATCH": 0, "TALK FIRST": 1, "EXPLORE": 2, "DOABLE NOW": 3}
    items.sort(key=lambda r: (
        bucket_order.get(r.get("bucket", r.get("pair_status", "EXPLORE")), 9),
        0 if r.get("risk_level") == "C" else 1,
        r.get("module_name", ""),
        r.get("question_id", "")
    ))

    action_plan = _generate_action_plan(items)
    
    # Generiere Kategorien-Zusammenfassungen (pro Modul)
    category_summaries = {}
    modules = template.get("modules", [])
    for mod in modules:
        mod_id = mod.get("id", "")
        mod_name = mod.get("name", "")
        mod_items = [it for it in items if it.get("module_id") == mod_id]
        
        bucket_counts = {"DOABLE NOW": 0, "EXPLORE": 0, "TALK FIRST": 0, "MISMATCH": 0}
        for item in mod_items:
            bucket = item.get("bucket", item.get("pair_status", "EXPLORE"))
            if bucket in bucket_counts:
                bucket_counts[bucket] += 1
        
        category_summaries[mod_id] = {
            "name": mod_name,
            "counts": bucket_counts,
            "total": len(mod_items)
        }
    
    # Füge auch Szenarien-Zusammenfassung hinzu
    scenario_items = [it for it in items if it.get("module_id") == "scenarios"]
    if scenario_items:
        scenario_counts = {"DOABLE NOW": 0, "EXPLORE": 0, "TALK FIRST": 0, "MISMATCH": 0}
        for item in scenario_items:
            bucket = item.get("bucket", item.get("pair_status", "EXPLORE"))
            if bucket in scenario_counts:
                scenario_counts[bucket] += 1
        category_summaries["scenarios"] = {
            "name": "Szenarien",
            "counts": scenario_counts,
            "total": len(scenario_items)
        }

    duration = (time.time() - start) * 1000
    log_performance("compare_operation", duration,
                   template_id=template.get("id"),
                   item_count=len(items))
    
    meta = {"template_id": template.get("id"), "template_name": template.get("name"), "template_version": template.get("version")}
    return {
        "meta": meta,
        "summary": summary,
        "items": items,
        "action_plan": action_plan,
        "conversationPrompts": {},  # Für Rückwärtskompatibilität, wird pro Item gespeichert
        "categorySummaries": category_summaries
    }