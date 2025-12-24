# Analyse und Verbesserungsplan: Fragebögen & Szenarien

**Erstellt:** 2025-01-27  
**Projekt:** Intimacy Questionnaire Tool (GameX)  
**Fokus:** Optimierung der Fragebögen-Templates und Szenarien-Karten

---

## 📊 Executive Summary

Das Projekt ist ein **local-first Intimacy Tool** für Paare, die getrennt Fragebögen ausfüllen, Antworten vergleichen und Reports generieren. Die Analyse zeigt:

**Stärken:**
- ✅ Solide technische Basis (Python Backend, JavaScript Frontend)
- ✅ Mehrere Template-Varianten (default, psycho_enhanced_v3, unified)
- ✅ 20 Szenarien-Karten mit 4-Optionen-System
- ✅ Vergleichslogik mit MATCH/EXPLORE/BOUNDARY
- ✅ Conditional Logic (depends_on) bereits implementiert

**Verbesserungspotenzial:**
- ⚠️ High-Risk Themen zu grob (z.B. "Anal" nur eine Frage)
- ⚠️ Szenarien fehlen Kontext-Info-Karten und Sicherheits-Gates
- ⚠️ Help-Texte bei Risk C nicht prominent genug
- ⚠️ Action Plan Algorithmus könnte diverser sein
- ⚠️ Fehlende Module: Logistik, Review/Reflection

---

## 🔍 Detaillierte Analyse

### 1. Fragebögen-Struktur

#### 1.1 Aktuelle Template-Architektur

**Vorhandene Templates:**
- `default_template.json` (v2) - Basis mit 9 Modulen
- `psycho_enhanced_v3.json` (v3) - 15 Module (9 Basis + 6 Psychologie)
- `unified_template.json` - Kombiniert verschiedene Ansätze
- `comprehensive_v1.json` - Umfassende Variante

**Schema-Typen:**
- `consent_rating` - YES/MAYBE/NO + Interest/Comfort (0-4)
- `scale_0_10` - Skala 0-10
- `enum` - Auswahl aus Optionen
- `multi` - Mehrfachauswahl
- `text` - Freitext

**Risk-Levels:**
- A = Niedrig (Standard)
- B = Mittel (Vorsicht)
- C = Hoch (Sicherheitshinweise erforderlich)

#### 1.2 Identifizierte Probleme

**Problem 1: High-Risk Granularität zu niedrig**
- Beispiel: "Anal" ist nur eine Frage
- Realität: Einstieg (äußerlich) vs. Fortgeschritten (Penetration) sind sehr unterschiedlich
- **Impact:** Falsche Matches, übersprungene Grenzen

**Problem 2: Fehlende Logistik-Module**
- Keine Fragen zu Zeit, Stress, Privatsphäre
- **Impact:** Praktische Umsetzung wird nicht vorbereitet

**Problem 3: Help-Texte unzureichend**
- Bei Risk C oft nur kurze Hinweise
- Keine prominenten Warnungen
- **Impact:** Sicherheitsrisiken werden übersehen

**Problem 4: Conditional Logic limitiert**
- `depends_on` funktioniert nur für `consent_rating` Status
- Keine Unterstützung für `scale_0_10` Werte
- Keine kombinierten Bedingungen (AND/OR)
- **Impact:** Zu viele irrelevante Fragen werden angezeigt

**Problem 5: Review-Modul unvollständig**
- Keine "Was wollen wir weniger machen?" Frage
- Keine "Highlights wiederholen" Option
- **Impact:** Paare mit Historie können nicht reflektieren

#### 1.3 Content-Qualität

**Gut:**
- Psychologische Module (v3) sind wissenschaftlich fundiert
- Tags sind vorhanden, aber nicht standardisiert
- Module-Beschreibungen geben Kontext

**Verbesserungswürdig:**
- Info-Cards vor Modulen fehlen (nur Beschreibung)
- Sicherheitshinweise nicht prominent genug
- Keine "Mini-Edu-Karten" für komplexe Themen

---

### 2. Szenarien-Struktur

#### 2.1 Aktuelle Szenarien-Architektur

**Vorhanden:**
- 20 Szenarien in `scenarios.json`
- 4-Optionen-System: A (Nein), B (Fantasie), C (Test), D (Ja)
- Kategorien: Public/Voyeur, Power Dynamics, Digital/Privacy, etc.

**Schema:**
```json
{
  "id": "S01",
  "title": "...",
  "category": "...",
  "description": "...",
  "options": [
    {"id": "A", "label": "...", "risk_type": "boundary"},
    {"id": "B", "label": "...", "risk_type": "fantasy_passive"},
    {"id": "C", "label": "...", "risk_type": "negotiation"},
    {"id": "D", "label": "...", "risk_type": "active"}
  ]
}
```

#### 2.2 Identifizierte Probleme

**Problem 1: Fehlende Info-Karten**
- Keine "Worum geht's emotional?" Erklärung
- Keine "Welche Risiken sind typisch?" Hinweise
- **Impact:** Nutzer verstehen Kontext nicht vollständig

**Problem 2: Keine Sicherheits-Gates**
- High-Risk Szenarien haben keine Voraussetzungen
- **Impact:** "Mal eben" Katastrophen möglich

**Problem 3: Keine Deck-Struktur**
- Alle 20 Szenarien gleichberechtigt
- Kein Warm-Up → High-Risk Progression
- **Impact:** Overwhelm, falsche Reihenfolge

**Problem 4: Risk-Type Mapping unklar**
- `risk_type` in Options, aber nicht konsistent
- Vergleichslogik nutzt `risk_type` nur teilweise
- **Impact:** Unklare Auswertung

**Problem 5: Fehlende Bedingungen-Felder**
- Options haben keine expliziten "Bedingungen"
- **Impact:** C-Optionen können nicht spezifiziert werden

---

## 🎯 Verbesserungsplan

### Phase 1: Content-Optimierung (Priorität: HOCH)

#### 1.1 High-Risk Granularität erhöhen

**Ziel:** High-Risk Themen in Einstieg/Fortgeschritten aufteilen

**Beispiel: Anal**
```
AN01: "Anal: Äußerliche Stimulation / Massage" (Risk B)
AN02: "Anal: Spielzeug / Plugs (klein)" (Risk B)
AN03: "Anal: Penetration / Größeres Spielzeug" (Risk C)
```

**Umsetzung:**
- [ ] Alle Risk C Fragen identifizieren
- [ ] In 2-3 Abstufungen aufteilen
- [ ] `depends_on` für Progression nutzen
- [ ] Help-Texte für jede Stufe anpassen

**Dateien:**
- `app/templates/default_template.json`
- `app/templates/psycho_enhanced_v3.json`
- `app/templates/comprehensive_v1.json`

**Aufwand:** 6-8 Stunden (Content-Arbeit)

---

#### 1.2 "Rahmen & Logistik" Modul hinzufügen

**Ziel:** Praktische Rahmenbedingungen vor Praktiken klären

**Neue Fragen:**
```
L01: "Wie viel Ruhe/Quality Time haben wir aktuell gefühlt?" (scale_0_10)
L02: "Wenn einer gestresst ist: Was ist die beste Strategie?" (enum)
L03: "Digitale Spuren (Chats, Fotos): Wie strikt sind wir?" (enum)
L04: "Minimale Zeit für Quality Time?" (enum: 30min, 1h, 2h, Open End)
L05: "Privatsphäre: Wer darf was wissen?" (text)
```

**Umsetzung:**
- [ ] Neues Modul `logistics` erstellen
- [ ] Als erstes Modul im Template platzieren
- [ ] In alle Templates integrieren

**Dateien:**
- `app/templates/*.json`

**Aufwand:** 3-4 Stunden

---

#### 1.3 Help-Texte bei Risk C prominent machen

**Ziel:** Sicherheitshinweise immer sichtbar bei Risk C

**Umsetzung:**
- [ ] Frontend: Risk C Fragen bekommen Warnung-Banner
- [ ] Icon (⚠️) hinzufügen
- [ ] Help-Text dauerhaft sichtbar (nicht nur als Hint)
- [ ] Kollabierbar, aber standardmäßig offen

**Beispiel Help-Text:**
```
⚠️ SICHERHEITSHINWEIS: Würgespiele erfordern:
- Kehlkopf ist TABU (nur seitlich)
- Sofortiges Stop-Signal vereinbaren
- Keine Kompression der Halsschlagader
- Erste-Hilfe-Kenntnisse empfohlen
```

**Dateien:**
- `web/app.js` - `renderConsentRating()` erweitern
- `web/styles.css` - `.risk-c-warning` Styling

**Aufwand:** 2-3 Stunden

---

#### 1.4 Review-Modul ausbauen

**Ziel:** Reflektion für Paare mit Historie ermöglichen

**Neue Fragen:**
```
R01: "Was wollen wir weniger machen?" (multi)
R02: "Was war ein Highlight, das wir wiederholen sollten?" (multi)
R03: "Was hat nicht funktioniert?" (text)
R04: "Debrief-Log: Letzte 4 Experimente" (text)
```

**Umsetzung:**
- [ ] Review-Modul erweitern
- [ ] Optional: Neues Schema `review_rating` für Drop-List

**Dateien:**
- `app/templates/*.json`

**Aufwand:** 2-3 Stunden

---

### Phase 2: Struktur & Logik (Priorität: MITTEL-HOCH)

#### 2.1 Conditional Logic erweitern

**Ziel:** Intelligente Frage-Ausblendung basierend auf Antworten

**Aktuell:**
```json
"depends_on": { "id": "AN01", "values": ["YES", "MAYBE"] }
```

**Erweitert:**
```json
"depends_on": {
  "id": "Q01",
  "condition": "scale_0_10 >= 5",  // Neuer Typ
  "operator": "AND",
  "additional": [
    {"id": "Q02", "values": ["YES"]}
  ]
}
```

**Umsetzung:**
- [ ] Schema erweitern für `scale_0_10` Bedingungen
- [ ] Frontend: `evaluateDependency()` erweitern
- [ ] Cascade-Logik (A versteckt B, B versteckt C)

**Dateien:**
- `web/app.js` - `evaluateDependency()` Funktion
- `app/templates/*.json` - Schema dokumentieren

**Aufwand:** 4-5 Stunden

---

#### 2.2 Tags standardisieren

**Ziel:** Konsistente Tags für bessere KI/Regel-Auswertung

**Standard-Set:**
```json
{
  "act": ["kissing", "touching", "oral", "penetration"],
  "dynamic": ["dominance", "submission", "switch"],
  "toy": ["vibrator", "plug", "rope", "restraint"],
  "risk": ["breath", "impact", "edge", "cnc"],
  "sensory": ["blindfold", "sensory_deprivation", "temperature"],
  "social": ["public", "voyeur", "exhibition", "group"]
}
```

**Umsetzung:**
- [ ] Tag-Vokabular definieren
- [ ] Alle Fragen mit Tags versehen
- [ ] Validierung: Tags müssen aus Vokabular sein

**Dateien:**
- `app/templates/*.json`
- `app/models.py` - Tag-Validierung hinzufügen

**Aufwand:** 3-4 Stunden

---

### Phase 3: Szenarien-Optimierung (Priorität: HOCH)

#### 3.1 Info-Karten für Szenarien

**Ziel:** Kontext und Risiken vor jeder Karte erklären

**Neues Schema:**
```json
{
  "id": "S01",
  "title": "...",
  "category": "...",
  "description": "...",
  "info_card": {
    "emotional_context": "Oft geht's um Vertrauen, Tabu, Kontrolle/Loslassen.",
    "typical_risks": "Scham, Druck, körperliche Reizung. Tempo und Sicherheit sind entscheidend.",
    "safety_gate": "Voraussetzungen: viel Zeit, Stopwort, keine Überraschungen."
  },
  "options": [...]
}
```

**Umsetzung:**
- [ ] Schema erweitern
- [ ] Frontend: Info-Card vor Szenario anzeigen
- [ ] Für alle 20 Szenarien ausfüllen

**Dateien:**
- `app/templates/scenarios.json`
- `web/app.js` - `renderScenarios()` erweitern

**Aufwand:** 4-5 Stunden (Content + Code)

---

#### 3.2 Deck-Struktur einführen

**Ziel:** Progression von Warm-Up zu High-Risk

**Neue Struktur:**
```json
{
  "decks": [
    {
      "id": "warmup",
      "name": "Deck 1: Warm-Up",
      "description": "Reden über Nähe, Initiation, Feedback, Aftercare, Grenzen.",
      "scenarios": ["S01", "S02", "S03", "S04"]
    },
    {
      "id": "roles",
      "name": "Deck 2: Rollen & Dynamik",
      "description": "Dominant/devot/switch, Kontrolle abgeben/nehmen.",
      "scenarios": ["S05", "S06", "S07"]
    },
    {
      "id": "curiosity",
      "name": "Deck 3: Neugier & Tabu",
      "description": "Neue Settings, Spielzeuge, Beobachten/Beobachtet werden.",
      "scenarios": ["S08", "S09", "S10"]
    },
    {
      "id": "highrisk",
      "name": "Deck 4: High-Risk",
      "description": "Themen mit höherem körperlichen/psychischen Risiko.",
      "scenarios": ["S11", "S12", "S13"],
      "requires_safety_gate": true
    }
  ]
}
```

**Umsetzung:**
- [ ] Szenarien in Decks gruppieren
- [ ] Frontend: Deck-Navigation
- [ ] Progression: Deck 1 → 2 → 3 → 4

**Dateien:**
- `app/templates/scenarios.json`
- `web/app.js` - Deck-Navigation

**Aufwand:** 3-4 Stunden

---

#### 3.3 Sicherheits-Gates für High-Risk

**Ziel:** High-Risk Szenarien nur mit Voraussetzungen spielbar

**Umsetzung:**
- [ ] `safety_gate` Feld in Szenario-Schema
- [ ] Frontend: Gate-Check vor Anzeige
- [ ] Warnung wenn Gate nicht erfüllt

**Beispiel:**
```json
{
  "safety_gate": {
    "required": ["safeword_agreed", "time_available", "no_surprises"],
    "message": "Dieses Szenario erfordert: Safeword vereinbart, genug Zeit, keine Überraschungen."
  }
}
```

**Dateien:**
- `app/templates/scenarios.json`
- `web/app.js` - Gate-Check

**Aufwand:** 2-3 Stunden

---

#### 3.4 Bedingungen-Feld für Szenarien

**Ziel:** C-Optionen können spezifische Bedingungen haben

**Neues Schema:**
```json
{
  "options": [
    {
      "id": "C",
      "label": "Vielleicht, als vorsichtiger Test (mit Bedingungen)",
      "risk_type": "negotiation",
      "conditions_field": true  // Zeigt Textfeld für Bedingungen
    }
  ]
}
```

**Umsetzung:**
- [ ] Schema erweitern
- [ ] Frontend: Textfeld bei C-Option
- [ ] Vergleich: Bedingungen zusammenführen

**Dateien:**
- `app/templates/scenarios.json`
- `web/app.js` - Bedingungen-Feld
- `app/compare.py` - Bedingungen in Vergleich

**Aufwand:** 2-3 Stunden

---

### Phase 4: UX & Ergebnis-Darstellung (Priorität: MITTEL)

#### 4.1 Info-Cards vor Modulen

**Ziel:** Mindset für jeden Abschnitt setzen

**Umsetzung:**
- [ ] Modul-Description als Info-Card prominent anzeigen
- [ ] Optional: Mindset-Hinweise für sensible Module
- [ ] CSS: `.module-info-card` mit auffälligem Styling

**Beispiel:**
```
┌─────────────────────────────────────┐
│ 🎯 Rollen & Kontrolle               │
│                                     │
│ Machtabgabe erfordert hohes         │
│ Vertrauen. Alles ist jederzeit      │
│ widerrufbar.                        │
└─────────────────────────────────────┘
```

**Dateien:**
- `web/app.js` - `buildForm()` erweitern
- `web/styles.css` - Info-Card Styling

**Aufwand:** 2-3 Stunden

---

#### 4.2 Action Plan Algorithmus verbessern

**Ziel:** Diversere, ausgewogenere Experiment-Vorschläge

**Aktuell:**
- Wählt Top 3 MATCH Items nach Score
- Versucht verschiedene Module

**Verbessert:**
- Tag-basierte Diversität (1x Soft, 1x Toy, 1x Kopfkino)
- Risk-Level Balance (nicht nur High-Risk)
- Comfort-Level Filter (beide >= 3)
- Optional: 4-Wochen-Plan mit Debrief-Log

**Umsetzung:**
- [ ] `_generate_action_plan()` erweitern
- [ ] Tag-Kategorien definieren
- [ ] UI: Action Plan besser darstellen

**Dateien:**
- `app/compare.py` - `_generate_action_plan()`
- `web/app.js` - Action Plan UI

**Aufwand:** 3-4 Stunden

---

#### 4.3 Validierung mit kontextuellen Hinweisen

**Ziel:** Bessere Fehlermeldungen und Warnungen

**Umsetzung:**
- [ ] Real-time Validierung während Eingabe
- [ ] Spezifische Fehlermeldungen (welche Frage, was ist falsch)
- [ ] Warnungen für häufige Fehler (z.B. "MAYBE ohne Bedingungen")
- [ ] Visual Feedback (rote Umrandung)

**Dateien:**
- `web/app.js` - `validateAndShowHints()` erweitern
- `app/routes.py` - `validate_responses()` spezifischer

**Aufwand:** 2-3 Stunden

---

## 📋 Priorisierte Umsetzungsreihenfolge

### Sprint 1 (Diese Woche) - Quick Wins
1. ✅ **Help-Texte bei Risk C prominent** (2-3h) - Sicherheitsrelevant
2. ✅ **Info-Cards vor Modulen** (2-3h) - Schnell, hoher Impact
3. ✅ **Mobile-Responsiveness** (2-3h) - Wird häufig genutzt

### Sprint 2 (Nächste Woche) - Content & Struktur
4. ✅ **High-Risk Granularität** (6-8h) - Wichtig für Sicherheit
5. ✅ **Rahmen & Logistik Modul** (3-4h) - Praktisch wichtig
6. ✅ **Review-Modul ausbauen** (2-3h) - Für Paare mit Historie

### Sprint 3 (Übernächste Woche) - Szenarien
7. ✅ **Info-Karten für Szenarien** (4-5h) - Kontext wichtig
8. ✅ **Deck-Struktur** (3-4h) - Progression
9. ✅ **Sicherheits-Gates** (2-3h) - Sicherheitsrelevant

### Sprint 4 (Später) - Advanced Features
10. ✅ **Conditional Logic erweitern** (4-5h) - Komplex
11. ✅ **Tags standardisieren** (3-4h) - Systematisch
12. ✅ **Action Plan verbessern** (3-4h) - Nice-to-have

---

## 🎨 Design-Prinzipien

### Für Fragebögen:
1. **"NEIN" ist final** - Kein Diskutieren/Überreden
2. **"VIELLEICHT" gilt nur unter Bedingungen** - Immer spezifizieren
3. **Fantasie ≠ Wunsch ≠ Identität** - Klar trennen
4. **Sicherheit vor Spaß** - Risk C immer prominent warnen
5. **Progression** - Von einfach zu komplex

### Für Szenarien:
1. **Kontext vor Inhalt** - Info-Karten erklären "Warum"
2. **Sicherheits-Gates** - High-Risk nur mit Voraussetzungen
3. **Deck-Progression** - Warm-Up → High-Risk
4. **Bedingungen explizit** - C-Optionen müssen spezifiziert werden
5. **4-Optionen konsistent** - A/B/C/D immer gleich

---

## 📊 Erfolgsmetriken

**Qualitativ:**
- Nutzer verstehen Kontext besser (Info-Karten)
- Weniger "Überraschungs"-Probleme (Sicherheits-Gates)
- Klarere Grenzen (High-Risk Granularität)
- Bessere Reflektion (Review-Modul)

**Quantitativ:**
- Reduktion von "BOUNDARY" Konflikten (durch Granularität)
- Erhöhung von "MATCH" Items (durch bessere Fragen)
- Weniger unvollständige Antworten (durch Validierung)
- Höhere Completion-Rate (durch bessere UX)

---

## 🔗 Verwandte Dokumente

- `NEXT_OPTIMIZATIONS.md` - Priorisierte Liste der nächsten Optimierungen
- `VERBESSERUNGSPLAN_KURZ.md` - Executive Summary dieses Plans
- `VERBESSERUNGSBEISPIELE.md` - Vorher/Nachher Beispiele für geplante Änderungen
- `docs/PSYCHOLOGIE_LEITFADEN.md` - Wissenschaftliche Grundlagen
- `docs/FORSCHUNG_ZITATE.md` - Peer-reviewed Studien und Quellen

**Hinweis:** Der frühere `OPTIMIERUNGSPLAN.md` wurde in dieses Dokument integriert und konsolidiert.

---

## 📝 Notizen

- Alle Optimierungen sollten **rückwärtskompatibel** sein
- Tests sollten für kritische Änderungen geschrieben werden
- Dokumentation sollte bei neuen Features aktualisiert werden
- Content-Änderungen sollten mit Fachpersonen abgestimmt werden

---

**Nächste Schritte:**
1. Review dieses Plans mit Team/Stakeholdern
2. Sprint 1 starten (Quick Wins)
3. Content-Review für High-Risk Granularität
4. User Testing nach Sprint 1


