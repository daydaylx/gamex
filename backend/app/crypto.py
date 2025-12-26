"""
Cryptography module for hybrid encryption system.

Uses industry-standard cryptography:
- PBKDF2-SHA256 for key derivation (600k iterations, OWASP 2023)
- AES-256-GCM for encryption (authenticated encryption)
- Secure random from os.urandom (cryptographically secure)
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidTag


# Constants
PBKDF2_ITERATIONS = 600_000  # OWASP 2023 recommendation
AES_KEY_SIZE = 32  # 256 bits
NONCE_SIZE = 12  # 96 bits for GCM
SALT_SIZE = 16  # 128 bits


class CryptoError(Exception):
    """Base exception for crypto errors"""
    pass


class InvalidPasswordError(CryptoError):
    """Password incorrect or key derivation failed"""
    pass


class CorruptedDataError(CryptoError):
    """Encrypted data corrupted or tampered"""
    pass


def derive_key_from_password(password: str, salt: bytes) -> bytes:
    """
    Derive encryption key from password using PBKDF2-SHA256.

    Args:
        password: User password
        salt: Random salt (16 bytes recommended)

    Returns:
        32-byte key for AES-256

    Example:
        >>> salt = os.urandom(16)
        >>> key = derive_key_from_password("my_password", salt)
        >>> len(key)
        32
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=AES_KEY_SIZE,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(password.encode("utf-8"))


def generate_master_key() -> bytes:
    """
    Generate cryptographically secure random master key.

    Returns:
        32-byte random key

    Example:
        >>> key = generate_master_key()
        >>> len(key)
        32
    """
    return os.urandom(AES_KEY_SIZE)


def generate_session_key() -> bytes:
    """
    Generate cryptographically secure random session key.

    Returns:
        32-byte random key
    """
    return os.urandom(AES_KEY_SIZE)


def encrypt_with_key(plaintext: bytes, key: bytes) -> Dict[str, str]:
    """
    Encrypt data with AES-256-GCM.

    Args:
        plaintext: Data to encrypt (bytes)
        key: 32-byte encryption key

    Returns:
        Dict with ciphertext, nonce, algorithm metadata

    Example:
        >>> key = os.urandom(32)
        >>> encrypted = encrypt_with_key(b"secret data", key)
        >>> "ciphertext" in encrypted and "nonce" in encrypted
        True
    """
    if len(key) != AES_KEY_SIZE:
        raise ValueError(f"Key must be {AES_KEY_SIZE} bytes, got {len(key)}")

    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_SIZE)

    ciphertext = aesgcm.encrypt(nonce, plaintext, None)

    return {
        "ciphertext": ciphertext.hex(),
        "nonce": nonce.hex(),
        "algorithm": "AES-256-GCM",
        "kdf": "PBKDF2-SHA256-600k",
    }


def decrypt_with_key(encrypted: Dict[str, str], key: bytes) -> bytes:
    """
    Decrypt data encrypted with AES-256-GCM.

    Args:
        encrypted: Dict from encrypt_with_key()
        key: 32-byte encryption key

    Returns:
        Decrypted plaintext (bytes)

    Raises:
        InvalidPasswordError: If wrong key or data corrupted
    """
    if len(key) != AES_KEY_SIZE:
        raise ValueError(f"Key must be {AES_KEY_SIZE} bytes, got {len(key)}")

    try:
        aesgcm = AESGCM(key)
        nonce = bytes.fromhex(encrypted["nonce"])
        ciphertext = bytes.fromhex(encrypted["ciphertext"])

        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext

    except InvalidTag:
        raise InvalidPasswordError("Incorrect key or corrupted data")
    except (KeyError, ValueError) as e:
        raise CorruptedDataError(f"Invalid encrypted data format: {e}")


def encrypt_master_key(master_key: bytes, password: str, salt: bytes) -> Dict[str, str]:
    """
    Encrypt master key with user password.

    Args:
        master_key: 32-byte master key to encrypt
        password: User password
        salt: Salt for key derivation

    Returns:
        Encrypted master key with metadata
    """
    key = derive_key_from_password(password, salt)
    encrypted = encrypt_with_key(master_key, key)
    encrypted["salt"] = salt.hex()
    return encrypted


def decrypt_master_key(encrypted: Dict[str, str], password: str) -> bytes:
    """
    Decrypt master key with user password.

    Args:
        encrypted: Encrypted master key from encrypt_master_key()
        password: User password

    Returns:
        Decrypted master key (32 bytes)

    Raises:
        InvalidPasswordError: If password incorrect
    """
    try:
        salt = bytes.fromhex(encrypted["salt"])
        key = derive_key_from_password(password, salt)
        master_key = decrypt_with_key(encrypted, key)
        return master_key
    except InvalidTag:
        raise InvalidPasswordError("Incorrect password")


def encrypt_session_key(session_key: bytes, master_key: bytes) -> Dict[str, str]:
    """
    Encrypt session key with master key.

    Args:
        session_key: 32-byte session key
        master_key: 32-byte master key

    Returns:
        Encrypted session key
    """
    return encrypt_with_key(session_key, master_key)


def decrypt_session_key(encrypted: Dict[str, str], master_key: bytes) -> bytes:
    """
    Decrypt session key with master key.

    Args:
        encrypted: Encrypted session key
        master_key: 32-byte master key

    Returns:
        Decrypted session key (32 bytes)
    """
    return decrypt_with_key(encrypted, master_key)


def encrypt_data(plaintext: str, key: bytes) -> Dict[str, Any]:
    """
    Encrypt string data with AES-256-GCM.

    Args:
        plaintext: String to encrypt
        key: 32-byte encryption key

    Returns:
        Encrypted data with metadata
    """
    plaintext_bytes = plaintext.encode("utf-8")
    return encrypt_with_key(plaintext_bytes, key)


def decrypt_data(encrypted: Dict[str, Any], key: bytes) -> str:
    """
    Decrypt string data.

    Args:
        encrypted: Encrypted data from encrypt_data()
        key: 32-byte encryption key

    Returns:
        Decrypted string

    Raises:
        InvalidPasswordError: If wrong key
        CorruptedDataError: If data corrupted
    """
    plaintext_bytes = decrypt_with_key(encrypted, key)
    return plaintext_bytes.decode("utf-8")


def is_encrypted(data: Any) -> bool:
    """
    Check if data is encrypted (has encryption metadata).

    Args:
        data: Any data structure

    Returns:
        True if data appears to be encrypted

    Example:
        >>> encrypted = encrypt_data("test", os.urandom(32))
        >>> is_encrypted(encrypted)
        True
        >>> is_encrypted({"plain": "data"})
        False
    """
    if not isinstance(data, dict):
        return False

    # Check for required encryption fields
    required_fields = {"ciphertext", "nonce", "algorithm"}
    return required_fields.issubset(data.keys())
