# Analyse und Verbesserungsplan: Fragebögen & Szenarien

**Erstellt:** 2025-01-27  
**Aktualisiert:** 2025-01-27
**Projekt:** Intimacy Questionnaire Tool (GameX)  
**Fokus:** Optimierung der Fragebögen-Templates und Szenarien-Karten

---

## 📊 Executive Summary

Das Projekt ist ein **local-first Intimacy Tool** für Paare, die getrennt Fragebögen ausfüllen, Antworten vergleichen und Reports generieren. Die Analyse zeigt:

**Status (Updates):**
- ✅ **Phase 1 (Content):** High-Risk Granularität, Logistik-Modul und Review-Modul sind in `default_template.json` und `psycho_enhanced_v3.json` implementiert.
- ✅ **Phase 2 (Logik):** `scale_0_10` Bedingungen und erweiterte Compare-Logik sind implementiert. Tag-Validierung steht noch aus.
- ✅ **Phase 3 (Szenarien):** Deck-Struktur und Sicherheits-Gates sind in `scenarios.json` und im Frontend implementiert.
- ✅ **Phase 4 (UX):** Info-Cards und Risk-C-Warnungen sind implementiert.

**Verbesserungspotenzial (Verbleibend):**
- ⚠️ Tag-Validierung in `models.py` fehlt noch.
- ⚠️ Template-Synchronisation für Offline-Modus (erledigt).

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
- **Status: BEHOBEN** (in `default_template.json` und `psycho_enhanced_v3.json`)

**Problem 2: Fehlende Logistik-Module**
- **Status: BEHOBEN** (Modul `logistics` hinzugefügt)

**Problem 3: Help-Texte unzureichend**
- **Status: BEHOBEN** (Risk C Warnungen im Frontend implementiert)

**Problem 4: Conditional Logic limitiert**
- **Status: BEHOBEN** (Frontend unterstützt nun `scale_0_10` Bedingungen)

**Problem 5: Review-Modul unvollständig**
- **Status: BEHOBEN** (Modul `review` erweitert)

#### 1.3 Content-Qualität

**Gut:**
- Psychologische Module (v3) sind wissenschaftlich fundiert
- Tags sind vorhanden, aber nicht standardisiert
- Module-Beschreibungen geben Kontext

**Verbesserungswürdig:**
- Info-Cards vor Modulen fehlen (nur Beschreibung) -> **Status: BEHOBEN**
- Sicherheitshinweise nicht prominent genug -> **Status: BEHOBEN**
- Keine "Mini-Edu-Karten" für komplexe Themen

---

### 2. Szenarien-Struktur

#### 2.1 Aktuelle Szenarien-Architektur

**Vorhanden:**
- 20 Szenarien in `scenarios.json`
- 4-Optionen-System: A (Nein), B (Fantasie), C (Test), D (Ja)
- Kategorien: Public/Voyeur, Power Dynamics, Digital/Privacy, etc.

#### 2.2 Identifizierte Probleme

**Problem 1: Fehlende Info-Karten**
- **Status: BEHOBEN** (`info_card` Feld hinzugefügt)

**Problem 2: Keine Sicherheits-Gates**
- **Status: BEHOBEN** (`safety_gate` Feld und Deck-Logik hinzugefügt)

**Problem 3: Keine Deck-Struktur**
- **Status: BEHOBEN** (Decks `warmup`, `roles`, `curiosity`, `highrisk` definiert)

**Problem 4: Risk-Type Mapping unklar**
- `risk_type` in Options, aber nicht konsistent
- Vergleichslogik nutzt `risk_type` nur teilweise
- **Impact:** Unklare Auswertung

**Problem 5: Fehlende Bedingungen-Felder**
- Options haben keine expliziten "Bedingungen"
- **Impact:** C-Optionen können nicht spezifiziert werden

---

## 🎯 Verbesserungsplan (Aktualisiert)

### Phase 1: Content-Optimierung (Abgeschlossen ✅)

#### 1.1 High-Risk Granularität erhöhen ✅
- Implementiert in `default_template.json` und `psycho_enhanced_v3.json`.

#### 1.2 "Rahmen & Logistik" Modul hinzufügen ✅
- Modul `logistics` implementiert.

#### 1.3 Help-Texte bei Risk C prominent machen ✅
- Frontend zeigt Warn-Banner bei Risk C.

#### 1.4 Review-Modul ausbauen ✅
- Modul `review` erweitert.

---

### Phase 2: Struktur & Logik (Teilweise ✅)

#### 2.1 Conditional Logic erweitern ✅
- Frontend `evaluateDependency()` unterstützt `scale_0_10`.

#### 2.2 Tags standardisieren (Ausstehend ⚠️)

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
- [ ] Validierung in `app/models.py` hinzufügen

**Aufwand:** 1-2 Stunden

---

### Phase 3: Szenarien-Optimierung (Abgeschlossen ✅)

#### 3.1 Info-Karten für Szenarien ✅
- `info_card` Schema implementiert und genutzt.

#### 3.2 Deck-Struktur einführen ✅
- `decks` Array in `scenarios.json` implementiert.

#### 3.3 Sicherheits-Gates für High-Risk ✅
- `safety_gate` und `requires_safety_gate` implementiert.

#### 3.4 Bedingungen-Feld für Szenarien
- Noch nicht vollständig im Frontend als Freitextfeld, aber Logik vorbereitet.

---

### Phase 4: UX & Ergebnis-Darstellung (Großteils ✅)

#### 4.1 Info-Cards vor Modulen ✅
- Implementiert (`renderModuleInfoCard`).

#### 4.2 Action Plan Algorithmus verbessern ✅
- Implementiert in `compare.py` (`_generate_action_plan`).

#### 4.3 Validierung mit kontextuellen Hinweisen ✅
- Frontend Validierung verbessert.

---

## 📋 Nächste Schritte

1. **Tag Validierung implementieren** (Phase 2.2)
2. **Offline-Sync sicherstellen** (Erledigt: Templates kopiert)
3. **Tests durchführen**

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
