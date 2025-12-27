# UI/UX Changelog - 27.12.2025

## 🎨 Design-Overhaul: "Zen Mode" & Dark Theme Harmonisierung

### 1. Probleme (Analyse)
- **Formular-Charakter:** Explizite Zähler ("Frage 15/200") erzeugten Leistungsdruck.
- **Farb-Dissonanz:** Standard-Tailwind-Farben (grelles Blau/Rot) bissen sich mit dem hochwertigen Dark Theme.
- **Layout-Probleme:** 2-Spalten-Layout bei Szenarien war auf Mobile zu eng für längere Texte.

### 2. Implementierte Lösungen

#### A. "Zen Mode" (Questionnaire & Scenarios)
- **Zähler entfernt:** Keine "Frage X von Y" Anzeige mehr im Haupt-View.
- **Subtiler Fortschritt:** Fortschrittsbalken als 1px Linie am oberen Bildschirmrand (Fixed Position).
- **Fokus auf Phase:** Statt Zahlen wird die aktuelle Phase (z.B. "Erkundung") angezeigt.

#### B. Semantisches Farbsystem
- Neue CSS-Variablen in `index.css` definiert:
  - `--color-phase-foundation`: Muted Blue
  - `--color-phase-exploration`: Muted Emerald
  - `--color-phase-expert`: Muted Red
- Farben nutzen nun Transparenz (`bg-blue-500/80`), um sich besser in den dunklen Hintergrund zu integrieren.

#### C. Mobile Layout Fixes
- **ScenariosView:** `grid-cols-1` auf Mobile (volle Breite für Text), `grid-cols-2` ab Tablet.
- **Header:** Vereinfacht, weniger "Rauschen", Fokus auf Inhalt.

### 3. Status
- ✅ Änderungen in `index.css`, `QuestionnaireForm.tsx`, `ScenariosView.tsx` angewendet.
- ✅ Build erfolgreich (`npm run build`).