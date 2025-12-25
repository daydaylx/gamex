# Template-Authoring Guide

Dieser Guide erklärt, wie Fragebogen-Templates erstellt und bearbeitet werden.

## Template-Struktur

Ein Template ist eine JSON-Datei mit folgender Struktur:

```json
{
  "id": "template_id",
  "name": "Template Name",
  "version": 1,
  "description": "Beschreibung des Templates",
  "modules": [...]
}
```

### Felder

- **id** (erforderlich): Eindeutige Template-ID (z.B. "default_v3")
- **name** (erforderlich): Anzeigename des Templates
- **version** (erforderlich): Versionsnummer (Integer)
- **description** (optional): Beschreibung des Templates
- **modules** (erforderlich): Array von Modulen (siehe unten)

## Module

Module gruppieren Fragen zu thematischen Bereichen.

```json
{
  "id": "module_id",
  "name": "Modul Name",
  "description": "Beschreibung des Moduls",
  "questions": [...]
}
```

### Modul-Felder

- **id** (erforderlich): Eindeutige Modul-ID
- **name** (erforderlich): Anzeigename des Moduls
- **description** (optional): Beschreibung, die dem Nutzer angezeigt wird
- **questions** (erforderlich): Array von Fragen

## Fragen

Jede Frage hat folgende Basis-Felder:

```json
{
  "id": "Q01",
  "schema": "consent_rating",
  "risk_level": "A",
  "tags": ["tag1", "tag2"],
  "label": "Fragen-Text",
  "help": "Hilfetext (optional)"
}
```

### Erforderliche Felder

- **id**: Eindeutige Fragen-ID innerhalb des Templates
- **schema**: Schema-Typ (siehe unten)
- **risk_level**: Risiko-Level "A", "B" oder "C"
- **label**: Der Fragen-Text, der dem Nutzer angezeigt wird
- **tags**: Array von Tags (können leer sein)

### Optionale Felder

- **help**: Hilfetext, der dem Nutzer angezeigt wird
- **depends_on**: Bedingte Anzeige (siehe unten)

## Schema-Typen

### consent_rating

Für Fragen mit Ja/Nein/Vielleicht + Interesse/Komfort-Bewertung.

```json
{
  "id": "Q01",
  "schema": "consent_rating",
  "risk_level": "A",
  "tags": ["touch", "oral"],
  "label": "Oralsex aktiv geben",
  "help": "Bewerte, wie gerne du das tust."
}
```

**Antwort-Struktur:**
- `status`: "YES", "NO", "MAYBE", "HARD_LIMIT"
- `interest`: 0-4 (0 = kein Interesse, 4 = sehr hohes Interesse)
- `comfort`: 0-4 (0 = sehr unwohl, 4 = sehr wohl)
- `conditions`: Text (erforderlich wenn status="MAYBE")
- `notes`: Text (optional)

**Neue optionale Felder (ab v3):**
- `intensity`: 1-5 (Standard: 3)
- `hardNo`: boolean (automatisch gesetzt wenn status="NO")
- `contextFlags`: Array von Strings (z.B. ["only_with_preparation", "only_with_aftercare"])
- `confidence`: 1-5 (getrennt von comfort)

### scale_0_10

Für Fragen mit Skala von 0-10.

```json
{
  "id": "Q02",
  "schema": "scale_0_10",
  "risk_level": "A",
  "tags": ["satisfaction"],
  "label": "Wie zufrieden bist du?",
  "help": "0 = gar nicht, 10 = sehr"
}
```

**Antwort-Struktur:**
- `value`: 0-10

### enum

Für Fragen mit vordefinierten Optionen.

```json
{
  "id": "Q03",
  "schema": "enum",
  "risk_level": "A",
  "tags": ["aftercare"],
  "label": "Was brauchst du nach intensiven Momenten?",
  "help": "Wichtig für emotionales Ankommen.",
  "options": [
    "Nähe/Kuscheln",
    "Reden/Feedback",
    "Ruhe/Schlaf",
    "Space/Allein sein"
  ]
}
```

**Antwort-Struktur:**
- `value`: Einer der Optionen-Strings

### text

Für freie Texteingabe.

```json
{
  "id": "Q04",
  "schema": "text",
  "risk_level": "A",
  "tags": ["notes"],
  "label": "Weitere Notizen:",
  "help": "Platz für alles, was wichtig ist."
}
```

**Antwort-Struktur:**
- `text`: Freier Text

### multi

Für Mehrfachauswahl (selten verwendet).

```json
{
  "id": "Q05",
  "schema": "multi",
  "risk_level": "A",
  "tags": ["activities"],
  "label": "Welche Aktivitäten interessieren dich?",
  "options": ["Option 1", "Option 2", "Option 3"]
}
```

**Antwort-Struktur:**
- `values`: Array von ausgewählten Optionen

## Risiko-Level

- **A** (Low): Standard-Fragen, geringes Risiko
- **B** (Medium): Mittleres Risiko, erfordert mehr Kommunikation
- **C** (High): Hohes Risiko, erfordert ausführliche Sicherheits-Gespräche

High-Risk-Fragen sollten immer einen Hilfetext mit Sicherheitshinweisen haben.

## Tags

Tags werden für Filterung und Gruppierung in der Analyse verwendet. Beispiele:

- **Kategorien**: `touch`, `oral`, `anal`, `bondage`, `communication`, `safety`
- **Richtungen**: `give`, `receive`, `active`, `passive`
- **Intensität**: `soft`, `intense`, `progression`
- **Risiko**: `high_risk`, `safe`

Verwende konsistente Tags über alle Templates hinweg.

## Bedingte Anzeige (depends_on)

Fragen können abhängig von anderen Fragen angezeigt werden:

```json
{
  "id": "AN02",
  "schema": "consent_rating",
  "risk_level": "B",
  "depends_on": {
    "id": "AN01",
    "values": ["YES", "MAYBE"]
  },
  "tags": ["anal", "toys"],
  "label": "Anale Spielzeuge",
  "help": "Nur mit Stop-Base!"
}
```

Die Frage wird nur angezeigt, wenn die Frage mit ID "AN01" mit "YES" oder "MAYBE" beantwortet wurde.

## Best Practices

### Fragen-Formulierung

- **Klar und direkt**: Vermeide Umschreibungen
- **Neutral**: Keine wertenden Formulierungen
- **Kurz**: Fragen sollten in einem Satz verständlich sein
- **Spezifisch**: Vermeide zu allgemeine Fragen

**Gut:**
- "Oralsex aktiv geben (dich verwöhnen)."
- "Spanking / Hauen (Hand oder Toys)."

**Schlecht:**
- "Was magst du?"
- "Alles rund um Sex?"

### Hilfe-Texte

Hilfe-Texte sollten:
- Kontext liefern
- Sicherheitshinweise enthalten (bei High-Risk)
- Bei MAYBE erklären, warum Bedingungen wichtig sind

### Modul-Organisation

Gruppiere Fragen logisch:
- Starte mit grundlegenden Themen (Kommunikation, Grenzen)
- Baue von einfach zu komplex auf
- High-Risk-Themen ans Ende

### Tag-Taxonomie

Halte Tags konsistent:
- Verwende etablierte Tags (siehe bestehende Templates)
- Erstelle keine neuen Tags ohne Grund
- Verwende mehrere Tags pro Frage (z.B. `["touch", "oral", "give"]`)

## Beispiel-Template

Siehe `app/templates/default_template.json` für ein vollständiges Beispiel.

## Migration

Wenn du ein Template aktualisierst:
1. Erhöhe die `version`-Nummer
2. Ändere die `id`, wenn es Breaking Changes gibt
3. Stelle sicher, dass alte Antworten weiterhin funktionieren (Normalisierung)

Die Normalisierungs-Funktion in `template_store.py` stellt sicher, dass fehlende Felder mit Standardwerten gefüllt werden.

