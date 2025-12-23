import base64
import hashlib
import os
from dataclasses import dataclass
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

PBKDF_ITERATIONS = 390_000

@dataclass(frozen=True)
class KeyMaterial:
    salt: bytes
    fernet_key: bytes  # urlsafe base64 32 bytes
    verifier: str      # hex

def _derive_raw(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=PBKDF_ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))

def create_key_material(password: str, salt: Optional[bytes] = None) -> KeyMaterial:
    if salt is None:
        salt = os.urandom(16)
    raw = _derive_raw(password, salt)
    fernet_key = base64.urlsafe_b64encode(raw)
    verifier = hashlib.sha256(raw + b"::verifier").hexdigest()
    return KeyMaterial(salt=salt, fernet_key=fernet_key, verifier=verifier)

def verify_password(password: str, salt: bytes, expected_verifier: str) -> bool:
    raw = _derive_raw(password, salt)
    verifier = hashlib.sha256(raw + b"::verifier").hexdigest()
    return hashlib.compare_digest(verifier, expected_verifier)

def encrypt_json(password: str, salt: bytes, plaintext_json: str) -> bytes:
    km = create_key_material(password, salt=salt)
    f = Fernet(km.fernet_key)
    return f.encrypt(plaintext_json.encode("utf-8"))

def decrypt_json(password: str, salt: bytes, ciphertext: bytes) -> str:
    km = create_key_material(password, salt=salt)
    f = Fernet(km.fernet_key)
    try:
        out = f.decrypt(ciphertext)
    except InvalidToken as e:
        raise ValueError("Decrypt failed (wrong password or corrupted data).") from e
    return out.decode("utf-8")

def hash_pin(pin: str, salt: bytes, person: str) -> str:
    # pin hashing separate from encryption; uses PBKDF2 with person-specific salt
    pin_salt = hashlib.sha256(salt + person.encode("utf-8") + b"::pin").digest()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=pin_salt,
        iterations=220_000,
    )
    raw = kdf.derive(pin.encode("utf-8"))
    return hashlib.sha256(raw).hexdigest()

def verify_pin(pin: Optional[str], stored_hash: Optional[str], salt: bytes, person: str) -> bool:
    if stored_hash is None:
        # no pin required
        return True
    if not pin:
        return False
    candidate = hash_pin(pin, salt, person)
    return hashlib.compare_digest(candidate, stored_hash)


