# Nächste Optimierungen - Priorisierte Liste

Basierend auf der Analyse des aktuellen Codes und des `ANALYSE_UND_VERBESSERUNGSPLAN.md`.

## 🚀 Status Update (27.01.2025)

Viele Punkte aus dem ursprünglichen Plan wurden bereits umgesetzt. Der Fokus liegt nun auf der Finalisierung und Qualitätssicherung.

## 🛠️ Ausstehende Aufgaben

### 1. **Tag-Validierung implementieren**
**Status:** Ausstehend
**Priorität:** Hoch
**Beschreibung:** Sicherstellen, dass nur definierte Tags in den Templates verwendet werden, um die Datenqualität für die Auswertung (Action Plan, KI) zu sichern.
**Was zu tun:**
- Tag-Vokabular in `app/models.py` definieren.
- Validierungslogik beim Laden der Templates oder in Tests hinzufügen.

### 2. **Templates Konsistenz prüfen**
**Status:** In Arbeit (Sync erledigt)
**Priorität:** Mittel
**Beschreibung:** Sicherstellen, dass alle Templates (`default`, `psycho_enhanced`, `unified`) die neuen Strukturen (Logistik, Review) nutzen und korrekt getaggt sind.

### 3. **Offline-Modus Testen**
**Status:** Sync erledigt, Test steht aus
**Priorität:** Mittel
**Beschreibung:** Prüfen, ob die synchronisierten Templates im Offline-Modus (ohne Backend) korrekt geladen werden.

## ✅ Abgeschlossene Aufgaben (Highlights)

- **Content:** High-Risk Granularität erhöht (Anal, Breathplay etc. aufgesplittet).
- **Module:** Logistik-Modul und Review-Modul hinzugefügt.
- **UX:** Info-Cards vor Modulen und Szenarien implementiert.
- **Sicherheit:** Risk-C Warnungen und Sicherheits-Gates für Szenarien implementiert.
- **Logik:** `scale_0_10` Bedingungen für `depends_on` implementiert.
- **Szenarien:** Deck-Struktur (Warmup -> High-Risk) eingeführt.
- **Action Plan:** Algorithmus verbessert (Berücksichtigung von Tags und Risk-Levels).

## 📝 Backlog (Nice-to-Have)

- **Export als PDF** (statt nur Markdown/JSON)
- **Template-Editor UI** (statt JSON manuell editieren)
- **Session-Vergleich** (Vergleich zwischen verschiedenen Sessions)
- **Multi-Language Support** (i18n)
