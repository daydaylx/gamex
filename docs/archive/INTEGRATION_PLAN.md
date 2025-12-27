# Plan: Integration in Unified Interview Mode

**Ziel:** Alle Funktionen (Szenarien, Fragebögen, Decks) in einer einzigen "Interview"-Oberfläche zentralisieren.

## 1. Architektur: Der "Master Controller"

Wir erstellen einen neuen `UnifiedInterviewScreen`, der als zentrale Steuereinheit fungiert. Er verwaltet den Zustand der Session und wechselt nahtlos zwischen verschiedenen Inhalten.

### Phasen des Interviews:
1.  **👋 Check-in:** Kurzes Warm-up (die bestehenden 12 Basis-Fragen).
2.  **🧭 Dashboard (Topic Selector):** Ein visuelles Menü zur Auswahl des nächsten Schritts:
    *   **Szenarien-Decks** (aus `scenarios.json`)
    *   **Themen-Module** (aus Fragebögen)
    *   **Deep Dives** (Spezialthemen)
3.  **💬 Active Play:** Der eigentliche Frage-Antwort-Flow (im "Zen Mode").
4.  **🏁 Summary:** Abschluss und Auswertung.

## 2. Technische Umsetzung

### Schritt A: Komponenten-Refactoring
Die bestehenden Komponenten (`QuestionnaireForm`, `ScenariosView`) müssen so angepasst werden, dass sie nicht mehr als alleinstehende Seiten, sondern als "Sub-Views" funktionieren:
*   Sie müssen `onComplete` Callbacks akzeptieren, um die Kontrolle an den Master-Controller zurückzugeben.
*   Sie müssen den "Zen Mode" Header vom Parent akzeptieren oder integrieren.

### Schritt B: `UnifiedInterviewScreen.tsx`
Eine neue Komponente, die:
*   Alle Datenquellen lädt (`interview_scenarios.json`, `scenarios.json`, `templates`).
*   Den Session-Fortschritt speichert.
*   Ein einheitliches UI-Gerüst (Header, Background) bietet.

### Schritt C: Routing Anpassung
*   Die Route `/sessions/:id/interview/:person` wird auf den neuen Unified Screen zeigen.
*   `SessionView` wird vereinfacht und dient nur noch als Einstiegspunkt ("Lobby").

## 3. UI/UX Vision
*   **"Chat-Feeling":** Alles fühlt sich an wie ein fortlaufendes Gespräch.
*   **Keine Sackgassen:** Nach jedem Modul landet man wieder im Dashboard oder bekommt einen Vorschlag für das nächste Modul.
*   **Konsistenz:** Egal ob Szenario oder Fragebogen – die Bedienung (Swipe, Klick) bleibt gleich.

## 4. Zeitplan
1.  `UnifiedInterviewScreen` Gerüst erstellen.
2.  Dashboard-Komponente bauen.
3.  `ScenariosView` integrieren.
4.  `QuestionnaireForm` integrieren.
5.  Routing umstellen.
