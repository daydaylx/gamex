# Encryption Migration Guide

## Übersicht

Ab sofort unterstützt das Intimacy Tool **Verschlüsselung standardmäßig** für alle neuen Sessions. Dieser Guide erklärt, wie du Verschlüsselung aktivierst und bestehende Daten migrierst.

## ⚠️ Wichtig

- **Neue Feature:** Der `/api/sessions` Endpoint akzeptiert jetzt ein optionales `password` Feld
- **Abw
ärtskompatibel:** Bestehende unverschlüsselte Sessions funktionieren weiterhin
- **Empfehlung:** Verwende Verschlüsselung für alle neuen Sessions (Produktiv-Einsatz)

---

## 🔐 Verschlüsselung aktivieren

### Option 1: Environment Variable (Empfohlen für Produktion)

1. **Erstelle `.env` Datei** im `backend/` Verzeichnis:

```bash
cd backend/
cp .env.example .env
```

2. **Aktiviere Verschlüsselung** in `.env`:

```bash
# Verschlüsselung für alle neuen Sessions erzwingen
FORCE_ENCRYPTION=true

# Warnungen für unverschlüsselte Sessions aktivieren
WARN_UNENCRYPTED=true
```

3. **Server neu starten:**

```bash
uvicorn app.main:app --reload
```

**Effekt:**
- Alle neuen Sessions MÜSSEN ein Passwort haben
- Unverschlüsselte Session-Requests werden mit HTTP 400 abgelehnt
- Bestehende unverschlüsselte Sessions funktionieren weiterhin (Read-Only kompatibel)

---

### Option 2: Runtime (Ohne Environment Variable)

Wenn `FORCE_ENCRYPTION=false` (Standard), können Sessions mit oder ohne Passwort erstellt werden:

**Mit Passwort (Verschlüsselt):**
```json
POST /api/sessions
{
  "name": "Meine Session",
  "template_id": "psycho_enhanced_v3",
  "password": "mein-sicheres-passwort-123"
}
```

**Ohne Passwort (Unverschlüsselt, Legacy):**
```json
POST /api/sessions
{
  "name": "Alte Session",
  "template_id": "default_template"
}
```

⚠️ **Warnung:** Backend loggt eine Warnung, wenn `WARN_UNENCRYPTED=true`

---

## 🔄 Bestehende Sessions migrieren

### Schritt 1: Backup erstellen

**Vor jeder Migration:**

```bash
# Backup der Datenbank
cp ~/.local/share/intimacy-tool/intimacy_tool.sqlite3 \
   ~/.local/share/intimacy-tool/intimacy_tool.sqlite3.backup

# Oder: Export über API
curl -X POST http://localhost:8000/api/sessions/{session_id}/backup
```

### Schritt 2: Migration durchführen

**Automatische Migration (Empfohlen):**

```python
# backend/scripts/migrate_to_encrypted.py
import requests

# 1. Keychain initialisieren (falls noch nicht geschehen)
response = requests.post(
    "http://localhost:8000/api/keychain/initialize",
    json={"password": "mein-master-passwort"}
)
print(response.json())

# 2. Alle Sessions auflisten
sessions = requests.get("http://localhost:8000/api/sessions").json()

# 3. Jede unverschlüsselte Session migrieren
for session in sessions:
    if not session.get("encrypted", False):
        # Session-Key für bestehende Session erstellen
        # (Responses werden bei nächstem Save automatisch verschlüsselt)
        session_id = session["id"]
        # ... Migration Logic ...
```

**Manuelle Migration:**

1. **Backup/Export** der alten Session
2. **Neue verschlüsselte Session** erstellen (mit Passwort)
3. **Responses importieren** in neue Session
4. **Alte Session löschen**

---

## 📖 API-Änderungen

### `/api/sessions` (POST)

**Vorher:**
```json
{
  "name": "Session Name",
  "template_id": "template_id"
}
```

**Jetzt (mit optionalem Passwort):**
```json
{
  "name": "Session Name",
  "template_id": "template_id",
  "password": "mein-passwort"  // Optional, aber empfohlen!
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Session Name",
  "template_id": "template_id",
  "created_at": "2025-01-15T10:00:00Z",
  "has_a": false,
  "has_b": false,
  "encrypted": true  // NEU: Zeigt an, ob Session verschlüsselt ist
}
```

### Verschlüsselungs-Status prüfen

```bash
GET /api/keychain/status
```

**Response:**
```json
{
  "initialized": true,
  "created_at": "2025-01-15T10:00:00Z",
  "version": 1,
  "total_sessions": 10,
  "encrypted_sessions": 8,
  "unencrypted_sessions": 2
}
```

---

## 🔒 Sicherheits-Best-Practices

### Passwort-Anforderungen

- **Mindestlänge:** 12 Zeichen
- **Empfohlen:** 16+ Zeichen mit Mix aus Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
- **Nicht verwenden:** Wiederverwendete Passwörter, einfache Wörter

### Master-Passwort Management

- **Ein Passwort** für alle verschlüsselten Sessions (Master-Key)
- **Passwort-Verlust = Datenverlust** (Zero-Knowledge-Architektur)
- **Passwort ändern:**
  ```bash
  POST /api/keychain/change-password
  {
    "old_password": "altes-passwort",
    "new_password": "neues-passwort"
  }
  ```

### Produktiv-Deployment

**Minimale Sicherheitskonfiguration:**

```bash
# .env
FORCE_ENCRYPTION=true
WARN_UNENCRYPTED=true
```

**Zusätzlich empfohlen:**
- HTTPS-Enforcement (siehe `HTTPS_DEPLOYMENT.md`)
- Capacitor Secure Storage für Mobile (Android Keystore)
- Regelmäßige Backups (verschlüsselt speichern!)

---

## 🧪 Testing

### Unit Tests

```bash
# Verschlüsselung testen
pytest backend/tests/test_crypto.py -v

# Keychain testen
pytest backend/tests/test_keychain.py -v

# Routes mit Encryption testen
pytest backend/tests/test_routes_encrypted.py -v
```

### Integration Test

```bash
# 1. Server starten
FORCE_ENCRYPTION=true uvicorn app.main:app --reload

# 2. Session erstellen (sollte fehlschlagen ohne Passwort)
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","template_id":"default_template"}'
# Erwartet: HTTP 400

# 3. Session erstellen (mit Passwort)
curl -X POST http://localhost:8000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Encrypted Test",
    "template_id":"default_template",
    "password":"secure-password-123"
  }'
# Erwartet: HTTP 200, encrypted=true
```

---

## 🚨 Troubleshooting

### Problem: "Keychain already initialized"

**Lösung:**
```bash
# Prüfe Status
curl http://localhost:8000/api/keychain/status

# Verwende bestehendes Master-Passwort
# Oder: Reset (ACHTUNG: Löscht alle verschlüsselten Sessions!)
rm ~/.local/share/intimacy-tool/intimacy_tool.sqlite3
```

### Problem: "Incorrect password"

**Lösung:**
- Du verwendest ein anderes Passwort als bei Keychain-Initialisierung
- Alle verschlüsselten Sessions nutzen **dasselbe Master-Passwort**
- Passwort zurücksetzen ist NICHT möglich (Zero-Knowledge-Design)

### Problem: Bestehende Sessions nicht mehr lesbar

**Lösung:**
- Alte **unverschlüsselte** Sessions funktionieren weiterhin
- Alte **verschlüsselte** Sessions benötigen das ursprüngliche Master-Passwort
- Backup/Export vor Migration erstellen!

---

## 📚 Weiterführende Dokumentation

- **Verschlüsselungs-Design:** `ENCRYPTION_DESIGN.md`
- **Security Audit:** `SECURITY_AUDIT.md`
- **HTTPS Setup:** `HTTPS_DEPLOYMENT.md` (TODO)
- **Mobile Security:** `MOBILE_SECURE_STORAGE.md` (TODO)

---

## ✅ Checkliste: Produktiv-Deployment

- [ ] `.env` Datei erstellt mit `FORCE_ENCRYPTION=true`
- [ ] Backup-Strategie implementiert
- [ ] HTTPS aktiviert (für Remote-Zugriff)
- [ ] Master-Passwort sicher gespeichert (z.B. Passwort-Manager)
- [ ] Tests erfolgreich durchgeführt
- [ ] Dokumentation gelesen und verstanden
- [ ] Team über Passwort-Anforderungen informiert

---

**Stand:** 2025-12-26
**Version:** Backend v1.x mit Hybrid-Encryption-Support
