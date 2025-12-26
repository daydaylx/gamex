# Security Audit Report

**Projekt:** Intimacy Tool (Local-first)
**Datum:** 2025-12-26
**Auditor:** Claude (Automated Analysis)
**Scope:** OWASP Top 10 2021

---

## Executive Summary

**Risiko-Level:** 🔴 **HIGH** (aufgrund fehlender Verschlüsselung)

**Kritische Findings:** 1
**Hohe Findings:** 3
**Mittlere Findings:** 4
**Niedrige Findings:** 2

**Empfehlung:** Verschlüsselung MUSS implementiert werden vor Production-Release.

---

## OWASP Top 10 2021 - Detailed Analysis

### 🔴 A01: Broken Access Control - **HIGH RISK**

**Status:** ⚠️ **TEILWEISE VORHANDEN**

**Findings:**

1. **Keine Authentifizierung** (by design - local-first)
   - Severity: HIGH (für local use case akzeptabel, aber dokumentieren)
   - Impact: Jeder mit Gerätezugriff kann alle Sessions sehen
   - **Empfehlung:** Session-Passwörter implementieren (Phase 2)

2. **Keine Autorisierung zwischen Personen A/B**
   - Severity: MEDIUM
   - Impact: Person A kann theoretisch Antworten von Person B sehen
   - **Empfehlung:** Optional: Separate Locks für A/B

**Code-Review:**
```python
# backend/app/routes.py:123
@api_router.post("/sessions/{session_id}/responses/{person}/load")
def load_responses(session_id: str, person: str, req: LoadResponsesRequest):
    if person not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Invalid person")
    # ✅ Validation vorhanden
    # ❌ Keine Auth-Check
```

**Positive:**
- ✅ Input-Validation für `person` Parameter
- ✅ Session-ID wird validiert

**Negativ:**
- ❌ Keine Rate-Limiting
- ❌ Keine Session-Passwörter

---

### 🟢 A02: Cryptographic Failures - **CRITICAL**

**Status:** 🔴 **KRITISCH - NICHT ERFÜLLT**

**Findings:**

1. **Keine Verschlüsselung at-rest**
   - Severity: CRITICAL
   - Location: `backend/app/storage/sqlite.py:94`
   - Impact: Alle intimen Daten im Klartext in SQLite
   - **Evidence:**
   ```python
   payload = json.dumps(responses, ensure_ascii=False)  # <- PLAINTEXT!
   conn.execute(
       "INSERT INTO responses(...) VALUES (?,?,?,?)",
       (session_id, person, payload, updated_at),
   )
   ```

2. **IndexedDB nicht verschlüsselt**
   - Severity: CRITICAL
   - Location: `apps/web/web/storage/indexeddb.js`
   - Impact: Browser-Storage im Klartext

3. **API-Keys in Requests**
   - Severity: MEDIUM
   - Location: `backend/app/ai.py:84`
   - Evidence:
   ```python
   "Authorization": f"Bearer {api_key}",  # OK für HTTPS, aber...
   ```
   - **Empfehlung:** Nur über HTTPS senden (in Production erzwingen)

**Empfohlene Maßnahmen:**

**SOFORT (Phase 2):**
- [ ] SQLCipher für SQLite-Verschlüsselung
- [ ] Capacitor Secure Storage für Mobile
- [ ] Web Crypto API für IndexedDB-Verschlüsselung

**MITTELFRISTIG:**
- [ ] HTTPS erzwingen in Production
- [ ] Certificate Pinning (Mobile App)

---

### 🟢 A03: Injection - **LOW RISK**

**Status:** ✅ **GUT**

**Findings:**

1. **SQL Injection: PROTECTED ✅**
   - Alle Queries nutzen Parameterized Queries
   - Evidence:
   ```python
   # backend/app/storage/sqlite.py:53
   row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
   # ✅ Korrekt: ? Platzhalter mit Tuple
   ```

2. **Command Injection: NOT APPLICABLE**
   - Kein `subprocess`, `os.system`, `eval`, `exec` gefunden
   - ✅ Sicher

3. **JSON Injection: SAFE**
   - `json.loads()` nutzt Standard-Library
   - Keine `eval()` für JSON-Parsing
   - ✅ Sicher

**Positive:**
- ✅ Konsistente Nutzung von Parameterized Queries
- ✅ Keine dynamische Code-Execution
- ✅ JSON-Parsing mit Standard-Library

**Empfehlung:** Keine Änderungen nötig (sehr gut!)

---

### 🟡 A04: Insecure Design - **MEDIUM RISK**

**Status:** ⚠️ **VERBESSERUNGSBEDARF**

**Findings:**

1. **Fehlende Rate-Limiting**
   - Severity: MEDIUM
   - Impact: Potentielle DoS-Angriffe auf `/api/sessions/{id}/compare`
   - **Empfehlung:** Slowapi oder FastAPI-Limiter nutzen

2. **Keine Input-Size-Limits**
   - Severity: MEDIUM
   - Location: `routes.py:135`
   - Impact: Große Payloads können Server überlasten
   - Evidence:
   ```python
   def save_responses(session_id: str, person: str, req: SaveResponsesRequest):
       if not isinstance(req.responses, dict):
           raise HTTPException(status_code=400, detail="responses must be object/dict")
       # ❌ Keine Size-Limitierung!
   ```

3. **Keine Session-Timeouts**
   - Severity: LOW
   - Impact: Sessions bleiben ewig aktiv
   - **Empfehlung:** Optional: Session-Expiry nach X Tagen

**Empfohlene Maßnahmen:**
```python
# Rate-Limiting (Beispiel)
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.route("/api/sessions/{id}/compare")
@limiter.limit("10/minute")  # Max 10 Vergleiche/Minute
def compare_session(...):
    ...
```

---

### 🟢 A05: Security Misconfiguration - **MEDIUM RISK**

**Status:** ⚠️ **TEILWEISE**

**Findings:**

1. **Keine Security Headers**
   - Severity: MEDIUM
   - Missing:
     - Content-Security-Policy (CSP)
     - X-Frame-Options
     - X-Content-Type-Options
     - Strict-Transport-Security (HSTS)
   - **Empfehlung:** Security-Middleware hinzufügen

2. **CORS nicht konfiguriert**
   - Severity: LOW (local-first, aber...)
   - Location: `backend/app/main.py`
   - **Empfehlung:** Explizite CORS-Policy

3. **Debug-Modus in Production möglich**
   - Severity: LOW
   - **Empfehlung:** Explizit `reload=False` (bereits vorhanden ✅)

**Empfohlene Fixes:**
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000"],  # Nur localhost
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Security Headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

---

### 🟢 A06: Vulnerable Components - **LOW RISK**

**Status:** ✅ **GUT** (wird automatisiert gecheckt)

**Findings:**

1. **Dependencies aktuell**
   - ✅ Dependabot konfiguriert
   - ✅ Safety-Checks in CI
   - Current versions:
     - fastapi==0.115.6 (latest)
     - pydantic==2.10.3 (latest)
     - uvicorn==0.34.0 (latest)

2. **Keine bekannten Vulnerabilities**
   - ✅ Safety-Check wird in CI ausgeführt

**Empfehlung:** Keine Änderungen nötig (sehr gut!)

---

### 🟢 A07: Identification & Authentication Failures - **MEDIUM RISK**

**Status:** ⚠️ **BY DESIGN NICHT VORHANDEN**

**Findings:**

1. **Keine Authentication** (by design - local-first)
   - Severity: MEDIUM (für Use-Case akzeptabel)
   - Impact: Gerätezugriff = Datenzugriff
   - **Mitigation:** Dokumentation + Session-Passwörter (Phase 2)

2. **Keine Password-Policies**
   - N/A (keine Passwörter aktuell)
   - **TODO:** Bei Session-Passwörtern: Min. 8 Zeichen, Komplexität

3. **Keine Brute-Force-Protection**
   - N/A (keine Login-Form)
   - **TODO:** Rate-Limiting wenn Auth hinzugefügt wird

**Empfohlen für Phase 2:**
```python
# Password-Validation (Beispiel)
from pydantic import Field, validator

class SessionPasswordRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)

    @validator('password')
    def validate_password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Must contain uppercase')
        if not any(c.isdigit() for c in v):
            raise ValueError('Must contain digit')
        return v
```

---

### 🟢 A08: Software & Data Integrity Failures - **LOW RISK**

**Status:** ✅ **GUT**

**Findings:**

1. **Keine unsicheren Deserialisierung**
   - ✅ Nur `json.loads()` (sicher)
   - ❌ Kein `pickle.loads()` (gut!)
   - ❌ Kein `yaml.load()` ohne SafeLoader (gut!)

2. **Dependency-Integrity**
   - ✅ Requirements.txt mit exakten Versionen
   - ⚠️ Kein Hash-Pinning
   - **Empfehlung:** `pip-tools` mit `--generate-hashes`

3. **Keine CI/CD Supply-Chain-Attacks**
   - ✅ GitHub Actions mit pinned versions (gut!)

**Empfehlung:**
```bash
# Requirements mit Hashes (optional)
pip-compile --generate-hashes requirements.in
```

---

### 🟡 A09: Security Logging & Monitoring - **MEDIUM RISK**

**Status:** ⚠️ **TEILWEISE**

**Findings:**

1. **Logging vorhanden**
   - ✅ Performance-Logging (`app/logging.py`)
   - Evidence:
   ```python
   log_performance("compare", duration, session_id=session_id)
   ```

2. **Kein Security-Event-Logging**
   - Severity: MEDIUM
   - Missing:
     - Login-Versuche (N/A aktuell)
     - Fehlgeschlagene Validierungen
     - Ungewöhnliche Request-Patterns
   - **Empfehlung:** Audit-Log hinzufügen

3. **Keine sensiblen Daten in Logs ✅**
   - Gut: Keine User-Responses in Logs
   - ✅ Nur Metadaten geloggt

**Empfohlene Ergänzung:**
```python
# backend/app/logging.py
def log_security_event(event_type: str, **kwargs):
    """Log security-relevant events"""
    sanitized = {k: v for k, v in kwargs.items()
                 if k not in ['password', 'api_key', 'responses']}
    logger.warning(f"SECURITY: {event_type}", extra=sanitized)

# Nutzung:
log_security_event("validation_failed",
                   session_id=session_id,
                   error_count=len(errors))
```

---

### 🟢 A10: Server-Side Request Forgery (SSRF) - **LOW RISK**

**Status:** ⚠️ **MINIMAL RISK**

**Findings:**

1. **OpenRouter API-Calls**
   - Severity: LOW
   - Location: `backend/app/ai.py:82`
   - Evidence:
   ```python
   async with httpx.AsyncClient() as client:
       resp = await client.post(base_url, headers=headers, json=payload)
   ```
   - **Risk:** User kann `base_url` manipulieren
   - **Mitigation:** Whitelist erlaubter URLs

**Empfohlene Fix:**
```python
ALLOWED_AI_PROVIDERS = [
    "https://openrouter.ai/api/v1/chat/completions",
]

def validate_ai_url(url: str) -> bool:
    return url in ALLOWED_AI_PROVIDERS

# In ai_analyze():
if not validate_ai_url(req.base_url):
    raise HTTPException(400, "Invalid AI provider URL")
```

---

## Additional Security Concerns

### 1. Frontend XSS Protection

**Status:** ⚠️ **NEEDS REVIEW**

**Findings:**
```javascript
// apps/web/web/app.js (Beispiel)
div.innerHTML = `<div>${escapeHtml(s.name)}</div>`;
// ✅ escapeHtml() wird genutzt - GUT!
```

**Empfehlung:** Code-Review aller `innerHTML`-Nutzungen

### 2. Mobile App Security

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Findings:**
- ❌ Kein SSL-Pinning
- ❌ Kein Root-Detection
- ❌ Kein Jailbreak-Detection
- ❌ Plaintext Storage (IndexedDB)

**Empfohlen:**
```json
// capacitor.config.json
{
  "plugins": {
    "SecureStoragePlugin": {
      "enabled": true
    }
  }
}
```

---

## Priorisierte Empfehlungen

### 🔴 KRITISCH (sofort)
1. **Verschlüsselung implementieren** (SQLite + IndexedDB)
   - Aufwand: 12-16h
   - Impact: KRITISCH
   - Status: TODO Phase 2

2. **HTTPS in Production erzwingen**
   - Aufwand: 2h
   - Impact: HOCH
   - Status: TODO Phase 5

### 🟠 HOCH (nächste 2 Wochen)
3. **Security Headers hinzufügen**
   - Aufwand: 1h
   - Impact: MITTEL
   - Status: TODO (jetzt)

4. **Rate-Limiting implementieren**
   - Aufwand: 2-3h
   - Impact: MITTEL
   - Status: TODO

5. **AI-Provider URL-Whitelist**
   - Aufwand: 0.5h
   - Impact: NIEDRIG-MITTEL
   - Status: TODO (jetzt)

### 🟡 MITTEL (nächste 4 Wochen)
6. **Security-Event-Logging**
   - Aufwand: 3-4h
   - Impact: MITTEL

7. **Input-Size-Limits**
   - Aufwand: 1h
   - Impact: NIEDRIG-MITTEL

### 🟢 NIEDRIG (später)
8. **Dependency-Hash-Pinning**
   - Aufwand: 1h
   - Impact: NIEDRIG

9. **Session-Expiry**
   - Aufwand: 2h
   - Impact: NIEDRIG

---

## Compliance Notes

### DSGVO (GDPR)

**Kritische Punkte:**
- 🔴 **Art. 32 (Datensicherheit):** Verschlüsselung FEHLT
- 🟡 **Art. 17 (Löschung):** Backup/Restore ohne Lösch-Funktion
- 🟢 **Art. 25 (Privacy by Design):** Local-first ist gut

**Empfehlung:** Verschlüsselung MUSS implementiert werden für DSGVO-Konformität.

---

## Risk Score

| Kategorie | Score | Gewichtung | Total |
|-----------|-------|------------|-------|
| Access Control | 6/10 | 20% | 1.2 |
| Cryptography | 2/10 | 30% | 0.6 |
| Injection | 9/10 | 20% | 1.8 |
| Configuration | 6/10 | 15% | 0.9 |
| Monitoring | 5/10 | 10% | 0.5 |
| Other | 7/10 | 5% | 0.35 |

**Gesamt-Score:** **5.35/10** (MEDIUM-HIGH RISK)

**Nach Verschlüsselung (geschätzt):** **7.5/10** (MEDIUM-LOW RISK)

---

## Nächste Schritte

1. **Sofort:** Security Headers + AI URL Whitelist (30min)
2. **Diese Woche:** Encryption Design finalisieren
3. **Nächste Woche:** SQLCipher implementieren
4. **Woche 3-4:** Mobile Secure Storage
5. **Woche 5:** Re-Audit

---

**Audit abgeschlossen:** 2025-12-26
**Nächstes Audit:** Nach Phase 2 (Encryption)
