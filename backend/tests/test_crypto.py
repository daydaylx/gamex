"""
Unit tests for cryptography module (app/crypto.py).

Tests key derivation, encryption/decryption, and error handling.
"""

import os
import pytest

from app.crypto import (
    derive_key_from_password,
    generate_master_key,
    generate_session_key,
    encrypt_with_key,
    decrypt_with_key,
    encrypt_master_key,
    decrypt_master_key,
    encrypt_session_key,
    decrypt_session_key,
    encrypt_data,
    decrypt_data,
    is_encrypted,
    InvalidPasswordError,
    CorruptedDataError,
)


class TestKeyDerivation:
    """Test PBKDF2 key derivation"""

    def test_deterministic_key_derivation(self):
        """Same password + salt = same key"""
        password = "test_password_strong_123"
        salt = b"fixed_salt_16byt"

        key1 = derive_key_from_password(password, salt)
        key2 = derive_key_from_password(password, salt)

        assert key1 == key2
        assert len(key1) == 32  # 256 bits

    def test_different_salts_different_keys(self):
        """Same password, different salts = different keys"""
        password = "test_password_strong_123"
        salt1 = b"salt_number_one_"
        salt2 = b"salt_number_two_"

        key1 = derive_key_from_password(password, salt1)
        key2 = derive_key_from_password(password, salt2)

        assert key1 != key2

    def test_different_passwords_different_keys(self):
        """Different passwords, same salt = different keys"""
        salt = b"fixed_salt_16byt"
        key1 = derive_key_from_password("password1", salt)
        key2 = derive_key_from_password("password2", salt)

        assert key1 != key2


class TestKeyGeneration:
    """Test random key generation"""

    def test_master_key_generation(self):
        """Master key is 32 bytes and random"""
        key1 = generate_master_key()
        key2 = generate_master_key()

        assert len(key1) == 32
        assert len(key2) == 32
        assert key1 != key2  # Should be random

    def test_session_key_generation(self):
        """Session key is 32 bytes and random"""
        key1 = generate_session_key()
        key2 = generate_session_key()

        assert len(key1) == 32
        assert len(key2) == 32
        assert key1 != key2  # Should be random


class TestEncryptionDecryption:
    """Test AES-256-GCM encryption/decryption"""

    def test_encrypt_decrypt_roundtrip(self):
        """Encrypt then decrypt returns original data"""
        key = os.urandom(32)
        plaintext = b"Sensitive data that needs protection"

        encrypted = encrypt_with_key(plaintext, key)
        decrypted = decrypt_with_key(encrypted, key)

        assert decrypted == plaintext

    def test_encrypted_format(self):
        """Encrypted data has required fields"""
        key = os.urandom(32)
        plaintext = b"test data"

        encrypted = encrypt_with_key(plaintext, key)

        assert "ciphertext" in encrypted
        assert "nonce" in encrypted
        assert "algorithm" in encrypted
        assert encrypted["algorithm"] == "AES-256-GCM"

    def test_nonce_uniqueness(self):
        """Each encryption uses unique nonce"""
        key = os.urandom(32)
        plaintext = b"Same data encrypted twice"

        enc1 = encrypt_with_key(plaintext, key)
        enc2 = encrypt_with_key(plaintext, key)

        # Nonces must be different
        assert enc1["nonce"] != enc2["nonce"]
        # Ciphertexts must be different (different nonces)
        assert enc1["ciphertext"] != enc2["ciphertext"]

    def test_wrong_key_fails(self):
        """Decrypting with wrong key raises error"""
        key1 = os.urandom(32)
        key2 = os.urandom(32)
        plaintext = b"secret data"

        encrypted = encrypt_with_key(plaintext, key1)

        with pytest.raises(InvalidPasswordError):
            decrypt_with_key(encrypted, key2)

    def test_corrupted_ciphertext_fails(self):
        """Decrypting tampered ciphertext raises error"""
        key = os.urandom(32)
        plaintext = b"secret data"

        encrypted = encrypt_with_key(plaintext, key)

        # Tamper with ciphertext
        encrypted["ciphertext"] = encrypted["ciphertext"][:-2] + "ff"

        with pytest.raises(InvalidPasswordError):
            decrypt_with_key(encrypted, key)

    def test_invalid_key_size_fails(self):
        """Using wrong key size raises error"""
        short_key = os.urandom(16)  # Only 128 bits
        plaintext = b"test"

        with pytest.raises(ValueError, match="Key must be 32 bytes"):
            encrypt_with_key(plaintext, short_key)


class TestMasterKeyEncryption:
    """Test master key encryption with password"""

    def test_master_key_encrypt_decrypt(self):
        """Encrypt and decrypt master key with password"""
        master_key = generate_master_key()
        password = "very_strong_password_12345"
        salt = os.urandom(16)

        encrypted = encrypt_master_key(master_key, password, salt)
        decrypted = decrypt_master_key(encrypted, password)

        assert decrypted == master_key

    def test_wrong_password_fails(self):
        """Decrypting master key with wrong password fails"""
        master_key = generate_master_key()
        correct_password = "correct_password_123"
        wrong_password = "wrong_password_456"
        salt = os.urandom(16)

        encrypted = encrypt_master_key(master_key, correct_password, salt)

        with pytest.raises(InvalidPasswordError):
            decrypt_master_key(encrypted, wrong_password)

    def test_encrypted_master_key_has_salt(self):
        """Encrypted master key includes salt"""
        master_key = generate_master_key()
        password = "test_password"
        salt = os.urandom(16)

        encrypted = encrypt_master_key(master_key, password, salt)

        assert "salt" in encrypted
        assert encrypted["salt"] == salt.hex()


class TestSessionKeyEncryption:
    """Test session key encryption with master key"""

    def test_session_key_encrypt_decrypt(self):
        """Encrypt and decrypt session key with master key"""
        session_key = generate_session_key()
        master_key = generate_master_key()

        encrypted = encrypt_session_key(session_key, master_key)
        decrypted = decrypt_session_key(encrypted, master_key)

        assert decrypted == session_key

    def test_wrong_master_key_fails(self):
        """Decrypting session key with wrong master key fails"""
        session_key = generate_session_key()
        master_key1 = generate_master_key()
        master_key2 = generate_master_key()

        encrypted = encrypt_session_key(session_key, master_key1)

        with pytest.raises(InvalidPasswordError):
            decrypt_session_key(encrypted, master_key2)


class TestDataEncryption:
    """Test high-level data encryption (string-based)"""

    def test_encrypt_decrypt_string(self):
        """Encrypt and decrypt string data"""
        key = os.urandom(32)
        plaintext = "Sensitive user data with unicode: äöü 🔒"

        encrypted = encrypt_data(plaintext, key)
        decrypted = decrypt_data(encrypted, key)

        assert decrypted == plaintext

    def test_is_encrypted_detection(self):
        """is_encrypted() correctly identifies encrypted data"""
        key = os.urandom(32)
        plaintext = "test data"

        encrypted = encrypt_data(plaintext, key)
        assert is_encrypted(encrypted) is True

        unencrypted = {"some": "data", "not": "encrypted"}
        assert is_encrypted(unencrypted) is False

    def test_is_encrypted_with_non_dict(self):
        """is_encrypted() returns False for non-dict"""
        assert is_encrypted("string") is False
        assert is_encrypted(123) is False
        assert is_encrypted([1, 2, 3]) is False
        assert is_encrypted(None) is False

    def test_unicode_handling(self):
        """Encryption handles unicode correctly"""
        key = os.urandom(32)
        plaintext = "Émoji test: 🎉🔐 Ümlauts: äöü"

        encrypted = encrypt_data(plaintext, key)
        decrypted = decrypt_data(encrypted, key)

        assert decrypted == plaintext

    def test_large_data(self):
        """Encryption works with large data"""
        key = os.urandom(32)
        plaintext = "x" * 100000  # 100KB of data

        encrypted = encrypt_data(plaintext, key)
        decrypted = decrypt_data(encrypted, key)

        assert decrypted == plaintext


class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_corrupted_data_error(self):
        """CorruptedDataError raised for invalid encrypted data"""
        key = os.urandom(32)

        invalid_encrypted = {"ciphertext": "invalid_hex_data"}

        with pytest.raises(CorruptedDataError):
            decrypt_with_key(invalid_encrypted, key)

    def test_missing_fields_error(self):
        """Missing required fields raises CorruptedDataError"""
        key = os.urandom(32)

        incomplete = {"ciphertext": "abcd"}  # Missing nonce

        with pytest.raises(CorruptedDataError):
            decrypt_with_key(incomplete, key)
