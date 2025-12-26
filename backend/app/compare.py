from __future__ import annotations

import json
import time
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.logging import log_performance
from app.core.compare import (
    compare as _core_compare,
    _flag_low_comfort_high_interest,
    _generate_action_plan,
    _status_pair,
)

def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()

def compare(template: Dict[str, Any], resp_a: Dict[str, Any], resp_b: Dict[str, Any]) -> Dict[str, Any]:
    start = time.time()
    # Note: scenarios loading kept for potential future use
    # scenarios = _load_scenarios()
    result = _core_compare(template, resp_a, resp_b)
    duration = (time.time() - start) * 1000
    log_performance("compare_operation", duration,
                   template_id=template.get("id"),
                   item_count=len(result.get("items", [])))
    return result


__all__ = [
    "compare",
    "_status_pair",
    "_flag_low_comfort_high_interest",
    "_generate_action_plan",
]