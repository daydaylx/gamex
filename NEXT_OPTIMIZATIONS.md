# Nächste Optimierungen - Priorisierte Liste

Basierend auf der Analyse des aktuellen Codes und des OPTIMIERUNGSPLAN.md.

## 🚀 Quick Wins (Niedriger Aufwand, Hoher Impact)

### 1. **Info-Cards vor Modulen** (Phase 3.1 aus OPTIMIERUNGSPLAN)
**Status:** Nicht implementiert  
**Aufwand:** ~2-3 Stunden  
**Impact:** Hoch - verbessert UX und Kontextverständnis

**Was zu tun:**
- Modul-Description als Info-Card prominent anzeigen
- Optional: Mindset-Hinweise für sensible Module (z.B. "Rollen" → "Machtabgabe erfordert hohes Vertrauen")
- CSS: `.module-info-card` mit auffälligem Styling

**Dateien:**
- `web/app.js` - `buildForm()` Funktion erweitern
- `web/styles.css` - Styling für Info-Cards

---

### 2. **Help-Texte bei Risk C dauerhaft sichtbar machen**
**Status:** Teilweise (werden angezeigt, aber nicht prominent)  
**Aufwand:** ~1 Stunde  
**Impact:** Mittel-Hoch - Sicherheitshinweise sollten immer sichtbar sein

**Was zu tun:**
- Bei `risk_level === "C"` Help-Text nicht nur als Hint, sondern als Warnung-Banner
- Icon (⚠️) hinzufügen
- Eventuell kollabierbar, aber standardmäßig offen

**Dateien:**
- `web/app.js` - `renderConsentRating()` und andere Render-Funktionen
- `web/styles.css` - `.risk-c-warning` Styling

---

### 3. **Mobile-Responsiveness verbessern**
**Status:** Grundlegend vorhanden, aber verbesserbar  
**Aufwand:** ~2-3 Stunden  
**Impact:** Hoch - viele Nutzer nutzen Smartphones/Tablets

**Was zu tun:**
- Navigation-Sidebar auf Mobile als Drawer/Overlay
- Form-Felder besser für Touch optimieren
- Progress-Bar auf Mobile kompakter
- Buttons größer für Touch

**Dateien:**
- `web/styles.css` - Media Queries erweitern
- `web/app.js` - Mobile Navigation Toggle

---

## 🔧 Wichtige Features (Mittlerer Aufwand, Hoher Impact)

### 4. **Conditional Logic erweitern** (Phase 2.1 aus OPTIMIERUNGSPLAN)
**Status:** Grundfunktion vorhanden, aber limitiert  
**Aufwand:** ~4-5 Stunden  
**Impact:** Hoch - reduziert kognitive Belastung

**Aktueller Stand:**
- `depends_on` funktioniert für einfache Status-Checks
- Nur für `consent_rating` Status-Felder

**Was zu erweitern:**
- Support für `scale_0_10` Werte (z.B. "nur wenn Wert >= 5")
- Support für `enum` Werte
- Mehrere Bedingungen kombinieren (AND/OR)
- Cascade-Logik (Frage A versteckt B, B versteckt C)

**Dateien:**
- `web/app.js` - `updateVisibility()` erweitern
- `app/templates/*.json` - `depends_on` Schema dokumentieren

---

### 5. **Action Plan Algorithmus verbessern** (Phase 3.2 aus OPTIMIERUNGSPLAN)
**Status:** Implementiert, aber einfach  
**Aufwand:** ~3-4 Stunden  
**Impact:** Mittel-Hoch - macht Tool praktischer

**Aktueller Stand:**
- Wählt Top 3 MATCH Items nach Score
- Versucht verschiedene Module zu wählen

**Was zu verbessern:**
- Tag-basierte Diversität (1x Soft, 1x Toy, 1x Kopfkino)
- Risk-Level Balance (nicht nur High-Risk)
- Berücksichtigung von Comfort-Level (nur wenn beide Comfort >= 3)
- Optional: 4-Wochen-Plan mit Debrief-Log

**Dateien:**
- `app/compare.py` - `_generate_action_plan()` erweitern
- `web/app.js` - Action Plan UI verbessern

---

### 6. **Validierung mit kontextuellen Hinweisen**
**Status:** Grundfunktion vorhanden  
**Aufwand:** ~2-3 Stunden  
**Impact:** Mittel - verbessert Datenqualität

**Was zu verbessern:**
- Real-time Validierung während Eingabe (nicht nur beim Speichern)
- Bessere Fehlermeldungen mit konkreten Handlungsempfehlungen
- Warnungen für häufige Fehler (z.B. "MAYBE ohne Bedingungen")
- Visual Feedback (rote Umrandung bei Fehlern)

**Dateien:**
- `web/app.js` - `validateAndShowHints()` erweitern
- `app/routes.py` - `validate_responses()` könnte spezifischer sein

---

## 🎯 Content-Optimierungen (Aus OPTIMIERUNGSPLAN Phase 1)

### 7. **High-Risk Granularität erhöhen** (Phase 1.1)
**Status:** Nicht implementiert  
**Aufwand:** ~5-6 Stunden (Content-Arbeit)  
**Impact:** Hoch - wichtig für Sicherheit

**Was zu tun:**
- High-Risk Themen aufsplitten (z.B. "Anal" → 3 Fragen: Einstieg, Fortgeschritten, Penetration)
- Neue Fragen zu Templates hinzufügen
- Risk-Levels anpassen

**Dateien:**
- `app/templates/*.json` - Fragen erweitern
- Eventuell neues Template: `comprehensive_v2.json`

---

### 8. **"Rahmen & Logistik" Modul** (Phase 1.2)
**Status:** Nicht implementiert  
**Aufwand:** ~3-4 Stunden  
**Impact:** Mittel-Hoch - wichtig für praktische Umsetzung

**Was zu tun:**
- Neues Modul mit Fragen zu:
  - Zeit (Wie viel Zeit brauchen wir?)
  - Stress (Wie gehen wir um, wenn einer gestresst ist?)
  - Privatsphäre (Digitale Spuren, Chats, Fotos)
- Als erstes Modul im Template platzieren

**Dateien:**
- `app/templates/*.json` - Neues Modul hinzufügen

---

### 9. **Review-Modul ausbauen** (Phase 1.4)
**Status:** Teilweise vorhanden  
**Aufwand:** ~2-3 Stunden  
**Impact:** Mittel - wichtig für Paare mit Historie

**Was zu erweitern:**
- "Was wollen wir weniger machen?" (Drop-List)
- "Was war ein Highlight, das wir wiederholen sollten?"
- Optional: Debrief-Log für Experimente

**Dateien:**
- `app/templates/*.json` - Review-Modul erweitern
- Eventuell neues Schema: `review_rating`

---

## ⚡ Performance & Technische Verbesserungen

### 10. **Frontend Performance bei großen Formularen**
**Status:** Funktioniert, aber könnte schneller sein  
**Aufwand:** ~3-4 Stunden  
**Impact:** Mittel - wichtig bei 100+ Fragen

**Probleme:**
- `collectForm()` wird bei jedem Input-Event aufgerufen
- `updateVisibility()` läuft bei jeder Änderung
- Navigation wird komplett neu gerendert

**Optimierungen:**
- Debouncing für `collectForm()` (bereits teilweise vorhanden)
- Virtual Scrolling für große Formulare
- Lazy Loading von Modulen (nur sichtbare Module rendern)
- Memoization für `updateVisibility()`

**Dateien:**
- `web/app.js` - Performance-Optimierungen

---

### 11. **Backend Validierung optimieren**
**Status:** Funktioniert, aber könnte spezifischer sein  
**Aufwand:** ~2 Stunden  
**Impact:** Mittel - bessere Fehlermeldungen

**Was zu verbessern:**
- Spezifischere Fehlermeldungen (welche Frage, was ist falsch)
- Validierung für Dom/Sub und Active/Passive Varianten
- Bessere Handling von fehlenden Feldern

**Dateien:**
- `app/routes.py` - `validate_responses()` erweitern

---

### 12. **Logging & Monitoring**
**Status:** Grundlegend vorhanden (Logs-Ordner)  
**Aufwand:** ~2-3 Stunden  
**Impact:** Niedrig-Mittel - wichtig für Debugging

**Was zu hinzufügen:**
- Strukturiertes Logging (nicht nur Error-Logs)
- Performance-Metriken (wie lange dauert Compare?)
- Optional: Analytics für häufig genutzte Features

**Dateien:**
- `app/routes.py` - Logging hinzufügen
- `app/compare.py` - Timing-Logs
- Eventuell `app/logging.py` Modul

---

## 📊 Priorisierungsempfehlung

### Sofort umsetzen (Diese Woche):
1. **Info-Cards vor Modulen** (#1) - Schnell, hoher Impact
2. **Help-Texte bei Risk C** (#2) - Sicherheitsrelevant
3. **Mobile-Responsiveness** (#3) - Wird häufig genutzt

### Nächste Woche:
4. **Conditional Logic erweitern** (#4) - Wichtig für UX
5. **Action Plan verbessern** (#5) - Macht Tool praktischer

### Content-Arbeit (Parallel):
6. **High-Risk Granularität** (#7) - Wichtig, aber Content-Arbeit
7. **Rahmen & Logistik Modul** (#8) - Praktisch wichtig

### Performance (Bei Bedarf):
8. **Frontend Performance** (#10) - Nur wenn Formulare sehr groß werden

---

## 🎨 Nice-to-Have (Später)

- **Export als PDF** (statt nur Markdown/JSON)
- **Template-Editor UI** (statt JSON manuell editieren)
- **Session-Vergleich** (Vergleich zwischen verschiedenen Sessions)
- **Offline-Support** (Service Worker für PWA)
- **Multi-Language Support** (i18n)

---

## 📝 Notizen

- Alle Optimierungen sollten rückwärtskompatibel sein
- Tests sollten für kritische Änderungen geschrieben werden
- Dokumentation sollte bei neuen Features aktualisiert werden

