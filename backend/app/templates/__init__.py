"""
Templates module (content + migration/normalization glue).

The JSON files in this directory remain the source of truth for built-in templates.
Code in this package provides:
- loading templates from the DB/store
- normalization and lightweight validation so core logic can rely on a stable shape
"""

from app.templates.loader import load_template
from app.templates.normalize import normalize_template

__all__ = ["load_template", "normalize_template"]

