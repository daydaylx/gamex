# Optimierungsplan für den Fragebogen (Intimacy Tool)

Basierend auf der Analyse von `konzept-plan`, `plan` und dem aktuellen `default_template.json`.

## Zielsetzung
Der Fragebogen soll nicht nur Daten abfragen, sondern das **Gespräch strukturieren** und **Sicherheit geben**. Die Optimierung fokussiert sich auf Präzision, psychologische Sicherheit und direkte Umsetzbarkeit der Ergebnisse.

---

## Phase 1: Inhaltliche Schärfung (Content)

### 1.1 "High-Risk" Granularität erhöhen
Aktuell sind High-Risk Themen oft nur eine Frage (z.B. "Anal").
**Optimierung:** Aufsplitten in "Einstieg" vs. "Fortgeschritten".
*   *Beispiel Anal:*
    *   Q: "Anal: Äußerliche Stimulation / Massage" (Risk A)
    *   Q: "Anal: Spielzeug / Plugs (klein)" (Risk B)
    *   Q: "Anal: Penetration / Größeres Spielzeug" (Risk C)
*   *Warum:* Ein "Nein" zu Penetration heißt oft nicht "Nein" zu allem in dem Bereich.

### 1.2 "Soft Skills" & Logistik Modul ergänzen
Vor den sexuellen Praktiken sollten logistische und emotionale Rahmenbedingungen geklärt werden.
**Neues Modul: "Rahmen & Logistik"**
*   **Zeit:** "Wie viel Zeit brauchen wir mind. für Quality Time?" (30min, 2h, Open End)
*   **Stress:** "Wie gehen wir um, wenn einer gestresst ist?" (Absagen, nur Kuscheln, Ablenkung)
*   **Privatsphäre:** Konkrete Abfrage zu digitalen Spuren (Chats, Fotos).

### 1.3 Präzisere "Help"-Texte
Die Hilfetexte sollen als "Mini-Edu-Karten" fungieren.
*   *Status:* Aktuell oft kurz ("0=gar nicht").
*   *Soll:* Kontext geben. Z.B. bei "Würgespiele": *"ACHTUNG: Kehlkopf ist tabu. Nur seitlich. Sofortiges Stop-Signal vereinbaren."*
*   *Action:* Review aller Risk-B/C Fragen und Ergänzung von Sicherheitshinweisen direkt im Help-Text.

### 1.4 Review-Modul ausbauen
Das Modul "Bereits erlebt" ist essenziell für Paare mit Historie.
*   Ergänzung: "Was wollen wir *weniger* machen?" (Drop-List).
*   Ergänzung: "Was war ein Highlight, das wir wiederholen sollten?"

---

## Phase 2: Struktur & Logik (Schema)

### 2.1 Bedingte Sichtbarkeit (Conditional Logic)
Wenn jemand bei einem Oberthema (z.B. "Schmerzen/Impact") "Nein" sagt, sollten Detailfragen (Peitsche, Klemmen etc.) ausgeblendet oder übersprungen werden.
*   *Plan:* Schema-Erweiterung um `depends_on`: `{"question_id": "S01", "value": "YES/MAYBE"}`.
*   *Frontend:* UI muss Fragen dynamisch ein-/ausblenden.

### 2.2 Tags für Automatisierung
Die Tags (`tags: ["anal", "toy"]`) sind gut, aber noch nicht standardisiert.
*   *Optimierung:* Standard-Set definieren für bessere KI/Regel-Auswertung.
    *   Kategorien: `act` (Handlung), `dynamic` (Machtgefälle), `toy` (Objekt), `risk` (Sicherheit).

---

## Phase 3: UX & Ergebnis-Darstellung

### 3.1 "Info-Cards" vor Modulen
Statt nur einer Überschrift pro Modul, eine einleitende "Karte" anzeigen, die das Mindset für diesen Abschnitt setzt.
*   *Beispiel "Rollen":* "Hier geht es um Machtabgabe. Das erfordert hohes Vertrauen. Alles ist jederzeit widerrufbar."

### 3.2 4-Wochen-Plan Logik (im Compare-View)
Das Tool soll nicht nur Listen zeigen, sondern einen Fahrplan.
*   **Algorithmus:**
    1.  Nimm alle `MATCH` Items.
    2.  Sortiere nach `interest` (High to Low).
    3.  Wähle 3 Items aus unterschiedlichen Kategorien (z.B. 1x Soft, 1x Toy, 1x Kopfkino).
    4.  Schlage diese als "Fokus der nächsten Wochen" vor.

---

## Konkrete nächste Schritte (Action Plan)

1.  **JSON Update:** `default_template.json` überarbeiten (Phase 1).
2.  **Tagging Review:** Sicherstellen, dass alle Fragen sauber getaggt sind (für Phase 3.2).
3.  **Frontend Tweak:** Help-Texte prominenter darstellen (evtl. Icon oder dauerhaft sichtbar bei Risk C).
