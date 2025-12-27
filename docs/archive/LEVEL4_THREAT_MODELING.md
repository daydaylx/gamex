# Level 4: Threat Modeling für Local-First Intimity App

## Sicherheitsrisiken-Analyse für gamex

Diese Analyse fokussiert auf die drei kritischsten Szenarien für eine local-first App mit sensiblen intimen Daten.

---

## Szenario A: Gerät ausleihen (Phone Lending)

### Beschreibung
Nutzer leiht sein Smartphone einem Freund/Familienmitglied aus. Der Browser ist noch offen, oder die App ist im Hintergrund geöffnet.

### Attack Vector

**Schritt 1: Freund öffnet Browser**
- Browser öffnet mit letzter Session
- App ist noch im Speicher (Tab geöffnet)
- Oder: Browser-Historie zeigt App-URL

**Schritt 2: Zugriff auf Daten**
- Freund navigiert zu `/sessions`
- Sieht alle Session-Namen (z.B. "Erste Session", "Valentinstag 2025")
- Kann auf Session-Details zugreifen
- **KRITISCH:** Kann Antworten von Person A UND Person B sehen

### Aktuelle Abschwächung

**Status:** ❌ KEINE

**Beweis aus Code:**
```typescript
// apps/web-new/src/services/api.ts
export async function loadResponses(sessionId: string, person: 'A' | 'B'): Promise<ResponseMap> {
  const key = `${STORAGE_PREFIX}responses:${sessionId}:${person}`;
  return getStorage<ResponseMap>(key) || {}; // ← KEIN AUTH-CHECK!
}
```

**Probleme:**
1. Keine Session-Timeout
2. Keine App-Level-Sperre
3. localStorage persistiert über Browser-Sessions
4. Keine PIN/Verschlüsselung

### Impact Assessment

**Severity:** 🔴 **KRITISCH**

**Warum kritisch:**
- Vollzugriff auf intime Fragebogen-Daten
- Antworten können gelesen, kopiert, geteilt werden
- Keine Möglichkeit, den Zugriff zu verhindern
- Verletzung der Privatsphäre auf höchstem Level

**Betroffene Daten:**
- Alle Session-Namen
- Alle Antworten (Person A & B)
- Vergleichs-Ergebnisse
- Template-Informationen (welche Fragen wurden beantwortet)

### Real-World Impact

**Beispiel-Szenario:**
- Nutzer füllt Fragebogen mit Partner aus
- Gerät wird Kollegen ausgeliehen (z.B. für kurzen Anruf)
- Kollege sieht Browser-Historie → öffnet App
- Kollege kann alle Antworten lesen (z.B. über BDSM-Vorlieben, intime Wünsche)

**Konsequenzen:**
- Peinlichkeit
- Potenzielle Erpressung
- Beziehungs-Probleme
- Verlust des Vertrauens in die App

---

## Szenario B: Cross-Tab IndexedDB-Zugriff

### Beschreibung
Bösartiges JavaScript in einem anderen Tab (z.B. durch XSS auf einer anderen Website) versucht, auf die IndexedDB oder localStorage der App zuzugreifen.

### Attack Vector

**Schritt 1: XSS auf anderer Website**
- Nutzer besucht bösartige Website (z.B. infiziertes Werbebanner)
- Website lädt bösartiges Script
- Script läuft im selben Browser

**Schritt 2: Cross-Tab-Zugriff**
- Script versucht, auf localStorage/IndexedDB zuzugreifen
- Browser Same-Origin-Policy sollte dies verhindern
- **ABER:** Wenn XSS auf derselben Domain (z.B. gamex.com), dann Zugriff möglich

### Aktuelle Abschwächung

**Status:** ⚠️ **TEILWEISE**

**Browser-Schutz:**
- Same-Origin-Policy verhindert Cross-Origin-Zugriff
- localStorage ist origin-isoliert

**Probleme:**
1. Keine Verschlüsselung → Wenn Zugriff, dann Klartext
2. Keine Content-Security-Policy (CSP) implementiert
3. Keine XSS-Schutz-Maßnahmen

**Beweis aus Code:**
```typescript
// apps/web-new/src/services/api.ts
function getStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null; // ← Klartext!
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}
```

### Impact Assessment

**Severity:** 🟠 **HOCH** (wenn XSS existiert), 🟡 **MITTEL** (wenn nur Cross-Origin)

**Warum:**
- Browser-Schutz ist stark, aber nicht perfekt
- Wenn Zugriff möglich → vollständiger Datenverlust
- Verschlüsselung würde Risiko deutlich reduzieren

**Betroffene Daten:**
- Alle localStorage-Daten (Sessions, Responses)
- Falls IndexedDB genutzt wird → auch diese Daten

### Real-World Impact

**Beispiel-Szenario:**
- App läuft auf gamex.example.com
- Nutzer besucht andere Website (bösartige Werbung)
- Werbung enthält XSS-Exploit für gamex.example.com
- Exploit lädt Daten aus localStorage
- Daten werden an bösartigen Server gesendet

**Konsequenzen:**
- Massenhafter Datenverlust
- Daten können verkauft/geteilt werden
- Keine Möglichkeit, dies zu verhindern (nachträglich)

---

## Szenario C: Dateisystem-Zugriff (Backup/Forensik)

### Beschreibung
Gerät wird gesichert (Backup), gehackt, oder forensisch analysiert. localStorage/IndexedDB-Daten sind im Dateisystem sichtbar.

### Attack Vector

**Vektor 1: Geräte-Backup**
- Nutzer erstellt iCloud/Google Drive Backup
- Backup enthält Browser-Daten (inkl. localStorage)
- Backup wird kompromittiert (z.B. Account-Hack)
- Angreifer extrahiert localStorage-Daten aus Backup

**Vektor 2: Physischer Zugriff**
- Gerät wird gestohlen oder verloren
- Angreifer hat Root-Zugriff (Jailbreak/Root)
- Kann direkt auf Dateisystem zugreifen
- Extrahiert Browser-Daten (localStorage/IndexedDB)

**Vektor 3: Forensik/Tools**
- Nutzer gibt Gerät zur Reparatur
- Techniker nutzt Forensik-Tools
- Tools extrahieren alle Browser-Daten
- Daten werden analysiert

### Aktuelle Abschwächung

**Status:** ❌ **KEINE**

**Probleme:**
1. Keine Verschlüsselung → Daten sind im Klartext
2. localStorage/IndexedDB sind nicht verschlüsselt
3. Backup-Tools kopieren unverschlüsselte Daten
4. Keine Möglichkeit, Daten zu schützen

**Beweis:**
- Alle Daten in localStorage sind JSON-Klartext
- Keine Verschlüsselungsschicht vorhanden
- Daten sind direkt lesbar

### Impact Assessment

**Severity:** 🔴 **KRITISCH**

**Warum kritisch:**
- Backups sind sehr verbreitet (automatisch bei iCloud/Google)
- Nutzer hat keine Kontrolle über Backup-Sicherheit
- Physischer Zugriff ist schwer zu verhindern
- Forensik-Tools sind weit verbreitet

**Betroffene Daten:**
- Alle Session-Daten
- Alle Antworten (Person A & B)
- Vergleichs-Ergebnisse
- Metadaten (Session-Namen, Datum, etc.)

### Real-World Impact

**Beispiel-Szenario 1: iCloud-Backup**
- Nutzer hat iCloud-Backup aktiviert
- iPhone wird gestohlen
- Angreifer hackt iCloud-Account
- Extrahiert Backup → findet alle Browser-Daten im Klartext
- Kann alle intimen Antworten lesen

**Beispiel-Szenario 2: Gerät zur Reparatur**
- Nutzer gibt Laptop zur Reparatur
- Techniker nutzt Forensik-Tool
- Tool extrahiert alle Browser-Daten
- Techniker findet intime Fragebogen-Daten

**Konsequenzen:**
- Massenhafter Datenverlust
- Keine Möglichkeit, Daten zu schützen (nachträglich)
- Verletzung der Privatsphäre auf höchstem Level
- Potenzielle Erpressung

---

## Zusammenfassung: Risiko-Matrix

| Szenario | Wahrscheinlichkeit | Impact | Severity | Priorität |
|----------|-------------------|--------|----------|-----------|
| **A: Gerät ausleihen** | Hoch (täglich) | Kritisch | 🔴 Kritisch | P1 |
| **B: Cross-Tab-Zugriff** | Niedrig (nur bei XSS) | Hoch | 🟠 Hoch | P2 |
| **C: Dateisystem-Zugriff** | Mittel (Backups häufig) | Kritisch | 🔴 Kritisch | P1 |

---

## Nächste Schritte

Basierend auf dieser Threat-Model-Analyse müssen folgende Sicherheitsfeatures implementiert werden:

1. **Session-Timeout & Auto-Lock** (Szenario A)
2. **IndexedDB-Verschlüsselung at Rest** (Szenario B & C)
3. **PIN-Schutz** (Szenario A & C)

Details zu diesen Features folgen im nächsten Dokument (LEVEL4_SECURITY_FEATURES.md).


