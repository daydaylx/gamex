from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

Person = Literal["A", "B"]
YesMaybeNo = Literal["YES", "MAYBE", "NO"]

class TemplateListItem(BaseModel):
    id: str
    name: str
    version: int

class CreateSessionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=1, max_length=100)
    template_id: str

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
    model_config = ConfigDict(extra="ignore")

class SaveResponsesRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    responses: Dict[str, Any]

class CompareRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

class ExportRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

class AIAnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider: str = Field(default="openrouter")
    api_key: str = Field(min_length=1, max_length=500)
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

class BackupRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

class RestoreRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    backup: Dict[str, Any]
    new_name: Optional[str] = Field(default=None, max_length=100)





