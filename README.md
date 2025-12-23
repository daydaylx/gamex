# Intimacy Questionnaire Tool (Local-first)

Dieses Tool hilft zwei Personen (A/B), getrennt einen Fragebogen auszufüllen, die Antworten zu vergleichen
und einen Report zu erzeugen: Matches / Explore / Grenzen / Risiko-Flags.

## Wichtige Prinzipien
- "NEIN" ist final. Kein Diskutieren/Überreden.
- "VIELLEICHT" gilt nur unter Bedingungen.
- Fantasie ≠ Wunsch ≠ Identität.

## Datenschutz
- Antworten werden pro Session mit einem Passwort verschlüsselt gespeichert.
- Wenn du das Passwort vergisst, sind die Daten nicht wiederherstellbar (Absicht).
- KI-Analyse ist optional und standardmäßig nicht nötig. Wenn du sie nutzt: du sendest Daten an einen Provider.

## Medizinischer Hinweis
Das Tool ist keine medizinische Beratung. Bei Schmerzen/Blut/anhaltenden Beschwerden nach intensiven Praktiken:
ärztlich abklären.

## Start
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app
```

Dann: [http://127.0.0.1:8000](http://127.0.0.1:8000)



