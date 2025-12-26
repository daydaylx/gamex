from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

Person = Literal["A", "B"]
YesMaybeNo = Literal["YES", "MAYBE", "NO"]

# Tag Vocabulary
VALID_TAGS = {
    # Acts
    "kissing", "touching", "oral", "penetration", "anal", "handjob", "fingering", "rimming", "fisting", "sex",
    # Dynamics
    "dominance", "submission", "switch", "control", "lead", "follow", "service", "worship", "humiliation", "degradation", "praise", "discipline",
    # Toys & Gear
    "toys", "vibrator", "plug", "dildo", "strap-on", "rope", "restraint", "bondage", "cuffs", "gag", "blindfold", "hood", "collar", "leash", "gear", "material", "latex", "leather",
    # Risk / Sensation
    "breath", "breathplay", "impact", "spanking", "pain", "sensation", "temperature", "wax", "ice", "edge", "edging", "cnc", "fear", "choking", "blood", "needles",
    # Context / Social
    "public", "voyeur", "exhibition", "group", "threesome", "partner_swap", "soft_swap", "privacy", "digital", "recording",
    # Body
    "feet", "hands", "bodyparts", "fluids", "watersports", "scat", "spit", "cum", "period", "lactation",
    # Logistics / Meta
    "time", "stress", "coping", "aftercare", "safety", "rules", "negotiation", "communication", "boundaries", "review", "planning", "money",
    # Expanded Vocabulary based on existing templates
    "risk", "level2", "level3", "extreme", "prep", "roleplay", "petplay",
    "physical", "needs", "emotional", "temporal", "duration", "drop", "warning_signs", "consent", "override", "importance", "priority", "followup", "recovery", "profile", "dom_drop", "top_care",
    "psychology", "attachment", "foundation", "closeness", "reassurance", "reflection", "anxiety", "rejection", "jealousy", "monogamy", "vulnerability", "intimacy",
    "subspace", "altered_states", "physiology", "symptoms", "trance", "emotion", "preference", "awareness",
    "regulation", "overwhelm", "strategies", "intensity", "signals", "tolerance", "capacity", "reading", "triggers", "processing", "integration",
    "shame", "self_assessment", "origins", "fantasy", "taboo", "post_sex", "context", "kink", "catharsis", "moral", "conflict", "healing", "growth",
    "power", "spectrum", "protocols", "rituals", "lifestyle", "24/7", "TPE", "decision_making", "ethics",
    "repeat", "less", "highlight", "friction", "debrief", "notes",
    "intent", "hard_no", "consent_language", "hard_limits", "soft_limits", "openness", "values",
    "feedback", "dirty_talk", "initiation", "feedback_style", "check_in", "non_verbal", "difficult_topics", "timing",
    "exploration", "novelty", "curiosity", "experimentation", "routine", "research", "bucket_list",
    "immediate", "verbal", "safer_sex", "contraception", "hygiene", "pace", "pain_threshold", "allergies", "stis", "emergency",
    "environment", "noise", "spontaneity", "setting", "cleanliness", "lighting", "sensitivities", "language", "opt_out", "safewords",
    "logistics", "frequency", "roles", "power_exchange", "caregiver", "protocol",
    "sensual", "massage", "give", "receive", "manual", "roughness", "cuddling", "vaginal", "positions", "breasts", "hugging", "hand_holding", "nipple", "clamps",
    "soft", "sensory", "double", "marking", "biting", "light", "denial", "voyeurism", "progression", "intense",
    "activities", "quickie", "long_session", "multiple_orgasm", "exhibitionism", "mutual_masturbation", "phone_sex", "shower", "cuckolding", "orgy",
    "bdsm", "restraints", "punishment", "suspension", "forced_orgasm",
    "body_language", "medical", "satisfaction",
    # Additional tags found in templates
    "emotions", "relationship", "materials", "fetish", "penis", "high-risk", "active", "passive",
    "meta", "level1", "essential", "health", "kink_light", "hard", "ds", "core", "fun", "zones", "touch",
    "wishes", "identity", "genital"
}

def validate_tags(tags: List[str]) -> List[str]:
    """Validates a list of tags against the vocabulary. Returns invalid tags."""
    return [t for t in tags if t not in VALID_TAGS]

class TemplateListItem(BaseModel):
    id: str
    name: str
    version: int

class CreateSessionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=1, max_length=100)
    template_id: str
    password: Optional[str] = Field(
        default=None,
        min_length=12,
        max_length=128,
        description="Master password for encrypted session (optional, but recommended)"
    )

class SessionListItem(BaseModel):
    id: str
    name: str
    template_id: str
    created_at: str
    has_a: bool
    has_b: bool
    encrypted: bool = False

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
    password: Optional[str] = Field(default=None, min_length=1, max_length=128, description="Master password (required for encrypted sessions)")

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

# Encryption / Keychain Models
class InitializeKeychainRequest(BaseModel):
    """Request to initialize keychain with master password"""
    model_config = ConfigDict(extra="ignore")
    password: str = Field(min_length=12, max_length=128, description="Master password (min 12 chars)")

class UnlockKeychainRequest(BaseModel):
    """Request to unlock keychain and verify password"""
    model_config = ConfigDict(extra="ignore")
    password: str = Field(min_length=1, max_length=128)

class ChangePasswordRequest(BaseModel):
    """Request to change master password"""
    model_config = ConfigDict(extra="ignore")
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128, description="New password (min 12 chars)")

# Extended models with encryption support
class CreateSessionRequestEncrypted(BaseModel):
    """Create session with encryption (requires master password)"""
    model_config = ConfigDict(extra="ignore")
    name: str = Field(min_length=1, max_length=100)
    template_id: str
    password: str = Field(min_length=1, max_length=128, description="Master password")

class LoadResponsesRequestEncrypted(BaseModel):
    """Load responses (with password for encrypted sessions)"""
    model_config = ConfigDict(extra="ignore")
    password: Optional[str] = Field(default=None, min_length=1, max_length=128)

class SaveResponsesRequestEncrypted(BaseModel):
    """Save responses with encryption"""
    model_config = ConfigDict(extra="ignore")
    responses: Dict[str, Any]
    password: str = Field(min_length=1, max_length=128, description="Master password")

class CompareRequestEncrypted(BaseModel):
    """Compare responses (with password for encrypted sessions)"""
    model_config = ConfigDict(extra="ignore")
    password: Optional[str] = Field(default=None, min_length=1, max_length=128)





