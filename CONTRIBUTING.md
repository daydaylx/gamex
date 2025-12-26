# Contributing to Intimacy Tool

Vielen Dank für dein Interesse am Projekt! 🎉

## Quick Start

### Backend Setup

```bash
cd backend

# Virtual Environment erstellen
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Dependencies installieren
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Tests ausführen
pytest

# Server starten
python -m app
```

### Frontend (aktuell)

```bash
# Server starten (dient auch das Frontend)
cd backend
python -m app

# Browser öffnen: http://127.0.0.1:8000
```

### Mobile App (Android)

Siehe detaillierte Anleitung: [docs/APK_BUILD_GUIDE.md](docs/APK_BUILD_GUIDE.md)

---

## Development Workflow

### 1. Branch erstellen

```bash
git checkout -b feature/dein-feature-name
# oder
git checkout -b fix/bug-beschreibung
```

### 2. Code schreiben

**Code Style:**
- **Python:** PEP 8 (max 120 Zeichen/Zeile)
- **JavaScript:** Konsistent mit bestehendem Code
- **Commits:** Aussagekräftige Messages (siehe unten)

**Tools:**
```bash
# Python Code formatieren
cd backend
black app/ tests/
isort app/ tests/

# Linting
flake8 app/ tests/

# Type Checking
mypy app/
```

### 3. Tests schreiben

**Backend:**
```bash
cd backend
pytest                          # Alle Tests
pytest tests/test_routes.py     # Einzelne Datei
pytest -k test_compare          # Tests mit Name
pytest --cov=app                # Mit Coverage
```

**Test-Struktur:**
```python
def test_feature_name():
    # Given (Vorbedingungen)
    ...

    # When (Aktion)
    ...

    # Then (Erwartung)
    assert ...
```

**Coverage-Anforderung:** 60% (wird in CI geprüft)

### 4. Commit Guidelines

Wir nutzen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Neues Feature
- `fix`: Bugfix
- `docs`: Dokumentation
- `refactor`: Code-Refactoring (keine Feature-Änderung)
- `test`: Tests hinzufügen/ändern
- `chore`: Build-Prozess, Dependencies, etc.
- `perf`: Performance-Verbesserung
- `ci`: CI/CD Änderungen

**Beispiele:**
```bash
git commit -m "feat(compare): add conversation prompts generation"
git commit -m "fix(validation): handle missing conditions correctly"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(routes): add tests for backup endpoint"
```

### 5. Pull Request erstellen

```bash
git push origin feature/dein-feature-name
```

Dann auf GitHub einen PR erstellen mit:
- **Beschreibung:** Was ändert der PR?
- **Motivation:** Warum ist die Änderung nötig?
- **Testing:** Wie wurde getestet?
- **Screenshots:** Bei UI-Änderungen

**PR-Checklist:**
- [ ] Tests geschrieben und passing
- [ ] Code formatiert (black, isort)
- [ ] Linting passing (flake8)
- [ ] Dokumentation aktualisiert (falls nötig)
- [ ] CHANGELOG aktualisiert (bei größeren Features)

---

## Code-Organisation

### Backend (`backend/app/`)

```
app/
├── core/               # Domain-Logik (keine IO!)
│   ├── compare.py      # Vergleichsalgorithmus
│   ├── validation.py   # Validierung
│   └── types.py        # Typen
├── storage/            # Persistenz-Layer
│   └── sqlite.py       # SQLite-Adapter
├── templates/          # Template-System
│   ├── loader.py       # Template-Loader
│   └── normalize.py    # Normalisierung
├── main.py             # FastAPI App
├── routes.py           # API-Routen
├── models.py           # Pydantic Models
└── db.py               # Datenbank-Setup
```

**Wichtig:**
- `core/` enthält **keine** FastAPI-Imports (testbar ohne Framework)
- `storage/` abstrahiert Datenbank (potentiell austauschbar)
- `routes.py` ist dünn (nur HTTP-Handling)

### Frontend (`apps/web/web/`)

```
web/
├── app.js              # Haupt-App (WIRD REFACTORED!)
├── core/
│   ├── compare.js      # Vergleichslogik (Duplikat von Backend)
│   └── validation.js   # Validierung
├── storage/
│   └── indexeddb.js    # Offline-Storage
└── templates/
    ├── normalize.js    # Template-Normalisierung
    └── dependencies.js # Template-Sichtbarkeit
```

**TODO:** Wird in Phase 3 modularisiert (siehe IMPLEMENTIERUNGSPLAN.md)

---

## Testing-Strategie

### Backend Tests

**Unit Tests:**
```python
# tests/test_core_compare.py
def test_compare_consent_rating_match():
    template = {...}
    resp_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 3}}
    resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}

    result = compare(template, resp_a, resp_b)

    assert result["items"][0]["pair_status"] == "MATCH"
```

**Integration Tests:**
```python
# tests/test_routes.py
def test_create_session_and_save_responses(client):
    # Session erstellen
    resp = client.post("/api/sessions", json={"name": "Test", "template_id": "unified_v1"})
    session_id = resp.json()["id"]

    # Antworten speichern
    resp = client.post(f"/api/sessions/{session_id}/responses/A/save",
                      json={"responses": {...}})
    assert resp.status_code == 200
```

**Test-Fixtures:**
```python
# tests/conftest.py
@pytest.fixture
def client():
    # FastAPI TestClient
    return TestClient(app)

@pytest.fixture
def sample_template():
    return load_template("unified_v1")
```

---

## Security Guidelines

**WICHTIG:** Dieses Tool verarbeitet **sensible Daten**.

### Do's:
- ✅ Validiere **alle** User-Inputs (Backend + Frontend)
- ✅ Nutze Parameterized Queries (bereits der Fall)
- ✅ Rate-Limiting für API-Endpoints (TODO)
- ✅ Sanitize Output (XSS-Prävention)
- ✅ HTTPS in Production (TODO: Docker-Setup)

### Don'ts:
- ❌ **NIEMALS** User-Input direkt in SQL interpolieren
- ❌ **NIEMALS** Secrets in Git committen
- ❌ **NIEMALS** sensible Daten in Logs ausgeben
- ❌ **NIEMALS** unverschlüsselte Daten über Netzwerk senden (außer localhost)

**Geplant (Phase 2):**
- Verschlüsselung der SQLite-DB (SQLCipher)
- Secure Storage für Mobile App
- Encryption-at-rest für IndexedDB

---

## Dokumentation schreiben

### Code-Dokumentation

**Python:**
```python
def compare(template: Dict[str, Any], resp_a: Dict[str, Any], resp_b: Dict[str, Any]) -> Dict[str, Any]:
    """
    Vergleicht zwei Antwort-Sets basierend auf einem Template.

    Args:
        template: Template-Definition mit Modulen und Fragen
        resp_a: Antworten von Person A (question_id -> answer)
        resp_b: Antworten von Person B (question_id -> answer)

    Returns:
        Vergleichs-Resultat mit:
        - meta: Template-Metadaten
        - summary: Counts & Flags
        - items: Liste aller Fragen mit Paar-Status
        - action_plan: Top 3 empfohlene Aktivitäten

    Raises:
        KeyError: Wenn Template nicht gefunden
    """
    ...
```

**JavaScript:**
```javascript
/**
 * Normalisiert eine Antwort für Rückwärtskompatibilität
 * @param {Object} answer - Rohe Antwort von User
 * @returns {Object} Normalisierte Antwort mit Defaults
 */
function normalizeAnswer(answer) {
  ...
}
```

### User-Dokumentation

Für User-facing Features:
- Update `README.md` (Features-Liste)
- Ggf. neue Datei in `docs/` erstellen
- Screenshots bei UI-Änderungen

---

## Getting Help

- **Bug gefunden?** [GitHub Issue](https://github.com/daydaylx/gamex/issues) erstellen
- **Frage?** Issue mit Label `question` erstellen
- **Feature-Idee?** Issue mit Label `enhancement` erstellen

---

## Lizenz

Durch Beiträge akzeptierst du, dass dein Code unter der Projekt-Lizenz veröffentlicht wird.

---

**Danke fürs Beitragen! 🚀**
