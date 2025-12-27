# Verbesserungsbeispiele: Vorher/Nachher

## 1. High-Risk Granularität

### ❌ VORHER (zu grob)
```json
{
  "id": "AN01",
  "schema": "consent_rating",
  "risk_level": "C",
  "label": "Anal",
  "help": "Vorsicht: Hygiene und Tempo sind wichtig."
}
```

### ✅ NACHHER (granular)
```json
{
  "id": "AN01",
  "schema": "consent_rating",
  "risk_level": "B",
  "label": "Anal: Äußerliche Stimulation / Massage",
  "help": "Sanfte Berührung, keine Penetration. Gute Einstiegsmöglichkeit.",
  "tags": ["anal", "soft", "entry"]
},
{
  "id": "AN02",
  "schema": "consent_rating",
  "risk_level": "B",
  "label": "Anal: Spielzeug / Plugs (klein)",
  "help": "Kleine Plugs oder Finger. Langsam und mit viel Gleitmittel.",
  "depends_on": { "id": "AN01", "values": ["YES", "MAYBE"] },
  "tags": ["anal", "toy", "intermediate"]
},
{
  "id": "AN03",
  "schema": "consent_rating",
  "risk_level": "C",
  "label": "Anal: Penetration / Größeres Spielzeug",
  "help": "⚠️ SICHERHEITSHINWEIS: Penetration erfordert viel Vorbereitung, Hygiene, Tempo und klare Grenzen.",
  "depends_on": { "id": "AN02", "values": ["YES", "MAYBE"] },
  "tags": ["anal", "penetration", "advanced"]
}
```

**Vorteil:** Ein "Nein" zu Penetration heißt nicht "Nein" zu allem in dem Bereich.

---

## 2. Help-Texte bei Risk C

### ❌ VORHER (unsichtbar)
```html
<div class="hint">Vorsicht: Würgespiele erfordern Kenntnisse.</div>
```

### ✅ NACHHER (prominent)
```html
<div class="risk-c-warning">
  <div class="warning-header">
    <span class="warning-icon">⚠️</span>
    <strong>SICHERHEITSHINWEIS</strong>
  </div>
  <div class="warning-content">
    <p><strong>Würgespiele erfordern:</strong></p>
    <ul>
      <li>Kehlkopf ist <strong>TABU</strong> (nur seitlich)</li>
      <li>Sofortiges Stop-Signal vereinbaren</li>
      <li>Keine Kompression der Halsschlagader</li>
      <li>Erste-Hilfe-Kenntnisse empfohlen</li>
    </ul>
  </div>
</div>
```

**Vorteil:** Sicherheitshinweise können nicht übersehen werden.

---

## 3. Info-Karten für Szenarien

### ❌ VORHER (nur Beschreibung)
```json
{
  "id": "S01",
  "title": "Die offene Tür",
  "description": "Die kühle Nachtluft tut gut..."
}
```

### ✅ NACHHER (mit Info-Karte)
```json
{
  "id": "S01",
  "title": "Die offene Tür",
  "category": "Public/Voyeur",
  "description": "Die kühle Nachtluft tut gut...",
  "info_card": {
    "emotional_context": "Oft geht's um den Kitzel des Verbotenen, Exhibitionismus, Macht über die Situation.",
    "typical_risks": "Entdeckung, Scham, Consent-Drittpersonen (andere Gäste).",
    "safety_gate": "Voraussetzungen: Privater Raum, keine unbeteiligten Dritten, klare Grenzen zu Voyeurismus."
  },
  "options": [...]
}
```

**Frontend-Darstellung:**
```
┌─────────────────────────────────────────┐
│ 📋 Szenario: Die offene Tür            │
│    Kategorie: Public/Voyeur            │
├─────────────────────────────────────────┤
│ ℹ️ Emotionaler Kontext:                │
│ Oft geht's um den Kitzel des            │
│ Verbotenen, Exhibitionismus...          │
│                                         │
│ ⚠️ Typische Risiken:                   │
│ Entdeckung, Scham, Consent-            │
│ Drittpersonen...                        │
│                                         │
│ 🔒 Sicherheits-Gate:                   │
│ Voraussetzungen: Privater Raum...      │
└─────────────────────────────────────────┘
```

**Vorteil:** Nutzer verstehen Kontext und Risiken vor der Entscheidung.

---

## 4. Rahmen & Logistik Modul

### ❌ VORHER (fehlt)
Kein Modul für praktische Rahmenbedingungen.

### ✅ NACHHER (neues Modul)
```json
{
  "id": "logistics",
  "name": "Rahmen, Zeit & Logistik",
  "description": "Bevor es zur Sache geht: Stressfaktoren, Zeitfenster und Privatsphäre klären.",
  "questions": [
    {
      "id": "L01",
      "schema": "scale_1_10",
      "risk_level": "A",
      "tags": ["time", "stress"],
      "label": "Wie viel Ruhe/Quality Time haben wir aktuell gefühlt?",
      "help": "0 = Nur Stress/Hektik, 10 = Wir nehmen uns viel Zeit ohne Ablenkung."
    },
    {
      "id": "L02",
      "schema": "enum",
      "risk_level": "A",
      "tags": ["coping"],
      "label": "Wenn einer von uns gestresst ist: Was ist die beste Strategie?",
      "help": "Erwartungsmanagement hilft Frust zu vermeiden.",
      "options": [
        "Sex zur Entspannung hilft",
        "Lieber nur Kuscheln/Massage",
        "Komplette Ruhe/Absage",
        "Reden statt Tun",
        "Kommt drauf an"
      ]
    },
    {
      "id": "L03",
      "schema": "enum",
      "risk_level": "B",
      "tags": ["privacy", "digital"],
      "label": "Digitale Spuren (Chats, Fotos, Videos): Wie strikt sind wir?",
      "help": "Sicherheit vor Leaks oder Zugriff Dritter.",
      "options": [
        "Nichts digital speichern",
        "Verschlüsselt/Hidden Folder ok",
        "Nur auf einem Gerät (Offline)",
        "Alles ok (Cloud etc.)",
        "Kommt drauf an"
      ]
    },
    {
      "id": "L04",
      "schema": "enum",
      "risk_level": "A",
      "tags": ["time"],
      "label": "Minimale Zeit für Quality Time?",
      "help": "Wie viel Zeit brauchen wir mindestens?",
      "options": [
        "30 Minuten",
        "1 Stunde",
        "2 Stunden",
        "Open End",
        "Kommt drauf an"
      ]
    }
  ]
}
```

**Vorteil:** Praktische Umsetzung wird vorbereitet, Frustration vermieden.

---

## 5. Deck-Struktur für Szenarien

### ❌ VORHER (flach)
```json
{
  "scenarios": [
    {"id": "S01", "title": "Die offene Tür", ...},
    {"id": "S02", "title": "Kontrollverlust Light", ...},
    {"id": "S03", "title": "Das Foto-Dilemma", ...},
    ...
  ]
}
```
Alle 20 Szenarien gleichberechtigt → Overwhelm

### ✅ NACHHER (strukturiert)
```json
{
  "decks": [
    {
      "id": "warmup",
      "name": "Deck 1: Warm-Up",
      "description": "Reden über Nähe, Initiation, Feedback, Aftercare, Grenzen. Kein 'Kink', nur Basis-Sicherheit.",
      "scenarios": ["S01", "S02", "S03", "S04"],
      "order": 1
    },
    {
      "id": "roles",
      "name": "Deck 2: Rollen & Dynamik",
      "description": "Dominant/devot/switch, Kontrolle abgeben/nehmen, Regeln, Sprache, Tempo.",
      "scenarios": ["S05", "S06", "S07", "S08"],
      "order": 2
    },
    {
      "id": "curiosity",
      "name": "Deck 3: Neugier & Tabu",
      "description": "Neue Settings, Spielzeuge, Beobachten/Beobachtet werden, Fantasie vs Umsetzung.",
      "scenarios": ["S09", "S10", "S11", "S12"],
      "order": 3
    },
    {
      "id": "highrisk",
      "name": "Deck 4: High-Risk",
      "description": "Themen mit höherem körperlichen/psychischen Risiko. ⚠️ Sicherheits-Gate erforderlich.",
      "scenarios": ["S13", "S14", "S15", "S16"],
      "order": 4,
      "requires_safety_gate": true
    }
  ]
}
```

**Frontend-Darstellung:**
```
┌─────────────────────────────────────┐
│ 🎴 Szenarien                         │
├─────────────────────────────────────┤
│ [Deck 1: Warm-Up] ✓ 4/4             │
│ [Deck 2: Rollen & Dynamik] ⏳ 2/4   │
│ [Deck 3: Neugier & Tabu] 🔒        │
│ [Deck 4: High-Risk] 🔒              │
└─────────────────────────────────────┘
```

**Vorteil:** Progression, weniger Overwhelm, Sicherheits-Gates.

---

## 6. Conditional Logic erweitert

### ❌ VORHER (limitiert)
```json
{
  "depends_on": { "id": "AN01", "values": ["YES", "MAYBE"] }
}
```
Nur für `consent_rating` Status.

### ✅ NACHHER (erweitert)
```json
{
  "depends_on": {
    "id": "Q01",
    "condition": "scale_1_10 >= 5",
    "operator": "AND",
    "additional": [
      {"id": "Q02", "values": ["YES"]}
    ]
  }
}
```

**Beispiele:**
- "Nur wenn Zufriedenheit >= 5" → `scale_1_10 >= 5`
- "Nur wenn beide YES" → `AND` mit zwei Bedingungen
- "Wenn A oder B" → `OR` Operator

**Vorteil:** Intelligente Frage-Ausblendung, weniger kognitive Belastung.

---

## 7. Review-Modul ausgebaut

### ❌ VORHER (unvollständig)
```json
{
  "id": "review",
  "name": "Bereits erlebt",
  "questions": [
    {
      "id": "R01",
      "label": "Was haben wir schon gemacht?",
      "schema": "multi"
    }
  ]
}
```

### ✅ NACHHER (vollständig)
```json
{
  "id": "review",
  "name": "Reflektion & Review",
  "description": "Für Paare mit Historie: Was wollen wir wiederholen? Was weniger?",
  "questions": [
    {
      "id": "R01",
      "schema": "multi",
      "risk_level": "A",
      "tags": ["review"],
      "label": "Was haben wir schon gemacht und möchten wiederholen?",
      "help": "Auswahl aus allen bisherigen Praktiken."
    },
    {
      "id": "R02",
      "schema": "multi",
      "risk_level": "A",
      "tags": ["review", "drop"],
      "label": "Was wollen wir weniger machen?",
      "help": "Praktiken, die nicht so gut funktioniert haben."
    },
    {
      "id": "R03",
      "schema": "text",
      "risk_level": "A",
      "tags": ["review", "highlight"],
      "label": "Was war ein Highlight, das wir wiederholen sollten?",
      "help": "Besonders positive Erfahrungen."
    },
    {
      "id": "R04",
      "schema": "text",
      "risk_level": "A",
      "tags": ["review", "debrief"],
      "label": "Debrief-Log: Letzte 4 Experimente",
      "help": "Kurze Notizen zu den letzten Experimenten: Was hat funktioniert? Was nicht?"
    }
  ]
}
```

**Vorteil:** Paare mit Historie können reflektieren und lernen.

---

## 8. Action Plan verbessert

### ❌ VORHER (einfach)
```python
# Wählt einfach Top 3 nach Score
matches = sorted(matches, key=lambda x: x["score"], reverse=True)
return matches[:3]
```

### ✅ NACHHER (divers)
```python
# Tag-basierte Diversität
tag_categories = {
    "soft": ["kissing", "touching", "cuddling"],
    "toy": ["toy", "vibrator", "plug"],
    "kink": ["bdsm", "roleplay", "fetish"],
    "intense": ["impact", "breath", "edge"]
}

# 1. Versuche verschiedene Tags
# 2. Versuche verschiedene Module
# 3. Balance Risk-Level (nicht nur High-Risk)
# 4. Filter nach Comfort (beide >= 3)
```

**Ergebnis:**
```
┌─────────────────────────────────────┐
│ 🎯 4-Wochen-Plan                    │
├─────────────────────────────────────┤
│ Woche 1: Sinnliche Massage (Soft)   │
│ Woche 2: Vibrator einsetzen (Toy)   │
│ Woche 3: Rollenspiel (Kink)         │
└─────────────────────────────────────┘
```

**Vorteil:** Ausgewogene, diverse Experimente statt nur High-Risk.

---

## Zusammenfassung

| Verbesserung | Aufwand | Impact | Priorität |
|-------------|---------|--------|-----------|
| High-Risk Granularität | 6-8h | HOCH | ⚠️ SICHERHEIT |
| Help-Texte Risk C | 2-3h | HOCH | ⚠️ SICHERHEIT |
| Info-Karten Szenarien | 4-5h | MITTEL-HOCH | 📋 |
| Rahmen & Logistik | 3-4h | MITTEL-HOCH | 🏠 |
| Deck-Struktur | 3-4h | MITTEL | 🎴 |
| Conditional Logic | 4-5h | MITTEL | 🔧 |
| Review-Modul | 2-3h | MITTEL | 📝 |
| Action Plan | 3-4h | MITTEL | 🎯 |

**Gesamtaufwand:** ~30-40 Stunden für alle Verbesserungen








