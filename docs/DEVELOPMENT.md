# Entwickler-Dokumentation

Diese Dokumentation richtet sich an Entwickler, die am Intimacy Questionnaire Tool arbeiten möchten.

## Projektstruktur

```
gamex/
├── app/                    # Python Backend (FastAPI)
│   ├── __init__.py
│   ├── __main__.py         # Entry point
│   ├── main.py             # FastAPI App Setup
│   ├── db.py               # SQLite Datenbank
│   ├── models.py           # Pydantic Models
│   ├── routes.py           # API Endpunkte
│   ├── crypto.py           # Verschlüsselung
│   ├── compare.py          # Vergleichslogik
│   ├── ai.py               # KI-Analyse (OpenRouter)
│   ├── backup.py           # Backup/Restore
│   ├── logging.py          # Logging
│   ├── template_store.py   # Template-Verwaltung
│   └── templates/          # JSON Templates (Hauptquelle)
│       ├── default_template.json
│       ├── comprehensive_v1.json
│       ├── psycho_enhanced_v3.json
│       ├── unified_template.json
│       └── scenarios.json
├── web/                    # Frontend (Vanilla JS)
│   ├── index.html
│   ├── app.js              # Haupt-Logik
│   ├── styles.css
│   ├── validation.js
│   ├── local-api.js        # Capacitor API Bridge (Offline-Fall)
│   └── data/               # Statische Daten (für Offline-Fall)
│       ├── templates.json  # Template-Index
│       └── templates/       # Template-Duplikate (sollten mit app/templates/ synchronisiert sein)
├── tests/                  # Unit Tests
│   ├── test_routes.py
│   ├── test_compare.py
│   ├── test_crypto.py
│   ├── test_db.py
│   └── ...
├── android/                # Capacitor Android Projekt
├── docs/                   # Dokumentation
├── requirements.txt        # Python Dependencies
├── package.json           # Node.js Dependencies
└── capacitor.config.json   # Capacitor Konfiguration
```

## Setup

### Voraussetzungen

- **Python 3.10+**
- **Node.js 18+** (für Android Build)
- **SQLite 3** (meist vorinstalliert)

### Entwicklungsumgebung einrichten

```bash
# 1. Repository klonen
git clone <repository-url>
cd gamex

# 2. Python Virtual Environment
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# oder: .venv\Scripts\activate  # Windows

# 3. Python Dependencies installieren
pip install -r requirements.txt

# 4. Node.js Dependencies (für Android)
npm install

# 5. Server starten
python -m app
```

Die App läuft dann auf: http://127.0.0.1:8000

### Umgebungsvariablen

Optional können folgende Umgebungsvariablen gesetzt werden:

```bash
export INTIMACY_TOOL_HOST=127.0.0.1  # Default: 127.0.0.1
export INTIMACY_TOOL_PORT=8000        # Default: 8000
```

## API-Dokumentation

Die API ist REST-basiert und verwendet JSON für Request/Response Bodies.

### Base URL

- Lokal: `http://127.0.0.1:8000/api`
- Android: `http://10.0.2.2:8000/api` (Android Emulator)
- Android: `http://<lokale-ip>:8000/api` (Physisches Gerät)

### Endpunkte

#### Health Check
```
GET /api/health
```
Prüft ob der Server läuft.

#### Templates

```
GET /api/templates
```
Listet alle verfügbaren Templates.

```
GET /api/templates/{template_id}
```
Lädt ein spezifisches Template.

#### Sessions

```
GET /api/sessions
```
Listet alle Sessions.

```
POST /api/sessions
Body: {
  "name": "Session Name",
  "template_id": "default_v2",
  "password": "session-password",
  "pin_a": "optional-pin-a",
  "pin_b": "optional-pin-b"
}
```
Erstellt eine neue Session.

```
GET /api/sessions/{session_id}
```
Lädt Session-Informationen.

#### Antworten

```
POST /api/sessions/{session_id}/responses/{person}/load
Body: {
  "password": "session-password",
  "pin": "optional-pin"
}
```
Lädt Antworten für Person A oder B.

```
POST /api/sessions/{session_id}/responses/{person}/save
Body: {
  "password": "session-password",
  "pin": "optional-pin",
  "responses": { ... }
}
```
Speichert Antworten für Person A oder B (verschlüsselt).

#### Vergleich

```
POST /api/sessions/{session_id}/compare
Body: {
  "password": "session-password"
}
```
Erzeugt Vergleichs-Report (Matches, Explore, Boundaries, Risk Flags).

#### Export

```
POST /api/sessions/{session_id}/export/json
Body: {
  "password": "session-password"
}
```
Exportiert Session als JSON.

```
POST /api/sessions/{session_id}/export/markdown
Body: {
  "password": "session-password"
}
```
Exportiert Session als Markdown.

#### Szenarien

```
GET /api/scenarios
```
Lädt alle Szenarien-Karten.

#### KI-Analyse (Optional)

```
POST /api/sessions/{session_id}/ai/analyze
Body: {
  "password": "session-password",
  "provider": "openrouter",
  "api_key": "your-api-key",
  "model": "anthropic/claude-3.5-sonnet",
  "base_url": "https://openrouter.ai/api/v1",
  "redact_free_text": true,
  "max_tokens": 800
}
```
Erstellt KI-Analyse (opt-in, sendet Daten an Provider).

```
POST /api/sessions/{session_id}/ai/list
Body: {
  "password": "session-password"
}
```
Listet alle KI-Reports für eine Session.

#### Backup & Restore

```
POST /api/sessions/{session_id}/backup
Body: {
  "password": "session-password"
}
```
Erstellt verschlüsseltes Backup.

```
POST /api/sessions/restore
Body: {
  "encrypted_data": "...",
  "salt": "...",
  "password": "session-password",
  "new_name": "Optional New Name"
}
```
Stellt Backup wieder her.

### Fehlerbehandlung

Die API verwendet HTTP Status Codes:
- `200 OK` - Erfolg
- `400 Bad Request` - Ungültige Request-Daten
- `401 Unauthorized` - Falsches Passwort/PIN
- `404 Not Found` - Session/Template nicht gefunden
- `500 Internal Server Error` - Server-Fehler

Fehler-Response Format:
```json
{
  "detail": "Fehlermeldung"
}
```

## Testing

### Tests ausführen

```bash
# Alle Tests
pytest

# Mit Coverage Report
pytest --cov=app --cov-report=html

# Spezifische Test-Datei
pytest tests/test_routes.py

# Mit Verbose Output
pytest -v
```

### Test-Struktur

Tests befinden sich in `tests/`:
- `test_routes.py` - API Endpunkt Tests
- `test_compare.py` - Vergleichslogik Tests
- `test_crypto.py` - Verschlüsselung Tests
- `test_db.py` - Datenbank Tests
- `test_ai.py` - KI-Analyse Tests
- `test_backup.py` - Backup/Restore Tests
- `test_template_store.py` - Template-Verwaltung Tests
- `test_validation_extended.py` - Erweiterte Validierung Tests

### Test Coverage

Coverage Reports werden generiert in:
- Terminal: `pytest --cov=app`
- HTML: `htmlcov/index.html`
- XML: `coverage.xml`

## Build-Prozess

### Web-Version

Die Web-Version benötigt keinen Build-Prozess. Einfach:
```bash
python -m app
```

### Android APK

Siehe detaillierte Anleitung: [APK_BUILD_GUIDE.md](../APK_BUILD_GUIDE.md)

**Kurzfassung:**
```bash
# 1. Web-Dateien syncen
npx cap sync android

# 2. Android Studio öffnen
npx cap open android

# 3. In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

Oder via CLI:
```bash
cd android
./gradlew assembleRelease
```

## Datenbank

### Schema

Die SQLite Datenbank (`intimacy_tool.sqlite3`) enthält folgende Tabellen:

- `sessions` - Session-Metadaten
- `responses` - Verschlüsselte Antworten (pro Person)
- `templates` - Template-Definitionen
- `ai_reports` - KI-Analyse-Reports
- `backups` - Backup-Metadaten

### Migrationen

Aktuell gibt es keine automatischen Migrationen. Bei Schema-Änderungen:
1. Datenbank-Backup erstellen
2. Schema manuell anpassen (in `app/db.py`)
3. Bei Bedarf Migrations-Script schreiben

## Verschlüsselung

- **Algorithmus:** AES-256-GCM
- **Key Derivation:** PBKDF2-HMAC-SHA256 (100,000 Iterationen)
- **Salt:** Zufällig pro Session (16 Bytes)
- **Nonce:** Zufällig pro Verschlüsselung (12 Bytes)

Siehe `app/crypto.py` für Details.

## Versionierung

Das Projekt verwendet unterschiedliche Versionsnummern für verschiedene Komponenten:

- **App-Version:** `package.json` und `capacitor.config.json` (aktuell: `1.0.0`)
  - Wird bei App-Releases erhöht
  - Folgt Semantic Versioning (MAJOR.MINOR.PATCH)

- **Template-Versionen:** Jedes Template hat seine eigene Versionsnummer
  - `default_template.json`: v2
  - `comprehensive_v1.json`: v1
  - `psycho_enhanced_v3.json`: v3
  - `unified_template.json`: v2
  - Template-Versionen sind unabhängig von der App-Version

**Hinweis:** App-Version und Template-Versionen sind bewusst getrennt, da Templates unabhängig weiterentwickelt werden können.

## Logging

Logs werden geschrieben in `logs/`:
- `api.log` - API-Aufrufe
- `error.log` - Fehler
- `interactions.log` - Nutzer-Interaktionen
- `performance.log` - Performance-Metriken
- `combined.log` - Alle Logs kombiniert

Logging-Konfiguration: `app/logging.py`

## Code-Stil

- **Python:** PEP 8 (mit Black-ähnlichem Stil)
- **JavaScript:** ES6+, keine Framework-Abhängigkeiten
- **Type Hints:** Python Type Hints werden verwendet wo möglich

## Häufige Aufgaben

### Neues Template hinzufügen

1. JSON-Datei in `app/templates/` erstellen
2. Template in `app/template_store.py` registrieren
3. `ensure_*_template()` Funktion hinzufügen
4. In `app/main.py` aufrufen
5. **Wichtig:** Für Offline-Support auch nach `web/data/templates/` kopieren und in `web/data/templates.json` eintragen

### Templates synchronisieren (Offline-Fall)

Die Templates in `web/data/templates/` werden für den Offline-Fall benötigt (wenn kein Backend erreichbar ist). Diese sollten mit `app/templates/` synchronisiert werden:

```bash
# Templates nach web/data/ kopieren
cp app/templates/default_template.json web/data/templates/
cp app/templates/comprehensive_v1.json web/data/templates/
cp app/templates/psycho_enhanced_v3.json web/data/templates/

# templates.json Index aktualisieren falls nötig
```

### Neuen API-Endpunkt hinzufügen

1. Route in `app/routes.py` definieren
2. Pydantic Model in `app/models.py` (falls nötig)
3. Test in `tests/test_routes.py` schreiben
4. Frontend-Integration in `web/app.js`

### Frontend-Änderungen

- Haupt-Logik: `web/app.js`
- Styling: `web/styles.css`
- HTML: `web/index.html`

## Troubleshooting

### Backend startet nicht

```bash
# Port bereits belegt?
lsof -i :8000  # Linux/macOS
netstat -ano | findstr :8000  # Windows

# Dependencies installiert?
pip install -r requirements.txt
```

### Datenbank-Fehler

```bash
# Datenbank neu initialisieren (ACHTUNG: Löscht alle Daten!)
rm intimacy_tool.sqlite3
python -m app
```

### Android Build-Fehler

```bash
# Gradle Cache löschen
cd android
./gradlew clean

# Capacitor neu syncen
npx cap sync android
```

## Weitere Ressourcen

- [README.md](../README.md) - Benutzer-Dokumentation
- [APK_BUILD_GUIDE.md](../APK_BUILD_GUIDE.md) - Android Build Anleitung
- [ANALYSE_UND_VERBESSERUNGSPLAN.md](../ANALYSE_UND_VERBESSERUNGSPLAN.md) - Geplante Verbesserungen

