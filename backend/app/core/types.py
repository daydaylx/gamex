from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, TypedDict, Union

Person = Literal["A", "B"]
RiskLevel = Literal["A", "B", "C"]
PairStatus = Literal["MATCH", "EXPLORE", "BOUNDARY"]
ConsentStatus = Literal["YES", "MAYBE", "NO", "HARD_LIMIT"]


class TemplateQuestion(TypedDict, total=False):
    id: str
    schema: str
    risk_level: RiskLevel
    label: str
    help: str
    tags: List[str]

    # Schema-specific fields (kept flexible on purpose)
    options: List[str]


class TemplateModule(TypedDict, total=False):
    id: str
    name: str
    questions: List[TemplateQuestion]


class Template(TypedDict, total=False):
    id: str
    name: str
    version: int
    modules: List[TemplateModule]


class ConsentRatingAnswer(TypedDict, total=False):
    status: ConsentStatus
    interest: int
    comfort: int
    conditions: str
    notes: str

    # Variants
    dom_status: ConsentStatus
    dom_interest: int
    dom_comfort: int
    sub_status: ConsentStatus
    sub_interest: int
    sub_comfort: int

    active_status: ConsentStatus
    active_interest: int
    active_comfort: int
    passive_status: ConsentStatus
    passive_interest: int
    passive_comfort: int


class Scale010Answer(TypedDict, total=False):
    value: int


class EnumAnswer(TypedDict, total=False):
    value: str


class MultiAnswer(TypedDict, total=False):
    values: List[str]


class TextAnswer(TypedDict, total=False):
    text: str


Answer = Union[ConsentRatingAnswer, Scale010Answer, EnumAnswer, MultiAnswer, TextAnswer, Dict[str, Any]]
Responses = Dict[str, Answer]


class ScenarioOption(TypedDict, total=False):
    id: str
    label: str
    risk_type: str


class Scenario(TypedDict, total=False):
    id: str
    title: str
    category: str
    description: str
    options: List[ScenarioOption]


class CompareMeta(TypedDict, total=False):
    template_id: str
    template_name: str
    template_version: int


class CompareSummary(TypedDict, total=False):
    counts: Dict[PairStatus, int]
    flags: Dict[str, int]
    generated_at: str


class CompareItem(TypedDict, total=False):
    question_id: str
    module_id: str
    module_name: str
    label: str
    help: str
    schema: str
    risk_level: RiskLevel
    tags: List[str]

    a: Dict[str, Any]
    b: Dict[str, Any]

    pair_status: PairStatus
    flags: List[str]

    # Optional computed fields
    delta_interest: Optional[int]
    delta_comfort: Optional[int]
    delta_value: Optional[int]
    match_value: bool
    intersection: List[str]


class CompareResult(TypedDict, total=False):
    meta: CompareMeta
    summary: CompareSummary
    items: List[CompareItem]
    action_plan: List[CompareItem]

