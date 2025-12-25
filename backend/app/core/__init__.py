"""
Core domain logic (framework-agnostic).

This package intentionally contains pure business rules that can be reused
independently of the FastAPI layer and persistence adapters.
"""

from app.core.compare import (
    compare,
    _flag_low_comfort_high_interest,
    _generate_action_plan,
    _status_pair,
)

__all__ = [
    "compare",
    "_status_pair",
    "_flag_low_comfort_high_interest",
    "_generate_action_plan",
]

