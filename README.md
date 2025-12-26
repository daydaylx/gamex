# Intimacy Tool (Local-first)

Dieses Tool hilft zwei Personen (A/B), getrennt einen Fragebogen auszufüllen, die Antworten zu vergleichen und einen Report zu erzeugen (Matches / Explore / Grenzen / Risiko-Flags). **Local-first** bedeutet: Daten bleiben auf deinem Gerät (SQLite bzw. IndexedDB) – ohne Login/Cloud.

## Wichtige Prinzipien

- **"NEIN" ist final**: Kein Diskutieren/Überreden.
- **"VIELLEICHT" gilt nur unter Bedingungen**.
- **Fantasie ≠ Wunsch ≠ Identität**.

## Features (aktueller Stand)

- **Sessions (A/B getrennt)**: zwei getrennte Antwort-Sets pro Session.
- **Vergleich/Report**: automatische Kategorisierung (z.B. *DOABLE NOW / EXPLORE / TALK FIRST / MISMATCH*) + Flags.
- **Validierung & Auto-Save**: Antworten werden geprüft; Auto-Save pausiert bei Validierungsfehlern.
- **Szenarien-Modus**: interaktive Szenarien-Karten (4 Optionen A/B/C/D).
- **Export (Server-Modus)**: JSON und Markdown Export der Session.
- **Backup & Restore (Server-Modus)**: Plaintext-Backups per API erstellen/wiederherstellen.
- **Optionale KI-Analyse (Server-Modus)**: OpenRouter-Integration (opt-in, mit Redaction-Option).
- **Offline/Local-API Modus**: speichert Sessions in IndexedDB (z.B. für Android/WebView).
- **Android App**: Capacitor Wrapper (siehe [APK Build Guide](docs/APK_BUILD_GUIDE.md)).

## Verfügbare Templates (IDs)

Die App zeigt Templates aus dem Backend bzw. (im Offline-Modus) aus `apps/web/web/data/templates.json`.

- **`unified_v1`**: Default-Template (Datei: `backend/app/templates/default_template.json`; intern kann die JSON-`id` historisch abweichen)
- **`comprehensive_v1`**: Umfassender Intimität & BDSM Fragebogen
- **`psycho_enhanced_v3`**: Psychologisch vertiefter Fragebogen (v3)

> Hinweis: Im Repo liegen weitere Template-Dateien unter `backend/app/templates/` (z.B. `unified_template.json`, `starter_template.json`). Diese sind aktuell **nicht automatisch aktiv**, solange sie nicht im Template-Store registriert werden.

## Psychologische Vertiefung (v3)

Das **Intimacy & Kink v3 Template** (`psycho_enhanced_v3`) erweitert den Fragebogen um wissenschaftlich fundierte psychologische Tiefe in 6 Bereichen:

### Neue Module (zusätzlich zu den 9 Basis-Modulen):

1. **Bindung & Emotionale Basis** - Attachment Theory: Wie dein Bindungsstil (sicher/ängstlich/vermeidend) deine Intimität beeinflusst
2. **Aftercare-Profile & Drop-Physiologie** - Was Körper & Geist nach intensiven Erfahrungen brauchen (Sub Drop, Dom Drop)
3. **Subspace & Altered States** - Neurochemie von Trance-Zuständen, Transiente Hypofrontalität, Endorphine
4. **Emotionale Grenzen & Regulation** - Trauma-informierter Ansatz: Overwhelm, Freeze-Response, Window of Tolerance
5. **Scham, Tabus & Innere Konflikte** - Sexual Shame Psychology: Woher sie kommt, wie sie Erregung hemmt, wie man heilt
6. **Power Dynamics & Machtaustausch** - Die Psychologie von Kontrolle, Hingabe und Macht in intimen Beziehungen

### Wissenschaftliche Grundlagen

Alle psychologischen Module basieren auf peer-reviewed Forschung (2024-aktuell):
- Attachment Theory (Bowlby/Ainsworth)
- Subspace Neuroscience (2016 Studie: Transient Hypofrontality)
- Sexual Shame Research (MDPI, Journal of Sexual Medicine)
- Power Dynamics (2024: BDSM primär über Macht, nicht Schmerz)
- Aftercare & Drop Physiologie (Community Survey: 68% schätzen Aftercare als zentral)
- Trauma-informed Care (PMC: Freeze ≠ Consent, Arousal ≠ Wunsch)

**→ Für Details siehe:** [`docs/PSYCHOLOGIE_LEITFADEN.md`](docs/PSYCHOLOGIE_LEITFADEN.md) (~5000 Wörter)
**→ Alle Quellen:** [`docs/FORSCHUNG_ZITATE.md`](docs/FORSCHUNG_ZITATE.md) (16+ peer-reviewed Studien)
**→ Aftercare Deep Dive:** [`docs/AFTERCARE_GUIDE.md`](docs/AFTERCARE_GUIDE.md)

**Hinweis:** Dieser Fragebogen ersetzt keine professionelle Therapie. Bei anhaltenden psychischen Problemen nach sexuellen Erfahrungen: Bitte wende dich an eine:n Therapeut:in mit BDSM/Kink-Awareness.

**Deutsche Beratungsstellen:**
- **Pro Familia:** [`https://www.profamilia.de`](https://www.profamilia.de) (Sexualberatung)
- **BZgA:** [`https://www.bzga.de`](https://www.bzga.de) (Bundeszentrale für gesundheitliche Aufklärung)
- **Telefonseelsorge:** `0800 111 0 111` (kostenlos, 24/7)

## Datenschutz

- **Speicherung**:
  - **Server-Modus**: SQLite-Datei lokal (Default-Pfad via XDG, siehe `INTIMACY_TOOL_DB`).
  - **Offline/Local-API Modus**: IndexedDB im Browser/App-WebView.
- **Wichtig**: Gerätezugriff = Datenzugriff. Aktuell gibt es **keine Passwort-/Verschlüsselungsfunktion**.
- **KI-Analyse**: optional. Bei Nutzung werden Daten an einen Provider gesendet (z.B. OpenRouter).

## Architektur (Module / Zuständigkeiten)

- **Domain-Logik (`core/`)**
  - Server: `backend/app/core/compare.py`
  - Offline: `apps/web/web/core/compare.js`
  - Enthält Vergleich/Report-Klassifizierung (MATCH/EXPLORE/BOUNDARY), Flags, Action-Plan
- **Templates (`templates/`)**
  - Server Normalisierung/Loader: `backend/app/templates/normalize.py` + `backend/app/templates/loader.py`
  - Offline Normalisierung: `apps/web/web/templates/normalize.js`
  - Ziel: stabile Template-Form trotz älterer Shapes (Defaults/Migration-Glue)
- **Persistenz (`storage/`)**
  - Server SQLite Adapter: `backend/app/storage/sqlite.py`
  - Offline IndexedDB Adapter: `apps/web/web/storage/indexeddb.js`
  - Wichtig: bleibt Plaintext lokal (kein Auth/keine Verschlüsselung)
- **Frontend (statisches Web)**
  - Haupt-UI: `apps/web/web/app.js` (Rendering, Interaktion, API-Aufrufe)
  - Template-Visibility-Regeln: `apps/web/web/templates/dependencies.js`

## Medizinischer Hinweis
Das Tool ist keine medizinische Beratung. Bei Schmerzen/Blut/anhaltenden Beschwerden nach intensiven Praktiken:
ärztlich abklären.

## Installation & Start

### Web-Version (Server-Modus, empfohlen)

```bash
cd backend

# Python Virtual Environment erstellen
python3 -m venv .venv
source .venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# Server starten
python3 -m app
```

Dann im Browser öffnen: [http://127.0.0.1:8000](http://127.0.0.1:8000)

**Hinweis:** Die App ist auch im lokalen Netzwerk erreichbar, wenn die Firewall es erlaubt.

### Offline/Local-API Modus (IndexedDB statt SQLite)

- **Im Browser (mit lokalem Server)**: Starte den Server wie oben und öffne die App mit `?local=1`, z.B. `http://127.0.0.1:8000/?local=1`.
- **In der Android-App**: Local-API ist automatisch aktiv (Capacitor/WebView).

Einschränkungen im Offline-Modus:
- **Export** und **KI-Analyse** sind aktuell **nicht verfügbar** (Server-Endpoints).

### Android App

Für die native Android-App siehe die detaillierte Anleitung: [docs/APK_BUILD_GUIDE.md](docs/APK_BUILD_GUIDE.md)

**Kurzfassung:**
```bash
cd apps/mobile

# Node.js Abhängigkeiten installieren (Capacitor)
npm install

# Capacitor Android Projekt erstellen
npx cap add android

# Web-Dateien syncen
npx cap sync android

# Android Studio öffnen
npx cap open android
```

## Dokumentation

- **[APK Build Guide](docs/APK_BUILD_GUIDE.md)** - Detaillierte Anleitung zum Erstellen einer Android APK
- **[Psychologie Leitfaden](docs/PSYCHOLOGIE_LEITFADEN.md)** - Wissenschaftliche Grundlagen der psychologischen Module
- **[Forschung & Zitate](docs/FORSCHUNG_ZITATE.md)** - Peer-reviewed Studien und Quellen
- **[Aftercare Guide](docs/AFTERCARE_GUIDE.md)** - Tiefe Einführung zu Aftercare und Drop-Physiologie
- **[Entwickler-Dokumentation](docs/DEVELOPMENT.md)** - Projektstruktur, API, Testing (für Entwickler)

## Planungsdokumente

- **[Analyse & Verbesserungsplan](ANALYSE_UND_VERBESSERUNGSPLAN.md)** - Umfassende Analyse und geplante Verbesserungen
- **[Nächste Optimierungen](NEXT_OPTIMIZATIONS.md)** - Priorisierte Liste der nächsten Features
- **[Verbesserungsplan (Kurz)](VERBESSERUNGSPLAN_KURZ.md)** - Executive Summary
- **[Verbesserungsbeispiele](VERBESSERUNGSBEISPIELE.md)** - Vorher/Nachher Beispiele für geplante Änderungen
