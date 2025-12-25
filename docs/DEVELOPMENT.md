# Entwickler-Dokumentation

Diese Dokumentation richtet sich an Entwickler, die am Intimacy Questionnaire Tool arbeiten möchten.

## Projektstruktur

```
gamex/
├── backend/                # Python Backend (FastAPI)
│   ├── app/                # Python package (Entry: python3 -m app)
│   │   ├── core/           # Domain-Logik (vergleich/Report; framework-agnostisch)
│   │   ├── templates/       # Template Loader + Normalisierung (Migration-Glue)
│   │   ├── storage/         # Persistenz-Adapter (SQLite Provider)
│   ├── tests/              # Pytest suite
│   ├── requirements.txt    # Python Dependencies
│   └── pytest.ini
├── apps/
│   ├── web/                # Frontend (Vanilla JS, statisch)
│   │   └── web/
│   │       ├── index.html
│   │       ├── app.js
│   │       ├── styles.css
│   │       ├── validation.js
│   │       ├── local-api.js  # Offline-Modus (IndexedDB, Plaintext)
│   │       ├── core/         # Domain-Logik (Compare) für Offline
│   │       ├── templates/     # Normalisierung + Dependency-Auswertung
│   │       ├── storage/       # IndexedDB Adapter (Offline Persistenz)
│   │       └── data/
│   └── mobile/             # Capacitor Wrapper (Android)
│       ├── package.json
│       └── capacitor.config.json
├── docs/                   # Dokumentation
└── ...
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

# 2. Python Virtual Environment (Backend)
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# oder: .venv\Scripts\activate  # Windows

# 3. Python Dependencies installieren
pip install -r requirements.txt

# 4. Node.js Dependencies (für Android)
cd ../apps/mobile
npm install
cd ../..

# 5. Server starten
cd backend
python3 -m app
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
  "template_id": "default_v2"
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
Body: {}
```
Lädt Antworten für Person A oder B.

```
POST /api/sessions/{session_id}/responses/{person}/save
Body: {
  "responses": { ... }
}
```
Speichert Antworten für Person A oder B (Plaintext).

#### Vergleich

```
POST /api/sessions/{session_id}/compare
Body: {}
```
Erzeugt Vergleichs-Report (Matches, Explore, Boundaries, Risk Flags).

#### Export

```
POST /api/sessions/{session_id}/export/json
Body: {}
```
Exportiert Session als JSON.

```
POST /api/sessions/{session_id}/export/markdown
Body: {}
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
Body: {}
```
Listet alle KI-Reports für eine Session.

#### Backup & Restore

```
POST /api/sessions/{session_id}/backup
Body: {}
```
Erstellt ein Plaintext-Backup.

```
POST /api/sessions/restore
Body: {
  "backup": { ... },
  "new_name": "Optional New Name"
}
```
Stellt Backup wieder her (Plaintext).

### Fehlerbehandlung

Die API verwendet HTTP Status Codes:
- `200 OK` - Erfolg
- `400 Bad Request` - Ungültige Request-Daten
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
pytest tests/test_routes.py  # aus dem backend/ Verzeichnis

# Mit Verbose Output
pytest -v
```

### Test-Struktur

Tests befinden sich in `backend/tests/`:
- `test_routes.py` - API Endpunkt Tests
- `test_compare.py` - Vergleichslogik Tests
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
cd backend
python3 -m app
```

### Android APK

Siehe detaillierte Anleitung: [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)

**Kurzfassung:**
```bash
# 1. Web-Dateien syncen
cd apps/mobile
npx cap sync android

# 2. Android Studio öffnen
npx cap open android

# 3. In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

Oder via CLI:
```bash
cd apps/mobile/android
./gradlew assembleRelease
```

## Datenbank

### Schema

Die SQLite Datenbank (Default: `~/.local/share/intimacy-tool/intimacy_tool.sqlite3`, override via `INTIMACY_TOOL_DB`) enthält folgende Tabellen:

- `sessions` - Session-Metadaten
- `responses` - Antworten (pro Person, Plaintext JSON)
- `templates` - Template-Definitionen
- `ai_reports` - KI-Analyse-Reports (Plaintext JSON)

### Migrationen

Aktuell gibt es keine automatischen Migrationen. Bei Schema-Änderungen:
1. Datenbank-Backup erstellen
2. Schema manuell anpassen (in `backend/app/db.py`)
3. Bei Bedarf Migrations-Script schreiben

## Sicherheitshinweis

Die Anwendung speichert Daten **lokal im Klartext**. Wer Zugriff auf Gerät/Profil/Dateisystem hat, hat potenziell Zugriff auf die Daten.

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

Logging-Konfiguration: `backend/app/logging.py`

## Code-Stil

- **Python:** PEP 8 (mit Black-ähnlichem Stil)
- **JavaScript:** ES6+, keine Framework-Abhängigkeiten
- **Type Hints:** Python Type Hints werden verwendet wo möglich

## Häufige Aufgaben

### Neues Template hinzufügen

1. **Template-Datei**: JSON in `backend/app/templates/` erstellen/ablegen
2. **Backend-Registrierung**: in `backend/app/template_store.py` per `ensure_*_template()` sicherstellen, dass es in die DB geladen wird (und in `backend/app/main.py` aufrufen)
3. **Normalisierung/Migration** (falls nötig): in `backend/app/templates/normalize.py` (Backend) und `apps/web/web/templates/normalize.js` (Offline) über Defaults/Mapping abwärtskompatibel halten
4. **Offline-Support**: Template-Datei nach `apps/web/web/data/templates/` kopieren und `apps/web/web/data/templates.json` aktualisieren

### Templates synchronisieren (Offline-Fall)

Die Templates in `apps/web/web/data/templates/` werden für den Offline-Fall benötigt (wenn kein Backend erreichbar ist). Diese sollten mit `backend/app/templates/` synchronisiert werden:

```bash
# Templates nach apps/web/web/data/ kopieren
cp backend/app/templates/default_template.json apps/web/web/data/templates/
cp backend/app/templates/comprehensive_v1.json apps/web/web/data/templates/
cp backend/app/templates/psycho_enhanced_v3.json apps/web/web/data/templates/

# templates.json Index aktualisieren falls nötig
```

### Neuen API-Endpunkt hinzufügen

1. Route in `backend/app/routes.py` definieren
2. Pydantic Model in `backend/app/models.py` (falls nötig)
3. Test in `backend/tests/test_routes.py` schreiben
4. Frontend-Integration in `apps/web/web/app.js`

### Frontend-Änderungen

- Haupt-Logik: `apps/web/web/app.js`
- Compare Domain-Logik (Offline): `apps/web/web/core/compare.js`
- Template Normalisierung/Visibility-Regeln: `apps/web/web/templates/normalize.js` und `apps/web/web/templates/dependencies.js`
- IndexedDB Adapter (Offline Persistenz): `apps/web/web/storage/indexeddb.js`
- Styling: `apps/web/web/styles.css`
- HTML: `apps/web/web/index.html`

### Wo ändere ich was? (Kurz)

- **Matching/Vergleichslogik**: `backend/app/core/compare.py` (Server) und `apps/web/web/core/compare.js` (Offline)
- **Template-Defaults/Migration**: `backend/app/templates/normalize.py` (Server) und `apps/web/web/templates/normalize.js` (Offline)
- **Persistenz**: `backend/app/storage/sqlite.py` (SQLite) und `apps/web/web/storage/indexeddb.js` (IndexedDB)

## Troubleshooting

### Backend startet nicht

```bash
# Port bereits belegt?
lsof -i :8000  # Linux/macOS
netstat -ano | findstr :8000  # Windows

# Dependencies installiert?
cd backend && pip install -r requirements.txt
```

### Datenbank-Fehler

```bash
# Datenbank neu initialisieren (ACHTUNG: Löscht alle Daten!)
rm -f ~/.local/share/intimacy-tool/intimacy_tool.sqlite3
cd backend && python3 -m app
```

### Android Build-Fehler

```bash
# Gradle Cache löschen
cd apps/mobile/android
./gradlew clean

# Capacitor neu syncen
npx cap sync android
```

## Weitere Ressourcen

- [README.md](../README.md) - Benutzer-Dokumentation
- [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md) - Android Build Anleitung
- [ANALYSE_UND_VERBESSERUNGSPLAN.md](../ANALYSE_UND_VERBESSERUNGSPLAN.md) - Geplante Verbesserungen

