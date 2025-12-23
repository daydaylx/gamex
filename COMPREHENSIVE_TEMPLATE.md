# Umfassender Intimität & BDSM Fragebogen

## Übersicht

Das `comprehensive_v1` Template ist ein umfassender Fragebogen mit über 500 Fragen zu Sexualität, BDSM, Grenzen und Kommunikation. Es kombiniert Inhalte aus:

- GentleDom Neigungsfragebogen (Version 2.2)
- QueerTopia "Ja, Nein, Vielleicht" Liste
- Gamex Intimität & Grenzen Fragebogen (v2)

## Struktur

Das Template besteht aus 17 Modulen:

1. **Rahmen, Kommunikation & Gesundheit** (`frame`)
   - Persönliche Werte, Kommunikation, Beziehungsformen, digitale Privatsphäre

2. **Gesundheit & Sicherheit** (`health`)
   - Medizinische Einschränkungen, Safeword, Aftercare, Konsens

3. **Rollen & Identität** (`roles`)
   - BDSM-Rollen, Erfahrung, Häufigkeit, Identität

4. **Körper & Nähe** (`body`)
   - Küssen, Kuscheln, Berührungen, Nacktheit

5. **Sexuelle Praktiken - Basis** (`sex_basic`)
   - Vulva, Penis, Hoden, manuelle Stimulation

6. **Anal (Granular)** (`sex_anal`)
   - Analbereich, Rimming, Spielzeuge, Penetration
   - ⚠️ WICHTIG: Hygiene & Vorbereitung sind Pflicht

7. **Oralsex & Mund** (`oral`)
   - Oralverkehr, Ejakulat, Körperflüssigkeiten

8. **BDSM: Macht & Kontrolle** (`bdsm_power`)
   - Befehle, Gehorsam, Erniedrigung, Orgasmuskontrolle

9. **BDSM: Impact & Schmerz** (`bdsm_impact`)
   - Spanking, Impact Tools, Körperzonen, Schmerzlust

10. **BDSM: Bondage** (`bdsm_bondage`)
    - Soft Bondage, feste Bondage, Sinnesentzug, Gag

11. **BDSM: Sensation Play** (`bdsm_sensation`)
    - Temperatur, Elektro, Nadelspiele
    - ⚠️ HIGH RISK: Nadelspiele erfordern sterile Instrumente

12. **Fetische & Materialien** (`fetish`)
    - Materialien, Rollenspiele, Sexspielzeug, Safer Sex

13. **Atemkontrolle & High-Risk** (`breathplay`)
    - ⚠️ EXTREM RISIKOREICH: Kann zu schweren Verletzungen oder Tod führen!

14. **Öffentlichkeit & Gruppen** (`public`)
    - Exhibitionismus, Voyeurismus, Gruppensex, Dreier

15. **Extreme Praktiken** (`extreme`)
    - ⚠️ WARNUNG: Extrem risikoreich, erfordert Profi-Wissen

16. **Emotionen & Beziehung** (`emotions`)
    - Beziehungsformen, emotionale Bedürfnisse, Intensität

17. **Review & Ausblick** (`review`)
    - Wiederholungswünsche, Highlights, Notizen

## Antwortformate

### Standard consent_rating
Für die meisten Fragen: Status (YES/MAYBE/NO/HARD_LIMIT), Interesse (0-4), Komfort (0-4), Bedingungen, Notizen.

### Dom/Sub Varianten
Fragen mit `has_dom_sub: true` zeigen zwei Spalten:
- **Dominant (Dom)**: Status, Interesse, Komfort
- **Submissiv (Sub)**: Status, Interesse, Komfort

Die 7-Punkte-BDSM-Skala wird automatisch auf consent_rating gemappt:
- 1-2 → YES (interest 4, comfort 4)
- 3 → YES (interest 3, comfort 3)
- 4 → MAYBE (interest 2, comfort 2)
- 5 → NO (interest 1, comfort 1)
- 6-7 → NO (interest 0, comfort 0)

### Aktiv/Passiv Varianten
Fragen mit aktiv/passiv Varianten zeigen zwei Spalten:
- **Aktiv (geben)**: Status, Interesse, Komfort
- **Passiv (empfangen)**: Status, Interesse, Komfort

### Skalen (scale_0_10)
Für Fragen wie "Wie zufrieden bist du?" - Wert von 0-10.

### Auswahl (enum)
Für Fragen mit vordefinierten Optionen.

## Vergleichslogik

### Standard consent_rating
- **MATCH**: Beide YES
- **EXPLORE**: MAYBE beteiligt, kein NO
- **BOUNDARY**: Mind. ein NO oder HARD_LIMIT

### Dom/Sub Varianten
Vergleich erfolgt separat für Dom und Sub:
- Gesamtstatus ist der schlechteste der beiden (BOUNDARY > EXPLORE > MATCH)
- Deltas werden für beide Varianten berechnet

### Aktiv/Passiv Varianten
Vergleich erfolgt separat für aktiv und passiv:
- Gesamtstatus ist der schlechteste der beiden
- Deltas werden für beide Varianten berechnet

## Sicherheitshinweise

Das Template enthält umfangreiche Sicherheitshinweise:

- **High-Risk Module** (Risk Level C): Breathplay, Extreme Praktiken
- **Medium-Risk Module** (Risk Level B): Anal, Impact, Bondage, Sensation Play
- **Standard Module** (Risk Level A): Alle anderen

Sicherheitshinweise werden automatisch in den Help-Texten angezeigt:
- ⚠️ WARNUNG für High-Risk Themen
- **WICHTIG** für kritische Sicherheitshinweise
- **Hinweis** für allgemeine Informationen

## Verwendung

1. **Template auswählen**: Beim Erstellen einer neuen Session `comprehensive_v1` wählen
2. **Ausfüllen**: Beide Personen füllen den Fragebogen getrennt aus
3. **Vergleichen**: Vergleich zeigt Matches, Explore-Optionen und Grenzen
4. **Export**: JSON oder Markdown Export verfügbar

## Besonderheiten

- **Viele Fragen**: Über 500 Fragen - kann einige Zeit zum Ausfüllen benötigen
- **Modulare Struktur**: Module können einzeln ausgeklappt werden
- **Progress Tracking**: Fortschrittsanzeige zeigt, wie viele Fragen beantwortet wurden
- **Navigation**: Sprungnavigation zu einzelnen Fragen verfügbar

## Technische Details

- **Template ID**: `comprehensive_v1`
- **Version**: 1
- **Fragenanzahl**: ~500+
- **Module**: 17
- **Schemas**: consent_rating, scale_0_10, enum, multi, text

## Konvertierung

Das Template wurde automatisch aus `fragebogen-umfassend.md` konvertiert mit:
- Automatischer Extraktion von Fragen aus Markdown-Tabellen
- Mapping von 7-Punkte-Skala auf consent_rating
- Integration von Sicherheitshinweisen
- Erkennung von Dom/Sub und Aktiv/Passiv Varianten

