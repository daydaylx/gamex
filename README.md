# Intimacy Questionnaire Tool (Local-first)

Dieses Tool hilft zwei Personen (A/B), getrennt einen Fragebogen auszufüllen, die Antworten zu vergleichen
und einen Report zu erzeugen: Matches / Explore / Grenzen / Risiko-Flags.

## Wichtige Prinzipien
- "NEIN" ist final. Kein Diskutieren/Überreden.
- "VIELLEICHT" gilt nur unter Bedingungen.
- Fantasie ≠ Wunsch ≠ Identität.

## Features

- **Verschlüsselte Sessions:** Alle Antworten werden passwortgeschützt gespeichert
- **Getrennte Antworten:** Person A und B füllen unabhängig voneinander aus
- **Intelligenter Vergleich:** Automatische Kategorisierung in Matches, Explore-Themen und Grenzen
- **Risiko-Flags:** Identifizierung von Themen mit hohem Interesse aber niedrigem Komfort
- **Action Plan:** Vorschläge für die nächsten Experimente basierend auf Matches
- **Szenarien-Karten:** 20 interaktive Szenarien mit 4-Optionen-System (A/B/C/D)
- **Export:** Ergebnisse als JSON oder Markdown exportieren
- **Backup & Restore:** Verschlüsselte Backups erstellen und wiederherstellen
- **Optional KI-Analyse:** OpenRouter-Integration für vertiefte Analysen (opt-in)
- **Android App:** Native Android-App via Capacitor (siehe [APK Build Guide](APK_BUILD_GUIDE.md))

## Verfügbare Templates

Das Tool bietet mehrere Fragebogen-Templates:

### 1. Intimität & Grenzen (v2 - Optimiert) - `default_v2`
**Empfohlen für:** Einsteiger und Paare, die einen ausgewogenen Überblick wollen

- 9 Basis-Module: Rahmen & Logistik, Basis & Kommunikation, Rollen & Kontrolle, Sensorik, Oral, Penetration, High-Risk, Bereits erlebt, Review
- Fokus auf granulare Abstufungen bei High-Risk Themen
- Sicherheitshinweise prominent bei Risk-Level C
- ~80-100 Fragen

### 2. Umfassender Intimität & BDSM Fragebogen - `comprehensive_v1`
**Empfohlen für:** Erfahrene Nutzer, die eine sehr detaillierte Abfrage wünschen

- Kombiniert aus GentleDom, QueerTopia und Gamex Fragebogen
- ~200+ Fragen zu Sexualität, BDSM, Grenzen und Kommunikation
- Sehr detaillierte Abfrage aller Bereiche

### 3. Intimacy & Kink v3 (Psychologisch vertieft) - `psycho_enhanced_v3`
**Empfohlen für:** Paare, die psychologische Tiefe und wissenschaftliche Fundierung suchen

- Alle 9 Basis-Module + 6 psychologische Vertiefungs-Module
- Wissenschaftlich fundiert (peer-reviewed Forschung 2024-aktuell)
- Fokus auf: Bindung, Subspace, Scham, Power Dynamics, Aftercare, Regulation
- ~150+ Fragen

### 4. Intimacy & Kink (v2 - Polished) - `unified_v2`
**Empfohlen für:** Moderne, ausgewogene Abfrage mit Fokus auf Konsens

- Startet sanft (Rahmen, Kommunikation) und steigert sich modular
- Fokus auf Konsens und psychologische Sicherheit
- ~100-120 Fragen

## Psychologische Vertiefung (v3)

Das **Intimacy & Kink v3 Template** (`psycho_enhanced_v3`) erweitert den Fragebogen um wissenschaftlich fundierte psychologische Tiefe in 6 Bereichen:

### Neue Module (zusätzlich zu den 9 Basis-Modulen):

1. **Bindung & Emotionale Basis** - Attachment Theory: Wie dein Bindungsstil (sicher/ängstlich/vermeidend) deine Intimität beeinflusst
2. **Aftercare-Profile & Drop-Physiologie** - Was Körper & Geist nach intensiven Erfahrungen brauchen (Sub Drop, Dom Drop)
3. **Subspace & Altered States** - Neurochemie von Trance-Zuständen, Transiente Hypofrontalität, Endorphine
4. **Emotionale Grenzen & Regulation** - Trauma-informierter Ansatz: Overwhelm, Freeze-Response, Window of Tolerance
5. **Scham, Tabus & Innere Konflikte** - Sexual Shame Psychology: Woher sie kommt, wie sie Erregung hemmt, wie man heilt
6. **Power Dynamics & Machtaustausch** - Die Psychologie von Kontrolle, Hingabe und Macht in intimen Beziehungen

### Wissenschaftliche Grundlagen

Alle psychologischen Module basieren auf peer-reviewed Forschung (2024-aktuell):
- Attachment Theory (Bowlby/Ainsworth)
- Subspace Neuroscience (2016 Studie: Transient Hypofrontality)
- Sexual Shame Research (MDPI, Journal of Sexual Medicine)
- Power Dynamics (2024: BDSM primär über Macht, nicht Schmerz)
- Aftercare & Drop Physiologie (Community Survey: 68% schätzen Aftercare als zentral)
- Trauma-informed Care (PMC: Freeze ≠ Consent, Arousal ≠ Wunsch)

**→ Für Details siehe:** [`docs/PSYCHOLOGIE_LEITFADEN.md`](docs/PSYCHOLOGIE_LEITFADEN.md) (~5000 Wörter)
**→ Alle Quellen:** [`docs/FORSCHUNG_ZITATE.md`](docs/FORSCHUNG_ZITATE.md) (16+ peer-reviewed Studien)
**→ Aftercare Deep Dive:** [`docs/AFTERCARE_GUIDE.md`](docs/AFTERCARE_GUIDE.md)

**Hinweis:** Dieser Fragebogen ersetzt keine professionelle Therapie. Bei anhaltenden psychischen Problemen nach sexuellen Erfahrungen: Bitte wende dich an eine:n Therapeut:in mit BDSM/Kink-Awareness.

**Deutsche Beratungsstellen:**
- **Pro Familia:** https://www.profamilia.de (Sexualberatung)
- **BZgA:** https://www.bzga.de (Bundeszentrale für gesundheitliche Aufklärung)
- **Telefonseelsorge:** 0800 111 0 111 (kostenlos, 24/7)

## Datenschutz
- Antworten werden pro Session mit einem Passwort verschlüsselt gespeichert.
- Wenn du das Passwort vergisst, sind die Daten nicht wiederherstellbar (Absicht).
- KI-Analyse ist optional und standardmäßig nicht nötig. Wenn du sie nutzt: du sendest Daten an einen Provider.

## Medizinischer Hinweis
Das Tool ist keine medizinische Beratung. Bei Schmerzen/Blut/anhaltenden Beschwerden nach intensiven Praktiken:
ärztlich abklären.

## Installation & Start

### Web-Version (Lokal)

```bash
# Python Virtual Environment erstellen
python3 -m venv .venv
source .venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# Server starten
python -m app
```

Dann im Browser öffnen: [http://127.0.0.1:8000](http://127.0.0.1:8000)

**Hinweis:** Die App ist auch im lokalen Netzwerk erreichbar, wenn die Firewall es erlaubt.

### Android App

Für die native Android-App siehe die detaillierte Anleitung: [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)

**Kurzfassung:**
```bash
# Node.js Abhängigkeiten installieren
npm install

# Capacitor Android Projekt erstellen
npx cap add android

# Web-Dateien syncen
npx cap sync android

# Android Studio öffnen
npx cap open android
```

## Dokumentation

- **[APK Build Guide](APK_BUILD_GUIDE.md)** - Detaillierte Anleitung zum Erstellen einer Android APK
- **[Psychologie Leitfaden](docs/PSYCHOLOGIE_LEITFADEN.md)** - Wissenschaftliche Grundlagen der psychologischen Module
- **[Forschung & Zitate](docs/FORSCHUNG_ZITATE.md)** - Peer-reviewed Studien und Quellen
- **[Aftercare Guide](docs/AFTERCARE_GUIDE.md)** - Tiefe Einführung zu Aftercare und Drop-Physiologie
- **[Entwickler-Dokumentation](docs/DEVELOPMENT.md)** - Projektstruktur, API, Testing (für Entwickler)

## Planungsdokumente

- **[Analyse & Verbesserungsplan](ANALYSE_UND_VERBESSERUNGSPLAN.md)** - Umfassende Analyse und geplante Verbesserungen
- **[Nächste Optimierungen](NEXT_OPTIMIZATIONS.md)** - Priorisierte Liste der nächsten Features
- **[Verbesserungsplan (Kurz)](VERBESSERUNGSPLAN_KURZ.md)** - Executive Summary
- **[Verbesserungsbeispiele](VERBESSERUNGSBEISPIELE.md)** - Vorher/Nachher Beispiele für geplante Änderungen









