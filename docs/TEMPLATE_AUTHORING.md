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

- **help**: Hilfetext, der dem Nutzer angezeigt wird (kurz, prägnant)
- **info_details**: Ausführliche psychologische/wissenschaftliche Erklärung (länger, ausklappbar)
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

### scale_1_10

Für Fragen mit Skala von 1-10.

```json
{
  "id": "Q02",
  "schema": "scale_1_10",
  "risk_level": "A",
  "tags": ["satisfaction"],
  "label": "Wie zufrieden bist du?",
  "help": "1 = gar nicht, 10 = sehr"
}
```

**Antwort-Struktur:**
- `value`: 1-10

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

### Hilfe-Texte (help)

Hilfe-Texte sollten:
- **Aussagekräftig sein**: Vermeide generische Texte wie "Kategorie: ..."
- **Kontext liefern**: Erkläre kurz, was die Praxis bedeutet
- **Psychologische Bedeutung**: Bei relevanten Praktiken die psychologische Dimension erwähnen (Vertrauen, Hingabe, Verletzlichkeit)
- **Sicherheitshinweise enthalten**: Bei High-Risk-Fragen (risk_level B/C) immer Sicherheitshinweise
- **Bei MAYBE erklären**: Warum Bedingungen wichtig sind
- **Kurz und prägnant**: 1-2 Sätze, nicht zu lang

**Gute Beispiele:**
- ✅ "Schmerz setzt Endorphine frei → Euphorie. Kann zu Subspace führen."
- ✅ "Akt der Hingabe: 'Ich diene dir' zeigt tiefe Verbundenheit."
- ✅ "Ultimative Auslieferung, erfordert absolutes Vertrauen da Kommunikation eingeschränkt ist."
- ✅ "Physische Nähe und Berührung schaffen emotionale Verbindung und Sicherheit. Oxytocin wird ausgeschüttet."
- ✅ "Materialien wie Latex oder Leder können sensorische Reize verstärken und Rollenidentität unterstützen."

**Schlechte Beispiele:**
- ❌ "Kategorie: Materialien:"
- ❌ "Kategorie: Kommunikation:"
- ❌ "Kategorie: Wichtig ist mir:"
- ❌ Zu generisch, keine Information

### Info-Details (info_details)

`info_details` ist ein optionales Feld für ausführliche psychologische und wissenschaftliche Erklärungen:

- **Wann verwenden**: Bei komplexen Praktiken, die psychologische Tiefe oder Neurochemie-Erklärungen benötigen
  - Impact Play (Spanking, Tools)
  - Bondage (feste Fesseln, Gags)
  - Breathplay (sehr riskant!)
  - Machtdynamiken (Submission, Dominanz)
  - Fetische (Material, Körperteil, Rollenspiele)
  - Aftercare-Bedürfnisse
- **Inhalt**: 
  - Psychologische Bedeutung (Vertrauen, Hingabe, Verletzlichkeit)
  - Attachment Theory Bezüge (wenn relevant)
  - Neurochemie (Endorphine, Subspace, Hormone)
  - Sicherheitshinweise (bei Risk Level B/C)
- **Länge**: Kann länger sein als `help` (mehrere Sätze, Absatz)
- **Format**: Wissenschaftlich fundiert, aber verständlich
- **Quellen**: Basierend auf PSYCHOLOGIE_LEITFADEN.md und FORSCHUNG_ZITATE.md

**Beispiele für info_details:**

```json
{
  "label": "Feste Bondage / Seile",
  "help": "**WICHTIG**: Niemals Blut abschnüren, Nervenbahnen schützen!",
  "info_details": "Gefühl der völligen Auslieferung. Kann sehr entspannend wirken, weil man 'nichts mehr tun muss'. Attachment Theory: Fesseln erzeugt extreme Vulnerabilität - funktioniert nur mit sicherem Bindungsstil oder sehr hohem Vertrauen. Neurochemie: Serotonin-Subspace möglich (meditative Entspannung)."
}
```

**Themen für info_details:**
- **Vertrauen & Verletzlichkeit**: Bondage, Gags, Blindfolds
- **Hingabe & Service**: Service/Gehorsam, Orgasmuskontrolle
- **Macht & Kontrolle**: Dominanz/Submission, Disziplinierung
- **Neurochemie**: Impact Play (Endorphine), Breathplay (Noradrenalin), Bondage (Serotonin)
- **Fetische**: Material-Fetische, Körperteil-Fetische, Rollenspiele
- **Aftercare**: Sub Drop, Dom Drop, Regulation

**Quellen**: Siehe `docs/PSYCHOLOGIE_LEITFADEN.md` und `docs/FORSCHUNG_ZITATE.md` für wissenschaftliche Grundlagen.

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
