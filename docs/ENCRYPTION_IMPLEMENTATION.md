# Implementation Specification: Hybrid Encryption (Option C)

**Version:** 1.0
**Datum:** 2025-12-26
**Aufwand:** 16-20h
**Status:** IN PROGRESS

---

## Phase 1: Backend Foundation (Week 1)

### 1.1 Dependencies hinzufügen

**File:** `backend/requirements.txt`
```
cryptography==42.0.0  # PyCA Cryptography Library
```

**Begründung:** Industry-standard, FIPS-certified, well-audited

---

### 1.2 Crypto-Module erstellen

**File:** `backend/app/crypto.py`

**Funktionen:**
```python
# Key Derivation
derive_key_from_password(password: str, salt: bytes) -> bytes
    - PBKDF2-SHA256, 600k iterations
    - Returns 32-byte key for AES-256

# Master Key Management
generate_master_key() -> bytes
    - os.urandom(32) - cryptographically secure random

encrypt_master_key(master_key: bytes, password: str, salt: bytes) -> dict
    - Encrypt master key with user password
    - Returns {"ciphertext": hex, "nonce": hex, "salt": hex, ...}

decrypt_master_key(encrypted: dict, password: str) -> bytes
    - Decrypt master key with password
    - Raises InvalidTag if password wrong

# Session Key Management
generate_session_key() -> bytes
    - os.urandom(32)

encrypt_session_key(session_key: bytes, master_key: bytes) -> dict
    - AES-256-GCM with master key
    - Returns encrypted session key

decrypt_session_key(encrypted: dict, master_key: bytes) -> bytes
    - Decrypt session key

# Data Encryption
encrypt_data(plaintext: str, key: bytes) -> dict
    - AES-256-GCM
    - Returns {"ciphertext": hex, "nonce": hex, "algorithm": "..."}

decrypt_data(encrypted: dict, key: bytes) -> str
    - Decrypt data
    - Raises InvalidTag on wrong key/corrupted data

# Utility
is_encrypted(data: Any) -> bool
    - Check if data is encrypted (has "ciphertext" key)
```

**Error Handling:**
```python
class CryptoError(Exception):
    """Base exception for crypto errors"""

class InvalidPasswordError(CryptoError):
    """Password incorrect or key derivation failed"""

class CorruptedDataError(CryptoError):
    """Encrypted data corrupted or tampered"""
```

---

### 1.3 DB-Schema erweitern

**Migration:** `backend/app/db.py`

**Neue Tabelle: `keychain`**
```sql
CREATE TABLE IF NOT EXISTS keychain (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton pattern
    encrypted_master_key TEXT NOT NULL,      -- Master key encrypted with user password
    salt TEXT NOT NULL,                      -- Salt for password KDF
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER DEFAULT 1                -- For future crypto upgrades
);
```

**Erweiterte Tabelle: `sessions`**
```sql
-- Add new columns
ALTER TABLE sessions ADD COLUMN encrypted_session_key TEXT;
ALTER TABLE sessions ADD COLUMN session_salt TEXT;
ALTER TABLE sessions ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Migration Logic:**
```python
def migrate_encryption_schema():
    with db() as conn:
        # Check if keychain table exists
        exists = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='keychain'"
        ).fetchone()

        if not exists:
            conn.execute("""
                CREATE TABLE keychain (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    encrypted_master_key TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    version INTEGER DEFAULT 1
                )
            """)

        # Add columns to sessions if not exist
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(sessions)").fetchall()]

        if "encrypted_session_key" not in cols:
            conn.execute("ALTER TABLE sessions ADD COLUMN encrypted_session_key TEXT")
        if "session_salt" not in cols:
            conn.execute("ALTER TABLE sessions ADD COLUMN session_salt TEXT")
        if "encryption_version" not in cols:
            conn.execute("ALTER TABLE sessions ADD COLUMN encryption_version INTEGER DEFAULT 1")
```

---

### 1.4 Keychain-Manager

**File:** `backend/app/keychain.py`

```python
class KeychainManager:
    """Manages master key and session keys"""

    @staticmethod
    def initialize(password: str) -> dict:
        """Initialize keychain with master password (first-time setup)"""
        # 1. Generate master key
        master_key = generate_master_key()

        # 2. Generate salt
        salt = os.urandom(16)

        # 3. Encrypt master key with password
        encrypted = encrypt_master_key(master_key, password, salt)

        # 4. Save to DB
        with db() as conn:
            conn.execute("""
                INSERT INTO keychain (id, encrypted_master_key, salt, created_at, updated_at)
                VALUES (1, ?, ?, ?, ?)
            """, (
                json.dumps(encrypted),
                salt.hex(),
                _utcnow(),
                _utcnow()
            ))

        return {"status": "initialized"}

    @staticmethod
    def is_initialized() -> bool:
        """Check if keychain exists"""
        with db() as conn:
            row = conn.execute("SELECT id FROM keychain WHERE id = 1").fetchone()
        return bool(row)

    @staticmethod
    def unlock(password: str) -> bytes:
        """Unlock keychain and return master key"""
        with db() as conn:
            row = conn.execute(
                "SELECT encrypted_master_key, salt FROM keychain WHERE id = 1"
            ).fetchone()

        if not row:
            raise ValueError("Keychain not initialized")

        encrypted = json.loads(row["encrypted_master_key"])

        try:
            master_key = decrypt_master_key(encrypted, password)
        except Exception:
            raise InvalidPasswordError("Incorrect password")

        return master_key

    @staticmethod
    def change_password(old_password: str, new_password: str):
        """Change master password without re-encrypting all data"""
        # 1. Unlock with old password
        master_key = KeychainManager.unlock(old_password)

        # 2. Re-encrypt master key with new password
        with db() as conn:
            row = conn.execute("SELECT salt FROM keychain WHERE id = 1").fetchone()
            salt = bytes.fromhex(row["salt"])

        # Use same salt (or generate new one - security tradeoff)
        new_salt = os.urandom(16)  # New salt = better security
        encrypted = encrypt_master_key(master_key, new_password, new_salt)

        # 3. Update DB
        with db() as conn:
            conn.execute("""
                UPDATE keychain
                SET encrypted_master_key = ?, salt = ?, updated_at = ?
                WHERE id = 1
            """, (
                json.dumps(encrypted),
                new_salt.hex(),
                _utcnow()
            ))

    @staticmethod
    def create_session_key(session_id: str, master_key: bytes) -> bytes:
        """Generate and encrypt a new session key"""
        # 1. Generate random session key
        session_key = generate_session_key()

        # 2. Encrypt with master key
        encrypted = encrypt_session_key(session_key, master_key)

        # 3. Generate salt for this session
        session_salt = os.urandom(16)

        # 4. Save to DB
        with db() as conn:
            conn.execute("""
                UPDATE sessions
                SET encrypted_session_key = ?, session_salt = ?, encryption_version = 1
                WHERE id = ?
            """, (
                json.dumps(encrypted),
                session_salt.hex(),
                session_id
            ))

        return session_key

    @staticmethod
    def get_session_key(session_id: str, master_key: bytes) -> bytes:
        """Decrypt and return session key"""
        with db() as conn:
            row = conn.execute(
                "SELECT encrypted_session_key FROM sessions WHERE id = ?",
                (session_id,)
            ).fetchone()

        if not row or not row["encrypted_session_key"]:
            raise ValueError("Session has no encryption key")

        encrypted = json.loads(row["encrypted_session_key"])
        session_key = decrypt_session_key(encrypted, master_key)

        return session_key
```

---

### 1.5 API-Models erweitern

**File:** `backend/app/models.py`

```python
# Keychain Management
class InitializeKeychainRequest(BaseModel):
    password: str = Field(min_length=12, max_length=128)
    # Optional: recovery phrase generation
    generate_recovery_phrase: bool = False

class UnlockKeychainRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)

# Session Creation (with encryption)
class CreateSessionRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    template_id: str
    password: str = Field(min_length=1, max_length=128)  # Required for encryption

# Save Responses (with encryption)
class SaveResponsesRequest(BaseModel):
    responses: Dict[str, Any]
    password: str = Field(min_length=1, max_length=128)  # Required
```

---

### 1.6 API-Endpoints

**File:** `backend/app/routes.py`

```python
# Keychain Management Endpoints
@api_router.post("/keychain/initialize")
def initialize_keychain(req: InitializeKeychainRequest):
    """First-time setup: Create master password"""
    if KeychainManager.is_initialized():
        raise HTTPException(400, "Keychain already initialized")

    result = KeychainManager.initialize(req.password)

    # Optional: Generate recovery phrase
    if req.generate_recovery_phrase:
        recovery_phrase = generate_recovery_phrase()
        # Store encrypted with master key
        # ... implementation
        result["recovery_phrase"] = recovery_phrase

    return result

@api_router.get("/keychain/status")
def keychain_status():
    """Check if keychain is initialized"""
    return {"initialized": KeychainManager.is_initialized()}

@api_router.post("/keychain/unlock")
def unlock_keychain(req: UnlockKeychainRequest):
    """Verify password (returns session token for frontend)"""
    try:
        master_key = KeychainManager.unlock(req.password)
        # Don't send master key to frontend!
        # Instead: Generate temporary auth token (store in memory)
        token = generate_auth_token()
        store_master_key_in_memory(token, master_key)

        return {"status": "unlocked", "token": token}
    except InvalidPasswordError:
        raise HTTPException(401, "Incorrect password")

@api_router.post("/keychain/change-password")
def change_keychain_password(req: ChangePasswordRequest):
    """Change master password"""
    try:
        KeychainManager.change_password(req.old_password, req.new_password)
        return {"status": "password_changed"}
    except InvalidPasswordError:
        raise HTTPException(401, "Incorrect old password")

# Modified Session Endpoints
@api_router.post("/sessions")
def create_session(req: CreateSessionRequest):
    """Create session with encryption"""
    # Verify template exists
    try:
        load_template(req.template_id)
    except KeyError:
        raise HTTPException(400, "Invalid template_id")

    # Unlock keychain
    try:
        master_key = KeychainManager.unlock(req.password)
    except InvalidPasswordError:
        raise HTTPException(401, "Incorrect password")

    session_id = str(uuid.uuid4())
    created_at = _utcnow()

    # Create session
    storage.create_session(
        session_id=session_id,
        name=req.name,
        template_id=req.template_id,
        created_at=created_at,
    )

    # Create and encrypt session key
    session_key = KeychainManager.create_session_key(session_id, master_key)

    return SessionListItem(
        id=session_id,
        name=req.name,
        template_id=req.template_id,
        created_at=created_at,
        has_a=False,
        has_b=False,
    )

# Modified Save/Load Responses
@api_router.post("/sessions/{session_id}/responses/{person}/save")
def save_responses(session_id: str, person: str, req: SaveResponsesRequest):
    """Save encrypted responses"""
    if person not in ("A", "B"):
        raise HTTPException(400, "Invalid person")

    srow = _load_session_row(session_id)

    # Unlock and get session key
    try:
        master_key = KeychainManager.unlock(req.password)
        session_key = KeychainManager.get_session_key(session_id, master_key)
    except InvalidPasswordError:
        raise HTTPException(401, "Incorrect password")
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Validate responses
    tpl = load_template(srow["template_id"])
    validation_errors, validation_warnings = validate_responses(tpl, req.responses)

    if validation_errors:
        return JSONResponse(
            status_code=400,
            content={
                "message": "Validation errors",
                "errors": validation_errors,
                "warnings": validation_warnings,
            },
        )

    # Encrypt responses
    plaintext = json.dumps(req.responses, ensure_ascii=False)
    encrypted = encrypt_data(plaintext, session_key)

    # Save encrypted data
    now = _utcnow()
    storage.save_responses(
        session_id=session_id,
        person=person,
        responses=encrypted,  # <- Encrypted!
        updated_at=now
    )

    return {"ok": True, "updated_at": now}

@api_router.post("/sessions/{session_id}/responses/{person}/load")
def load_responses(session_id: str, person: str, req: LoadResponsesRequest):
    """Load and decrypt responses"""
    if person not in ("A", "B"):
        raise HTTPException(400, "Invalid person")

    srow = _load_session_row(session_id)
    data = storage.load_responses(session_id=session_id, person=person)

    if not data:
        return {"responses": {}}

    # Check if encrypted
    if is_encrypted(data):
        # Password required in request
        if not hasattr(req, 'password') or not req.password:
            raise HTTPException(401, "Password required for encrypted session")

        try:
            master_key = KeychainManager.unlock(req.password)
            session_key = KeychainManager.get_session_key(session_id, master_key)
            plaintext = decrypt_data(data, session_key)
            return {"responses": json.loads(plaintext)}
        except InvalidPasswordError:
            raise HTTPException(401, "Incorrect password")
        except Exception as e:
            raise HTTPException(500, f"Decryption failed: {str(e)}")
    else:
        # Legacy unencrypted data
        return {"responses": data}
```

---

## Phase 2: Testing (Week 1-2)

### 2.1 Unit-Tests für Crypto

**File:** `backend/tests/test_crypto.py`

```python
import pytest
from app.crypto import (
    derive_key_from_password,
    generate_master_key,
    encrypt_master_key,
    decrypt_master_key,
    encrypt_data,
    decrypt_data,
    InvalidPasswordError,
)

def test_key_derivation_deterministic():
    """Same password + salt = same key"""
    password = "test_password_123"
    salt = b"fixed_salt_16byt"

    key1 = derive_key_from_password(password, salt)
    key2 = derive_key_from_password(password, salt)

    assert key1 == key2
    assert len(key1) == 32  # 256 bits

def test_key_derivation_different_salts():
    """Same password, different salts = different keys"""
    password = "test_password_123"
    salt1 = b"salt_number_one_"
    salt2 = b"salt_number_two_"

    key1 = derive_key_from_password(password, salt1)
    key2 = derive_key_from_password(password, salt2)

    assert key1 != key2

def test_master_key_encryption_decryption():
    """Encrypt and decrypt master key"""
    master_key = generate_master_key()
    password = "strong_password_456"
    salt = os.urandom(16)

    encrypted = encrypt_master_key(master_key, password, salt)
    decrypted = decrypt_master_key(encrypted, password)

    assert decrypted == master_key

def test_wrong_password_raises():
    """Wrong password should raise InvalidPasswordError"""
    master_key = generate_master_key()
    salt = os.urandom(16)

    encrypted = encrypt_master_key(master_key, "correct_password", salt)

    with pytest.raises(Exception):  # InvalidTag or InvalidPasswordError
        decrypt_master_key(encrypted, "wrong_password")

def test_data_encryption_roundtrip():
    """Encrypt and decrypt data"""
    key = os.urandom(32)
    plaintext = "Sensitive data here 🔒"

    encrypted = encrypt_data(plaintext, key)
    decrypted = decrypt_data(encrypted, key)

    assert decrypted == plaintext

def test_nonce_uniqueness():
    """Each encryption should use unique nonce"""
    key = os.urandom(32)
    plaintext = "Same data"

    enc1 = encrypt_data(plaintext, key)
    enc2 = encrypt_data(plaintext, key)

    # Nonces must be different
    assert enc1["nonce"] != enc2["nonce"]
    # Ciphertexts must be different (different nonces)
    assert enc1["ciphertext"] != enc2["ciphertext"]
```

### 2.2 Integration-Tests

**File:** `backend/tests/test_encryption_flow.py`

```python
def test_full_encryption_workflow(client):
    """Test complete encrypted session flow"""
    # 1. Initialize keychain
    resp = client.post("/api/keychain/initialize", json={
        "password": "master_password_123",
        "generate_recovery_phrase": False
    })
    assert resp.status_code == 200

    # 2. Create encrypted session
    resp = client.post("/api/sessions", json={
        "name": "Test Session",
        "template_id": "unified_v1",
        "password": "master_password_123"
    })
    assert resp.status_code == 200
    session_id = resp.json()["id"]

    # 3. Save encrypted responses
    responses = {
        "Q1": {"status": "YES", "interest": 3, "comfort": 3}
    }
    resp = client.post(f"/api/sessions/{session_id}/responses/A/save", json={
        "responses": responses,
        "password": "master_password_123"
    })
    assert resp.status_code == 200

    # 4. Load encrypted responses
    resp = client.post(f"/api/sessions/{session_id}/responses/A/load", json={
        "password": "master_password_123"
    })
    assert resp.status_code == 200
    loaded = resp.json()["responses"]
    assert loaded == responses

    # 5. Verify wrong password fails
    resp = client.post(f"/api/sessions/{session_id}/responses/A/load", json={
        "password": "wrong_password"
    })
    assert resp.status_code == 401
```

---

## Phase 3: Frontend (Week 2)

### 3.1 Web Crypto API Wrapper

**File:** `apps/web/web/crypto.js`

```javascript
// crypto.js - Web Crypto API wrapper (mirrors backend)

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
            salt: hexToArrayBuffer(salt),
            iterations: 600000,  // Match backend
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(plaintext, passwordOrKey, salt) {
    // ... implementation
}

async function decryptData(encrypted, passwordOrKey) {
    // ... implementation
}

// Utility functions
function hexToArrayBuffer(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
```

### 3.2 Keychain UI

**Modaler Dialog für Master-Password:**
```javascript
// On app start:
if (!keychainInitialized) {
    showSetupModal();  // Create master password
} else {
    showUnlockModal();  // Enter master password
}

// Store unlocked state in memory (NOT localStorage!)
let masterPasswordInMemory = null;

async function unlockKeychain(password) {
    const resp = await api("/api/keychain/unlock", {
        method: "POST",
        body: JSON.stringify({ password })
    });

    if (resp.ok) {
        const { token } = await resp.json();
        masterPasswordInMemory = password;  // Keep in RAM only
        sessionStorage.setItem("auth_token", token);
    } else {
        throw new Error("Incorrect password");
    }
}
```

---

## Timeline

**Week 1 (Backend):**
- Day 1-2: Crypto-Module + Keychain (8-10h)
- Day 3: DB-Migration + Tests (4-5h)
- Day 4-5: API-Endpoints + Integration-Tests (6-8h)

**Week 2 (Frontend):**
- Day 1-2: Web Crypto + UI (6-8h)
- Day 3: Offline-Mode (IndexedDB Encryption) (4-5h)
- Day 4: Mobile App (Secure Storage) (4-6h)
- Day 5: Testing + Polish (4h)

**Week 3 (Migration & Docs):**
- Migration-Tool für existierende Daten (4h)
- Dokumentation + User-Guide (3h)
- Final Security-Review (2h)

**Total:** ~45-50h (optimistisch 20h, realistisch 40-50h mit Testing/Debugging)

---

## Nächste Schritte (JETZT)

1. Dependencies installieren
2. Crypto-Module implementieren
3. DB-Migration
4. Tests schreiben
5. API-Endpoints

**Soll ich mit Step 1 starten?**
