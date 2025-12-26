# Encryption Design Document

**Projekt:** Intimacy Tool
**Version:** 1.0
**Datum:** 2025-12-26
**Status:** DRAFT - Awaiting User Decision

---

## Executive Summary

Dieses Dokument beschreibt drei Optionen für die Verschlüsselung von Nutzerdaten im Intimacy Tool. Aktuell werden **alle Daten im Klartext** gespeichert (SQLite, IndexedDB), was für sensible Daten **inakzeptabel** ist.

**Ziel:** Encryption-at-rest für alle User-Responses.

**Entscheidung benötigt:** Welche Option soll implementiert werden?

---

## Problem Statement

### Aktuelle Situation (IST)

**Backend (Server-Modus):**
```python
# backend/app/storage/sqlite.py:94
payload = json.dumps(responses, ensure_ascii=False)  # <- PLAINTEXT!
conn.execute(
    "INSERT INTO responses(...) VALUES (?,?,?,?)",
    (session_id, person, payload, updated_at),
)
```
- SQLite-Datei: `~/.local/share/intimacy_tool/sessions.db`
- **Unverschlüsselt!**
- Jeder mit Dateisystem-Zugriff kann Daten lesen

**Frontend (Offline-Modus):**
```javascript
// apps/web/web/storage/indexeddb.js
await tx.objectStore("responses").put({
    session_id: sessionId,
    person: person,
    json: JSON.stringify(responses)  // <- PLAINTEXT!
});
```
- IndexedDB im Browser
- **Unverschlüsselt!**
- Browser Dev Tools → Application → IndexedDB → alle Daten sichtbar

**Mobile App:**
- Nutzt dieselbe IndexedDB (WebView)
- **Keine Secure Storage**
- Daten abrufbar bei Root/Jailbreak

### Risiken

1. **Privacy Breach:** Gestohlenes Gerät = Alle intimen Daten lesbar
2. **DSGVO-Verstoß:** Art. 32 fordert "angemessene technische Maßnahmen"
3. **Vertrauensverlust:** User erwarten Verschlüsselung bei sensiblen Daten

---

## Design-Anforderungen

### Funktionale Anforderungen

1. **Encryption-at-rest:** Daten verschlüsselt in DB/Storage
2. **Transparenz:** User weiß, dass Verschlüsselung aktiv ist
3. **Key-Recovery:** Option für vergessene Passwörter?
4. **Migration:** Existierende Daten migrieren
5. **Cross-Platform:** Backend + Frontend + Mobile

### Nicht-funktionale Anforderungen

1. **Performance:** Verschlüsselung < 50ms zusätzlich
2. **Usability:** Kein kompliziertes Key-Management
3. **Security:** Industrie-Standard-Krypto (AES-256-GCM)
4. **Auditability:** Code nachvollziehbar, keine Crypto-Black-Boxes

### Ausschlüsse (Out of Scope)

- ❌ Transport-Verschlüsselung (separates Thema: HTTPS)
- ❌ End-to-End zwischen Person A/B (unnötig, local-first)
- ❌ Cloud-Sync (widerspricht local-first Prinzip)

---

## Option A: Session-Based Encryption (Simple)

### Konzept

Jede Session hat ein **eigenes Passwort**. Ohne Passwort = Keine Daten lesbar.

**Flow:**
```
1. User erstellt Session → setzt Passwort
2. Passwort → Key Derivation (PBKDF2) → Encryption Key
3. Responses verschlüsselt mit AES-256-GCM
4. Encryption Key wird NICHT gespeichert (nur in RAM während Session)
5. Beim Laden: User gibt Passwort ein → Key derived → Decrypt
```

### Architektur

**Backend:**
```python
# Neue Datei: backend/app/crypto.py
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def derive_key(password: str, salt: bytes) -> bytes:
    """Derive encryption key from password using PBKDF2"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # 256 bits for AES-256
        salt=salt,
        iterations=600_000,  # OWASP recommendation 2023
    )
    return kdf.derive(password.encode())

def encrypt(plaintext: str, password: str, salt: bytes) -> dict:
    """Encrypt data with AES-256-GCM"""
    key = derive_key(password, salt)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return {
        "ciphertext": ciphertext.hex(),
        "nonce": nonce.hex(),
        "salt": salt.hex(),
        "algorithm": "AES-256-GCM",
        "kdf": "PBKDF2-SHA256-600k"
    }

def decrypt(encrypted: dict, password: str) -> str:
    """Decrypt data"""
    salt = bytes.fromhex(encrypted["salt"])
    key = derive_key(password, salt)
    aesgcm = AESGCM(key)
    nonce = bytes.fromhex(encrypted["nonce"])
    ciphertext = bytes.fromhex(encrypted["ciphertext"])
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()
```

**Session-Erstellung:**
```python
@api_router.post("/sessions")
def create_session(req: CreateSessionRequest):
    # NEU: Passwort erforderlich
    if not req.password or len(req.password) < 8:
        raise HTTPException(400, "Password min 8 chars")

    session_id = str(uuid.uuid4())
    salt = os.urandom(16)  # Random salt pro Session

    # Salt in DB speichern (OK, public)
    storage.create_session(
        session_id=session_id,
        name=req.name,
        template_id=req.template_id,
        created_at=_utcnow(),
        salt=salt.hex(),
    )
    return {...}
```

**Responses speichern:**
```python
@api_router.post("/sessions/{id}/responses/{person}/save")
def save_responses(session_id: str, person: str, req: SaveResponsesRequest):
    # User muss Passwort schicken
    if not req.password:
        raise HTTPException(400, "Password required")

    session = storage.get_session_row(session_id)
    salt = bytes.fromhex(session["salt"])

    # Encrypt before saving
    plaintext = json.dumps(req.responses, ensure_ascii=False)
    encrypted = encrypt(plaintext, req.password, salt)

    storage.save_responses(
        session_id=session_id,
        person=person,
        responses=encrypted,  # <- Verschlüsselt!
        updated_at=_utcnow(),
    )
```

### Vor- und Nachteile

**Vorteile:**
- ✅ **Einfach zu verstehen:** Ein Passwort pro Session
- ✅ **Keine zentrale Schwachstelle:** Jede Session isoliert
- ✅ **Zero-Knowledge:** Server kennt Passwort nie
- ✅ **DSGVO-konform:** Encryption-at-rest erfüllt
- ✅ **Schnell implementiert:** ~8-12h

**Nachteile:**
- ❌ **Passwort vergessen = Daten weg:** Keine Recovery
- ❌ **Jede Session eigenes PW:** Bei vielen Sessions unpraktisch
- ❌ **Kein Sharing:** Person A kann Person B's Daten nicht sehen (Feature?)

**Variante A.1: Optional Password**
- Sessions KÖNNEN Passwort haben (nicht müssen)
- Checkbox "Encrypt this session"
- Abwärtskompatibel mit existierenden Sessions

---

## Option B: Master Password (Centralized)

### Konzept

**Ein Master-Passwort** für alle Sessions eines Users.

**Flow:**
```
1. User setzt Master-Passwort beim ersten Start
2. Master-Passwort → Master-Key (gespeichert verschlüsselt)
3. Für jede Session: Ableitung von Session-Key aus Master-Key
4. Responses verschlüsselt mit Session-Key
5. User gibt Master-PW einmal ein → unlock alle Sessions
```

### Architektur

**Keychain:**
```python
# backend/app/keychain.py
class Keychain:
    def __init__(self, master_password: str):
        self.master_key = self._derive_master_key(master_password)

    def _derive_master_key(self, password: str) -> bytes:
        # Global salt (gespeichert in config)
        salt = load_or_create_global_salt()
        return derive_key(password, salt)

    def derive_session_key(self, session_id: str) -> bytes:
        """Derive session-specific key from master key"""
        # HKDF (Key Derivation Function)
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=session_id.encode(),
            info=b"session_encryption_key",
        )
        return hkdf.derive(self.master_key)
```

**Session-Zugriff:**
```python
# User gibt Master-PW beim Start ein
keychain = Keychain(master_password)

# Beim Laden:
session_key = keychain.derive_session_key(session_id)
plaintext = decrypt_with_key(ciphertext, session_key)
```

### Vor- und Nachteile

**Vorteile:**
- ✅ **Komfort:** Ein Passwort für alles
- ✅ **Zentrale Kontrolle:** Passwort ändern = alle Sessions re-keyen
- ✅ **Sharing möglich:** Master-PW weitergeben (falls gewollt)

**Nachteile:**
- ❌ **Single Point of Failure:** Master-PW kompromittiert = alle Daten offen
- ❌ **Komplexer:** Keychain-Management
- ❌ **Recovery-Problem:** Master-PW vergessen = alles weg
- ❌ **Aufwand:** ~12-16h Implementation

**Variante B.1: Recovery-Key**
- Bei Ersteinrichtung: 12-Wort Recovery-Phrase generieren
- User muss sie notieren (analog BIP-39 Mnemonic)
- Recovery-Key kann Master-PW wiederherstellen

---

## Option C: Hybrid (Secure + Flexible)

### Konzept

**Best of both worlds:** Master-Passwort + Session-spezifische Keys.

**Flow:**
```
1. User setzt Master-Passwort
2. Master-Key verschlüsselt in Keychain gespeichert
3. Pro Session: Random Session-Key generiert
4. Session-Key verschlüsselt mit Master-Key gespeichert
5. Responses verschlüsselt mit Session-Key
```

**Vorteil:** Master-PW änderbar, ohne alle Daten zu re-encrypten!

### Architektur

**DB-Schema:**
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    template_id TEXT,
    created_at TEXT,
    encrypted_session_key TEXT,  -- Session-Key verschlüsselt mit Master-Key
    salt TEXT
);

CREATE TABLE keychain (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton
    encrypted_master_key TEXT,  -- Master-Key verschlüsselt mit User-PW
    salt TEXT,
    created_at TEXT
);
```

**Session-Erstellung:**
```python
# 1. Generate random session key
session_key = os.urandom(32)  # 256-bit random

# 2. Encrypt session key with master key
master_key = keychain.get_master_key(user_password)
encrypted_session_key = encrypt_with_key(session_key, master_key)

# 3. Save encrypted session key
storage.create_session(..., encrypted_session_key=encrypted_session_key)
```

**Responses speichern:**
```python
# 1. Decrypt session key
session = storage.get_session_row(session_id)
master_key = keychain.get_master_key(user_password)
session_key = decrypt_with_key(session["encrypted_session_key"], master_key)

# 2. Encrypt responses with session key
encrypted_responses = encrypt_with_key(json.dumps(responses), session_key)
```

**Master-Passwort ändern:**
```python
def change_master_password(old_pw: str, new_pw: str):
    # 1. Decrypt master key with old password
    old_master_key = keychain.decrypt_master_key(old_pw)

    # 2. Re-encrypt master key with new password
    keychain.encrypt_master_key(old_master_key, new_pw)

    # 3. Session-Keys müssen NICHT re-encrypted werden!
    # (weil sie mit Master-Key verschlüsselt sind, nicht PW)
```

### Vor- und Nachteile

**Vorteile:**
- ✅ **Flexibel:** PW änderbar ohne Re-Encryption aller Daten
- ✅ **Sicher:** Session-Isolation + Master-Key-Schutz
- ✅ **Recovery:** Optional Recovery-Phrase für Master-Key
- ✅ **Audit:** Klare Key-Hierarchie
- ✅ **Professionell:** Industrie-Standard-Ansatz

**Nachteile:**
- ❌ **Komplex:** Mehr Code, mehr Fehlerquellen
- ❌ **Aufwand:** ~16-20h Implementation
- ❌ **Testing:** Aufwändiger zu testen
- ❌ **Over-Engineering?:** Für local-first App möglicherweise too much

---

## Frontend/Mobile Encryption

### Web (IndexedDB)

**Web Crypto API:**
```javascript
// apps/web/web/crypto.js
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 600000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(plaintext, password, salt) {
    const key = await deriveKey(password, salt);
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    return {
        ciphertext: arrayBufferToHex(ciphertext),
        iv: arrayBufferToHex(iv),
        salt: arrayBufferToHex(salt)
    };
}
```

**Kompatibilität:**
- ✅ Chrome, Firefox, Safari, Edge (alle modern)
- ✅ Capacitor WebView (Android/iOS)

### Mobile (Capacitor)

**Secure Storage Plugin:**
```typescript
// apps/mobile/src/crypto.ts
import { SecureStoragePlugin } from '@capacitor-community/secure-storage';

// Store master key securely
await SecureStoragePlugin.set({
    key: 'master_key_encrypted',
    value: encryptedMasterKey
});

// Retrieve
const { value } = await SecureStoragePlugin.get({
    key: 'master_key_encrypted'
});
```

**Backend:**
- iOS: Keychain (Hardware-backed wenn Face ID/Touch ID aktiv)
- Android: EncryptedSharedPreferences + Keystore

---

## Migration Strategy

### Phase 1: Opt-In Encryption (Week 1)

**Backward-compatible:**
```python
# Neue Sessions: Verschlüsselt (wenn PW gesetzt)
# Alte Sessions: Unverschlüsselt (weiterhin lesbar)

def load_responses(session_id, person):
    row = db.execute("SELECT json FROM responses ...").fetchone()

    # Check if encrypted
    if isinstance(row["json"], dict) and "ciphertext" in row["json"]:
        # Encrypted - need password
        if not password_provided:
            raise HTTPException(401, "Password required")
        return decrypt(row["json"], password)
    else:
        # Legacy unencrypted
        return json.loads(row["json"])
```

### Phase 2: Migration Tool (Week 2)

```python
@api_router.post("/sessions/{id}/encrypt")
def encrypt_session(session_id: str, req: EncryptSessionRequest):
    """Migrate unencrypted session to encrypted"""
    # 1. Load plaintext responses
    resp_a = storage.load_responses(session_id, "A")
    resp_b = storage.load_responses(session_id, "B")

    # 2. Encrypt with new password
    salt = os.urandom(16)
    encrypted_a = encrypt(json.dumps(resp_a), req.password, salt)
    encrypted_b = encrypt(json.dumps(resp_b), req.password, salt)

    # 3. Update DB
    storage.save_responses(session_id, "A", encrypted_a, _utcnow())
    storage.save_responses(session_id, "B", encrypted_b, _utcnow())
    storage.update_session_salt(session_id, salt.hex())
```

### Phase 3: Enforce Encryption (Month 3)

- Alle neuen Sessions MÜSSEN verschlüsselt sein
- Legacy-Sessions: Warning-Banner "Please encrypt"

---

## Recommendation Matrix

| Kriterium | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| **Implementierungsaufwand** | 🟢 Low (8-12h) | 🟡 Medium (12-16h) | 🔴 High (16-20h) |
| **Usability** | 🟡 Medium (PW pro Session) | 🟢 High (ein PW) | 🟢 High (ein PW) |
| **Sicherheit** | 🟢 High (isolation) | 🟡 Medium (SPOF) | 🟢 High (defense-in-depth) |
| **Recovery** | 🔴 None | 🔴 None (oder B.1) | 🟢 Optional (Recovery Phrase) |
| **Flexibilität** | 🔴 Low | 🟡 Medium | 🟢 High (PW änderbar) |
| **Complexity** | 🟢 Simple | 🟡 Medium | 🔴 Complex |

---

## Empfehlung

### Für MVP / Quick Win:
**Option A (Session-Based)** mit Variante A.1 (Optional Encryption)

**Begründung:**
- Schnell implementiert (1-2 Wochen)
- Sofort DSGVO-konform
- Kein Over-Engineering
- Später auf Option C upgradebar

### Für Production-Grade App:
**Option C (Hybrid)**

**Begründung:**
- Professioneller Ansatz
- Passwort-Änderung ohne Re-Encryption
- Recovery-Optionen
- Bester Security-Posture

---

## Implementation Timeline

### Option A (Recommended for Start)

**Week 1: Backend**
- [ ] `backend/app/crypto.py` erstellen (Key derivation, AES-GCM)
- [ ] DB-Schema erweitern (`sessions.salt`)
- [ ] API-Endpoints anpassen (password parameter)
- [ ] Tests schreiben

**Week 2: Frontend**
- [ ] `apps/web/web/crypto.js` (Web Crypto API)
- [ ] Password-Input UI
- [ ] LocalStorage für Session-Passwörter (optional, encrypted)
- [ ] Migration-Tool für existierende Sessions

**Week 3: Mobile**
- [ ] Capacitor Secure Storage Plugin
- [ ] Biometric unlock (optional)
- [ ] Testing auf echten Geräten

**Week 4: Polish**
- [ ] Security-Audit
- [ ] Dokumentation
- [ ] User-Guide ("Passwort vergessen = Daten weg")

---

## Security Considerations

### Crypto-Library Choice

**Python:**
- ✅ `cryptography` (PyCA) - Industry standard, well-audited
- ❌ `PyCrypto` - Deprecated, vulnerabilities
- ❌ Custom Crypto - **NEVER!**

**JavaScript:**
- ✅ Web Crypto API (native) - Browser-built-in, FIPS-certified
- ❌ CryptoJS - Older, slower
- ❌ Custom implementations - **NEVER!**

### Key Derivation

**PBKDF2 vs Argon2:**
- PBKDF2: NIST standard, broad support
- Argon2: Winner of Password Hashing Competition 2015, better vs GPU attacks

**Recommendation:** PBKDF2-SHA256 with 600k iterations (OWASP 2023)
- Alternative: Argon2id (wenn Library verfügbar)

### Nonce/IV Management

**CRITICAL:** Nonces MUST be unique per encryption!

```python
# ✅ CORRECT
nonce = os.urandom(12)  # New random nonce EVERY time

# ❌ WRONG
GLOBAL_NONCE = b"fixed_nonce"  # NEVER reuse nonces!
```

### Salt Storage

**Salts are PUBLIC** - OK to store in DB unencrypted.
- Purpose: Prevent rainbow tables, NOT secrecy

---

## Open Questions

1. **Password-Policy:**
   - Minimum length? (Empfehlung: 12 Zeichen)
   - Complexity requirements? (Empfehlung: Nein, nur Länge)
   - Passphrase-Option? (Empfehlung: Ja, Diceware)

2. **Biometric Auth (Mobile):**
   - Soll Face ID/Fingerprint Master-PW ersetzen können?
   - Sicherheitsbedenken? (Biometrics können nicht geändert werden)

3. **Password-Reset:**
   - Recovery-Email? (widerspricht local-first)
   - Security-Questions? (schwach)
   - Recovery-Phrase? (empfohlen, aber UX-Challenge)

4. **Sharing zwischen A/B:**
   - Sollen beide das Passwort kennen?
   - Oder separate Passwörter pro Person?

---

## Decision Required

**User-Entscheidung:** Welche Option soll implementiert werden?

**Empfehlung:** Start mit **Option A**, später Upgrade auf **Option C**.

**Nächste Schritte nach Entscheidung:**
1. Detailed Implementation Spec
2. Security Review
3. Proof of Concept
4. Full Implementation

---

**Dokument-Status:** DRAFT
**Nächstes Review:** Nach User-Feedback
