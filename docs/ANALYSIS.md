# Analyse-Dokumentation

Diese Dokumentation erklärt, wie die Analyse von Fragebogen-Antworten funktioniert.

## Bucket-Klassifizierung

Jede Frage wird in einen von vier Buckets klassifiziert:

### DOABLE NOW

**Bedeutung:** Beide Partner*innen wollen es und können es direkt ausprobieren.

**Kriterien:**
- Beide haben `status="YES"`
- Beide haben `comfort >= 3` (auf Skala 0-4)
- `risk_level` ist "A" oder "B" (nicht "C")

**Beispiel:** Beide mögen Oralsex und fühlen sich wohl dabei.

### EXPLORE

**Bedeutung:** Beide sind interessiert, aber es gibt Klärungsbedarf.

**Kriterien:**
- Beide haben `status="YES"` oder `status="MAYBE"`, aber:
  - Einer hat `comfort < 3`, ODER
  - Hohes Interesse aber niedriger Komfort (`interest >= 3` und `comfort <= 2`)

**Beispiel:** Beide finden Spanking interessant, aber einer fühlt sich noch unsicher.

### TALK FIRST

**Bedeutung:** Erfordert ein ausführliches Gespräch vorher.

**Kriterien:**
- `status="MAYBE"` mit Bedingungen (conditions vorhanden), ODER
- `risk_level="C"` (High-Risk)

**Beispiel:** Beide könnten sich Breathplay vorstellen, aber es ist High-Risk und erfordert Sicherheits-Gespräch.

### MISMATCH

**Bedeutung:** Eine*r will es, die/der andere nicht.

**Kriterien:**
- Einer hat `status="YES"` oder `status="MAYBE"`
- Andere*r hat `status="NO"` oder `status="HARD_LIMIT"`

**Beispiel:** Eine*r möchte Group Sex, die/der andere hat es als Hard Limit.

## Gesprächs-Prompts

Für jedes Item werden 2-3 Gesprächs-Prompts generiert (regelbasiert, nicht KI).

### Prompt-Generierung

Die Prompts basieren auf:
- **Bucket**: Verschiedene Prompts für verschiedene Buckets
- **Risiko-Level**: Zusätzliche Sicherheitshinweise bei High-Risk
- **Flags**: Spezielle Hinweise bei z.B. `low_comfort_high_interest`
- **Bedingungen**: Wenn vorhanden, werden sie in Prompts eingebunden

### Beispiel-Prompts

**DOABLE NOW:**
- "Beide möchtet ihr 'Oralsex aktiv geben'. Perfekt für den Einstieg!"
- "Redet kurz über eure Erwartungen und genießt es!"

**EXPLORE:**
- "Beide seid ihr interessiert an 'Spanking', aber es gibt noch Klärungsbedarf."
- "Ein*e von euch hat hohes Interesse aber niedrigen Komfort - sprecht darüber, wie ihr es sicherer machen könnt."

**TALK FIRST:**
- "'Breathplay' erfordert ein ausführliches Gespräch vorher."
- "⚠️ HIGH RISK: Plant ausreichend Zeit für Sicherheits-Gespräch und Vorbereitung ein."
- "Besprecht genau, unter welchen Bedingungen es für euch beide ok wäre."

**MISMATCH:**
- "Bei 'Group Sex' gibt es eine Unstimmigkeit - einer möchte es, der/die andere nicht."
- "⚠️ WICHTIG: Einer hat ein Hard Limit - respektiert das absolut."
- "Das ist ok! Sprecht darüber, warum es nicht passt, ohne Druck auszuüben."

## Kategorien-Zusammenfassungen

Für jedes Modul wird eine Zusammenfassung generiert mit:

```json
{
  "module_id": {
    "name": "Modul Name",
    "counts": {
      "DOABLE NOW": 5,
      "EXPLORE": 3,
      "TALK FIRST": 2,
      "MISMATCH": 1
    },
    "total": 11
  }
}
```

Dies ermöglicht eine "Heatmap"-ähnliche Übersicht über die Verteilung der Buckets pro Kategorie.

## Analyse-Algorithmus

### 1. Normalisierung

Antworten werden normalisiert:
- Fehlende `intensity` → Standard: 3
- `status="NO"` → `hardNo=true` (automatisch)
- Fehlende `contextFlags` → `[]`
- `confidence` optional

### 2. Klassifizierung

Für jede Frage:
1. Bestimme `pair_status` (MATCH, EXPLORE, MISMATCH)
2. Klassifiziere in Bucket basierend auf Status, Comfort, Risiko
3. Generiere Gesprächs-Prompts
4. Zähle Flags (low_comfort_high_interest, big_delta, etc.)

### 3. Aggregation

- Zähle Buckets pro Modul → `categorySummaries`
- Zähle Flags → `summary.flags`
- Sortiere Items: MISMATCH → TALK FIRST → EXPLORE → DOABLE NOW (High-Risk zuerst innerhalb jeder Gruppe)

## Flags

Zusätzliche Metadaten für Items:

- **low_comfort_high_interest**: Interesse >= 3, aber Comfort <= 2
- **big_delta**: Große Unterschiede in Interest/Comfort zwischen Partnern (Delta >= 3)
- **high_risk**: Risiko-Level "C"
- **hard_limit_violation**: Eine*r will es, andere*r hat Hard Limit

## Action Plan

Der Action Plan enthält 3 Items aus dem "DOABLE NOW"-Bucket, die:
- `comfort >= 3` für beide Partner*innen haben
- Verschiedene Tags/Module abdecken (Diversität)
- Sortiert nach Score (Interest + Comfort + Risiko-Bonus)

## Rückwärtskompatibilität

Die Analyse ist rückwärtskompatibel:
- Alte Antworten werden automatisch normalisiert
- Fehlende Felder werden mit Standardwerten gefüllt
- Alte `pair_status` Werte (MATCH, EXPLORE, BOUNDARY) werden unterstützt, aber neue Buckets werden bevorzugt

## Erweiterte Analyse

### Kontext-Flags

Neue Antwort-Felder (optional):
- `contextFlags`: ["only_with_preparation", "only_with_aftercare", "only_in_relationship"]
- Diese können in zukünftigen Versionen für erweiterte Filterung verwendet werden

### Confidence vs. Comfort

- `comfort`: Wie wohl fühlst du dich bei dieser Aktivität?
- `confidence`: Wie sicher bist du dir bei deiner Antwort?

Diese können unterschiedlich sein (z.B. hoher Comfort, aber niedrige Confidence = unsicher über Antwort).

