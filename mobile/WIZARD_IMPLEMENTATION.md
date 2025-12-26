# Wizard/Stepper Questionnaire Implementation

## Übersicht

Die Fragebogen-UI wurde komplett umgebaut zu einem modernen Wizard/Stepper-Interface mit folgenden Features:

### ✨ Features

1. **Eine Frage pro Screen** - Fokussierte, übersichtliche Darstellung
2. **Navigation** - Weiter/Zurück Buttons mit intelligenter Validierung
3. **Fortschrittsanzeige** - "Frage X von Y" + Progress Bar
4. **Startscreen** - Übersicht über Template und Fragenanzahl
5. **Summary Page** - Zusammenfassung aller Antworten vor Absenden
6. **Mobile-First Design** - Große Touch-Ziele, klare Typografie
7. **Auto-Save** - Antworten werden automatisch persistiert
8. **Validierung** - Required-Felder mit klaren Fehlermeldungen

---

## 🏗️ Architektur

### Neue Dateien

```
mobile/widgets/
├── wizard_state.py          # Wizard-Logik und Navigation
├── question_widgets.py      # Frage-Komponenten für alle Typen
└── wizard_screens.py        # UI-Komponenten (Start, Question, Summary)

mobile/screens/
└── session_form.py          # ✨ Komplett überarbeitet
```

### Komponenten-Hierarchie

```
SessionFormScreen
├── WizardStartScreen (Startseite)
├── QuestionPage (Fragen-Ansicht)
│   ├── ProgressHeader (Fortschritt)
│   ├── QuestionWidget (dynamisch je nach Typ)
│   └── NavigationBar (Zurück/Weiter)
└── SummaryPage (Zusammenfassung)
```

---

## 📋 Unterstützte Fragetypen

### 1. Scale Questions (`scale_0_10`)

- **UI**: Großer Slider mit Wert-Anzeige
- **Validierung**: Wert zwischen 0-10 erforderlich
- **Mobile-optimiert**: Touch-friendly Slider

```json
{
  "id": "Q1",
  "schema": "scale_0_10",
  "label": "Wie zufrieden bist du?",
  "help": "0 = gar nicht, 10 = sehr zufrieden"
}
```

### 2. Text Questions (`text`)

- **UI**: Multiline TextInput mit Zeichenzähler
- **Validierung**: Nicht-leerer Text (wenn required)
- **Mobile-optimiert**: Große Textfläche

```json
{
  "id": "Q2",
  "schema": "text",
  "label": "Beschreibe deine Erfahrung",
  "required": true
}
```

### 3. Enum Questions (`enum`)

- **UI**: Große Button-Liste
- **Validierung**: Eine Option muss gewählt werden
- **Mobile-optimiert**: 60dp hohe Touch-Targets

```json
{
  "id": "Q3",
  "schema": "enum",
  "label": "Welche Option passt?",
  "options": ["Option A", "Option B", "Option C"]
}
```

### 4. Consent Rating (`consent_rating`)

- **UI**: 3 große Buttons (Ja / Vielleicht / Nein)
- **Validierung**: Eine Auswahl erforderlich
- **Mobile-optimiert**: Farbcodiert (Grün/Gelb/Rot)

```json
{
  "id": "Q4",
  "schema": "consent_rating",
  "label": "Bist du damit einverstanden?"
}
```

---

## 🔄 Wizard Flow

```
Session erstellen
    ↓
Person auswählen (A/B)
    ↓
Wizard Startscreen
    ↓
Frage 1 ────→ Weiter ────→ Frage 2 ────→ ... ────→ Frage N
    ↑             ↓             ↑                       ↓
    └────────── Zurück ─────────┘                       ↓
                                                         ↓
                                                 Summary Page
                                                         ↓
                                                  Absenden
                                                         ↓
                                                   Dashboard
```

---

## 💾 State Management

### WizardState Klasse

Verwaltet:
- Aktuellen Fragenindex
- Navigation (vor/zurück)
- Validierung
- Fortschrittsberechnung
- Flattening der Template-Struktur

**Beispiel:**

```python
wizard = WizardState(template, responses)

# Navigation
wizard.can_go_next()  # False wenn nicht validiert
wizard.go_next()      # Zur nächsten Frage
wizard.go_back()      # Zur vorherigen Frage

# Progress
wizard.progress_text       # "Frage 3 von 12"
wizard.progress_percentage # 0.25 (25%)

# Validierung
wizard.get_validation_error()  # "Bitte beantworte diese Frage"
```

### Integration mit AppStore

Alle Antworten werden direkt in `app_store.form_responses` gespeichert:

```python
# Bei Antwort-Änderung
app_store.update_response(question_id, value)
# → Auto-Save wird nach 5 Sekunden ausgelöst
```

---

## 🎨 Mobile-First Design

### Touch-Targets

- **Buttons**: Minimum 48dp Höhe
- **Enum-Optionen**: 60dp Höhe
- **Person-Auswahl**: 70dp Höhe
- **Slider**: 60dp Touch-Bereich

### Typografie

- **Fragen**: 18sp, fett
- **Hilfe-Text**: 14sp, grau
- **Navigation**: 16-18sp
- **Titel**: 22-24sp

### Farben

- **Primary**: `#3399CC` (0.2, 0.6, 0.8)
- **Success**: `#33B34D` (0.2, 0.7, 0.3)
- **Warning**: `#FFAA33` (1.0, 0.7, 0.2)
- **Error**: `#E64D4D` (0.9, 0.3, 0.3)
- **Neutral**: `#B3B3B3` (0.7, 0.7, 0.7)

---

## ✅ Validierung

### Required Fields

Jede Frage kann `required: true` haben. Der "Weiter"-Button ist dann disabled, bis eine gültige Antwort vorliegt.

**Validierungsregeln:**

- **scale_0_10**: Wert muss gesetzt sein (0-10)
- **text**: Text darf nicht leer sein
- **enum**: Eine Option muss gewählt sein
- **consent_rating**: Ja/Vielleicht/Nein muss gewählt sein

**Fehlerbehandlung:**

```python
# Validation Error wird unter dem Navigationsbutton angezeigt
"Bitte beantworte diese Frage"
"Bitte gib eine Antwort ein"
```

---

## 🧪 Testing

### Unit Tests

```bash
cd /home/user/gamex/mobile
python3 test_wizard.py
```

Testet:
- Navigation (vor/zurück)
- Validierung (required fields)
- Progress-Berechnung
- Summary-Generierung

### Desktop Testing

```bash
cd /home/user/gamex/mobile
python3 main.py
```

Testet die vollständige App in einem 360x640px Fenster.

### Android APK Build

```bash
cd /home/user/gamex/mobile
buildozer android debug
```

---

## 📊 Änderungen vs. Alte Implementierung

### Vorher ❌

- Alle Fragen untereinander in ScrollView
- Keine Navigation
- Kein Fortschrittsindikator
- Keine Validierung
- Nur Platzhalter-Code
- Nicht mobile-optimiert

### Nachher ✅

- Eine Frage pro Screen
- Weiter/Zurück Navigation
- Progress Bar + "Frage X von Y"
- Validierung für alle Typen
- Vollständig implementiert
- Mobile-First Design
- Startscreen + Summary
- Auto-Save Integration

---

## 🚀 Usage

### Fragebogen starten

1. **Dashboard** → "Neue Session" oder existierende Session auswählen
2. **Person auswählen**: A oder B
3. **Startscreen**: Übersicht → "Fragebogen starten"
4. **Fragen beantworten**: Eine nach der anderen
5. **Summary**: Alle Antworten prüfen
6. **Absenden**: Fertig!

### Zurück-Navigation

- **Während Fragen**: "Zurück"-Button navigiert zur vorherigen Frage
- **Im Startscreen**: "←"-Button oben links → Person-Auswahl
- **Antworten bleiben erhalten**: Auto-Save speichert alles

---

## 🔧 Technische Details

### Dependencies

- **Kivy 2.3.0**: UI Framework
- **Python 3.9+**: Runtime
- **Pydantic 2.10.3**: Data validation (Backend)

### Performance

- **Lazy Loading**: Fragen werden nur bei Bedarf gerendert
- **Auto-Save**: Debounced (5 Sekunden)
- **Memory**: Wizard State hält alle Fragen im RAM (max ~500 KB)

### Persistierung

```python
# Responses werden in SQLite gespeichert
# Tabelle: responses
# Columns: session_id, person, json, updated_at

# Bei App-Neustart werden Antworten automatisch geladen
```

---

## 📝 Code-Qualität

### Modularität

- **WizardState**: Business Logic (keine UI)
- **QuestionWidgets**: UI-Komponenten (wiederverwendbar)
- **WizardScreens**: Screen-Logik
- **SessionFormScreen**: Integration

### Testbarkeit

- WizardState ist vollständig testbar ohne Kivy
- Alle Komponenten haben klare Interfaces
- Mock-freundlich

### Wartbarkeit

- Klare Trennung von Concerns
- Type Hints überall
- Docstrings für alle Public Methods
- Keine Magic Numbers

---

## 🎯 Nächste Schritte (Optional)

### Erweiterungen

1. **Fragen-Suche**: Springe direkt zu einer Frage
2. **Favoriten**: Markiere wichtige Fragen
3. **Multi-Language**: i18n für Labels
4. **Accessibility**: Screen Reader Support
5. **Themes**: Light/Dark Mode
6. **Export**: PDF-Export der Summary

### Weitere Fragetypen

- **Date Picker**: Datums-Fragen
- **Multi-Select**: Mehrfachauswahl (enum)
- **Slider Range**: Min/Max Range
- **Image Upload**: Bild-Antworten
- **Audio Recording**: Sprach-Antworten

---

## 👨‍💻 Entwickler-Hinweise

### Neue Frage hinzufügen

1. **Template JSON erweitern**:
   ```json
   {
     "id": "NEW_Q",
     "schema": "scale_0_10",
     "label": "Neue Frage",
     "required": true
   }
   ```

2. **Neuer Fragetyp?** → `question_widgets.py` erweitern:
   ```python
   class MyCustomWidget(BaseQuestionWidget):
       def __init__(self, question, initial_value, on_change, **kwargs):
           super().__init__(question, initial_value, on_change, **kwargs)
           # Custom UI hier
   ```

3. **Factory registrieren**:
   ```python
   widget_map = {
       'my_custom': MyCustomWidget,
   }
   ```

---

## 📚 Weitere Dokumentation

- **Kivy Docs**: https://kivy.org/doc/stable/
- **Template Specs**: `/home/user/gamex/backend/app/templates/`
- **State Management**: `/home/user/gamex/mobile/store.py`

---

**Erstellt**: 2025-12-26
**Version**: 1.0.0
**Author**: Senior Frontend + Mobile-UX Engineer
