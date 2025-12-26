from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

QuestionType = Literal[
    "singleChoice",
    "multiChoice",
    "text",
    "number",
    "scale",
    # Backwards-compatible extra type for existing templates
    "consentRating",
]


class QuestionValidation(BaseModel):
    """
    Validation rules (JSON-friendly).

    The templates in this repo historically use `schema` and custom answer shapes.
    We keep those answer shapes for compatibility, but expose a more structured,
    UI-friendly validation model here.
    """

    # Generic numeric bounds (scale/number)
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None

    # Text bounds
    min_length: Optional[int] = Field(default=None, alias="minLength")
    max_length: Optional[int] = Field(default=None, alias="maxLength")

    # Multi-choice bounds
    min_selections: Optional[int] = Field(default=None, alias="minSelections")
    max_selections: Optional[int] = Field(default=None, alias="maxSelections")

    model_config = {
        "populate_by_name": True,
        "extra": "allow",
    }


class Question(BaseModel):
    """
    Wizard question in a structured, UI-friendly shape.

    Required fields per spec:
    - id, title, description/help, type, options, required, validation
    """

    id: str
    title: str
    description: str = ""
    help: str = ""
    help_details: str = Field(default="", alias="helpDetails")

    type: QuestionType
    options: list[str] = Field(default_factory=list)
    required: bool = True
    validation: QuestionValidation = Field(default_factory=QuestionValidation)

    # Compatibility / metadata
    template_schema: str = Field(default="", alias="schema")  # original template schema, used by backend compare
    module_id: str = Field(default="", alias="moduleId")
    module_name: str = Field(default="", alias="moduleName")
    module_description: str = Field(default="", alias="moduleDescription")
    module_emoji: str = Field(default="", alias="moduleEmoji")
    module_context: str = Field(default="", alias="moduleContext")
    raw: dict[str, Any] = Field(default_factory=dict)

    model_config = {
        "populate_by_name": True,
        "extra": "allow",
    }

