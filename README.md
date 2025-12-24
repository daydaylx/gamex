# Intimacy Questionnaire Tool (Local-first)

Dieses Tool hilft zwei Personen (A/B), getrennt einen Fragebogen auszufüllen, die Antworten zu vergleichen
und einen Report zu erzeugen: Matches / Explore / Grenzen / Risiko-Flags.

## Wichtige Prinzipien
- "NEIN" ist final. Kein Diskutieren/Überreden.
- "VIELLEICHT" gilt nur unter Bedingungen.
- Fantasie ≠ Wunsch ≠ Identität.

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

## Start
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app
```

Dann: [http://127.0.0.1:8000](http://127.0.0.1:8000)







