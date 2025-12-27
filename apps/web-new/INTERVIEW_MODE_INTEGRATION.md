# Interview-Modus Integration

## Übersicht

Der Interview-Modus wurde implementiert und ist bereit zur Integration in die Routing-Struktur.

## Route hinzufügen

Um den Interview-Modus zu aktivieren, muss folgende Route in der Router-Konfiguration hinzugefügt werden:

```tsx
import { InterviewViewPage } from "./views/InterviewView";

// In der Router-Konfiguration:
<Route path="/sessions/:sessionId/interview/:person" component={InterviewViewPage} />
```

Die Route erwartet:
- `sessionId`: ID der Session
- `person`: "A" oder "B"

## Bereits implementierte Komponenten

1. **InterviewView** (`src/components/interview/InterviewView.tsx`)
   - Hauptkomponente für den Interview-Flow
   - Chat-UI mit strukturierten Formularen
   - Progress-Tracking und Navigation

2. **InterviewViewPage** (`src/views/InterviewView.tsx`)
   - Wrapper-Komponente für Routing
   - Handles Session-Loading und Person-Parameter

3. **Services**
   - `interview-storage.ts`: Persistenz mit strikter Key-Trennung
   - `openrouter.ts`: KI-Hilfe und Report-Generierung
   - `interview-followup.ts`: Deterministische Follow-up-Logik

4. **Types**
   - `interview.ts`: Alle TypeScript-Interfaces

5. **Daten**
   - `public/data/interview_scenarios.json`: 12 initiale Szenarien

## Storage Keys

Alle Interview-Daten werden unter strikt getrennten Keys gespeichert:
- Sessions: `gamex_interview_v1_session_{sessionId}_{person}`
- Settings: `gamex_interview_v1_settings`
- Cache: `gamex_interview_v1_scenarios_cache`

**KEINE Kollision** mit `gamex:sessions` möglich.

## Schema-Versionierung

- `schema_version: 1` in allen Session-Daten
- Migration-Logik beim Laden alter Sessions
- Forward-compatible Loading von Szenarien-Dateien

## Follow-up Regeln

Deterministische Logik (keine KI-Entscheidung):
- `interest_high_comfort_low`: `primary >= 4 && comfort <= 2`
- Follow-up-Fragen kommen aus Szenario-Daten, nicht von KI

## JSON-Enforcement für Reports

Mehrstufiges Parsing mit Fallback:
1. Direktes JSON.parse
2. JSON aus Markdown-Block extrahieren
3. JSON zwischen erstem `{` und letztem `}` finden
4. Fallback: Rohtext anzeigen (UI stirbt nie)

## Settings für OpenRouter

API-Key und Modelle werden in `gamex_interview_v1_settings` gespeichert.
Settings können über `loadInterviewSettings()` und `saveInterviewSettings()` verwaltet werden.

