from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

Person = Literal["A", "B"]
YesMaybeNo = Literal["YES", "MAYBE", "NO"]

class TemplateListItem(BaseModel):
    id: str
    name: str
    version: int

class CreateSessionRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    template_id: str
    password: str = Field(min_length=6, max_length=200)
    pin_a: Optional[str] = Field(default=None, max_length=50)
    pin_b: Optional[str] = Field(default=None, max_length=50)

class SessionListItem(BaseModel):
    id: str
    name: str
    template_id: str
    created_at: str
    has_a: bool
    has_b: bool

class SessionInfo(BaseModel):
    id: str
    name: str
    template: Dict[str, Any]
    created_at: str
    has_a: bool
    has_b: bool

class LoadResponsesRequest(BaseModel):
    password: str = Field(min_length=6, max_length=200)
    pin: Optional[str] = Field(default=None, max_length=50)

class SaveResponsesRequest(BaseModel):
    password: str = Field(min_length=6, max_length=200)
    pin: Optional[str] = Field(default=None, max_length=50)
    responses: Dict[str, Any]

class CompareRequest(BaseModel):
    password: str = Field(min_length=6, max_length=200)

class ExportRequest(BaseModel):
    password: str = Field(min_length=6, max_length=200)

class AIAnalyzeRequest(BaseModel):
    password: str = Field(min_length=6, max_length=200)
    provider: Literal["openrouter"] = "openrouter"
    api_key: str = Field(min_length=10, max_length=500)
    model: str = Field(min_length=1, max_length=200)
    base_url: str = Field(default="https://openrouter.ai/api/v1")
    redact_free_text: bool = True
    max_tokens: int = 800

class CompareResult(BaseModel):
    meta: Dict[str, Any]
    summary: Dict[str, Any]
    items: List[Dict[str, Any]]
    action_plan: Optional[List[Dict[str, Any]]] = None

class AIReport(BaseModel):
    id: str
    created_at: str
    provider: str
    model: str
    text: str



