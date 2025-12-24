import os
import pytest
from app.crypto import (
    create_key_material,
    verify_password,
    encrypt_json,
    decrypt_json,
    hash_pin,
    verify_pin,
    KeyMaterial
)


class TestCreateKeyMaterial:
    """Tests for create_key_material function."""
    
    def test_create_key_material_without_salt(self):
        """Test that key material is created without salt (salt is generated)."""
        password = "test_password"
        km = create_key_material(password)
        
        assert isinstance(km, KeyMaterial)
        assert len(km.salt) == 16
        assert len(km.fernet_key) > 0
        assert len(km.verifier) == 64  # SHA256 hex digest
        
    def test_create_key_material_with_salt(self):
        """Test that key material uses provided salt."""
        password = "test_password"
        salt = os.urandom(16)
        km1 = create_key_material(password, salt=salt)
        km2 = create_key_material(password, salt=salt)
        
        assert km1.salt == salt
        assert km2.salt == salt
        assert km1.fernet_key == km2.fernet_key
        assert km1.verifier == km2.verifier
        
    def test_create_key_material_different_salts(self):
        """Test that different salts produce different keys."""
        password = "test_password"
        km1 = create_key_material(password)
        km2 = create_key_material(password)
        
        assert km1.salt != km2.salt
        assert km1.fernet_key != km2.fernet_key
        assert km1.verifier != km2.verifier
        
    def test_create_key_material_different_passwords(self):
        """Test that different passwords produce different verifiers."""
        salt = os.urandom(16)
        km1 = create_key_material("password1", salt=salt)
        km2 = create_key_material("password2", salt=salt)
        
        assert km1.salt == km2.salt
        assert km1.verifier != km2.verifier


class TestVerifyPassword:
    """Tests for verify_password function."""
    
    def test_verify_password_correct(self):
        """Test that correct password verifies successfully."""
        password = "test_password"
        km = create_key_material(password)
        
        assert verify_password(password, km.salt, km.verifier) is True
        
    def test_verify_password_incorrect(self):
        """Test that incorrect password fails verification."""
        password = "test_password"
        km = create_key_material(password)
        wrong_password = "wrong_password"
        
        assert verify_password(wrong_password, km.salt, km.verifier) is False
        
    def test_verify_password_empty_string(self):
        """Test verification with empty password."""
        password = ""
        km = create_key_material(password)
        
        assert verify_password(password, km.salt, km.verifier) is True
        assert verify_password("not_empty", km.salt, km.verifier) is False
        
    def test_verify_password_unicode(self):
        """Test verification with unicode characters."""
        password = "pässwörd_测试_🔐"
        km = create_key_material(password)
        
        assert verify_password(password, km.salt, km.verifier) is True
        assert verify_password("wrong", km.salt, km.verifier) is False


class TestEncryptDecryptJson:
    """Tests for encrypt_json and decrypt_json functions."""
    
    def test_encrypt_decrypt_roundtrip(self):
        """Test that encrypting and decrypting returns original data."""
        password = "test_password"
        salt = os.urandom(16)
        plaintext = '{"key": "value", "number": 42}'
        
        ciphertext = encrypt_json(password, salt, plaintext)
        decrypted = decrypt_json(password, salt, ciphertext)
        
        assert decrypted == plaintext
        
    def test_encrypt_decrypt_unicode(self):
        """Test encryption/decryption with unicode characters."""
        password = "test_password"
        salt = os.urandom(16)
        plaintext = '{"message": "Hello 世界 🌍", "emoji": "🔐"}'
        
        ciphertext = encrypt_json(password, salt, plaintext)
        decrypted = decrypt_json(password, salt, ciphertext)
        
        assert decrypted == plaintext
        
    def test_encrypt_decrypt_empty_string(self):
        """Test encryption/decryption of empty string."""
        password = "test_password"
        salt = os.urandom(16)
        plaintext = ""
        
        ciphertext = encrypt_json(password, salt, plaintext)
        decrypted = decrypt_json(password, salt, ciphertext)
        
        assert decrypted == plaintext
        
    def test_decrypt_wrong_password(self):
        """Test that decrypting with wrong password raises ValueError."""
        password = "test_password"
        wrong_password = "wrong_password"
        salt = os.urandom(16)
        plaintext = '{"key": "value"}'
        
        ciphertext = encrypt_json(password, salt, plaintext)
        
        with pytest.raises(ValueError, match="Decrypt failed"):
            decrypt_json(wrong_password, salt, ciphertext)
            
    def test_decrypt_wrong_salt(self):
        """Test that decrypting with wrong salt raises ValueError."""
        password = "test_password"
        salt1 = os.urandom(16)
        salt2 = os.urandom(16)
        plaintext = '{"key": "value"}'
        
        ciphertext = encrypt_json(password, salt1, plaintext)
        
        with pytest.raises(ValueError, match="Decrypt failed"):
            decrypt_json(password, salt2, ciphertext)
            
    def test_encrypt_decrypt_large_data(self):
        """Test encryption/decryption of large JSON data."""
        password = "test_password"
        salt = os.urandom(16)
        # Create a large JSON structure
        data = {"items": [{"id": i, "data": "x" * 100} for i in range(100)]}
        plaintext = str(data).replace("'", '"')
        
        ciphertext = encrypt_json(password, salt, plaintext)
        decrypted = decrypt_json(password, salt, ciphertext)
        
        assert decrypted == plaintext


class TestHashPin:
    """Tests for hash_pin function."""
    
    def test_hash_pin_basic(self):
        """Test basic PIN hashing."""
        pin = "1234"
        salt = os.urandom(16)
        person = "A"
        
        hash1 = hash_pin(pin, salt, person)
        hash2 = hash_pin(pin, salt, person)
        
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 hex digest
        assert hash1 == hash2  # Same inputs should produce same hash
        
    def test_hash_pin_different_salts(self):
        """Test that different salts produce different hashes."""
        pin = "1234"
        salt1 = os.urandom(16)
        salt2 = os.urandom(16)
        person = "A"
        
        hash1 = hash_pin(pin, salt1, person)
        hash2 = hash_pin(pin, salt2, person)
        
        assert hash1 != hash2
        
    def test_hash_pin_different_persons(self):
        """Test that same PIN with different persons produces different hashes."""
        pin = "1234"
        salt = os.urandom(16)
        
        hash_a = hash_pin(pin, salt, "A")
        hash_b = hash_pin(pin, salt, "B")
        
        assert hash_a != hash_b
        
    def test_hash_pin_different_pins(self):
        """Test that different PINs produce different hashes."""
        salt = os.urandom(16)
        person = "A"
        
        hash1 = hash_pin("1234", salt, person)
        hash2 = hash_pin("5678", salt, person)
        
        assert hash1 != hash2
        
    def test_hash_pin_empty_string(self):
        """Test hashing empty PIN string."""
        pin = ""
        salt = os.urandom(16)
        person = "A"
        
        hash_result = hash_pin(pin, salt, person)
        assert isinstance(hash_result, str)
        assert len(hash_result) == 64


class TestVerifyPin:
    """Tests for verify_pin function."""
    
    def test_verify_pin_correct(self):
        """Test that correct PIN verifies successfully."""
        pin = "1234"
        salt = os.urandom(16)
        person = "A"
        stored_hash = hash_pin(pin, salt, person)
        
        assert verify_pin(pin, stored_hash, salt, person) is True
        
    def test_verify_pin_incorrect(self):
        """Test that incorrect PIN fails verification."""
        pin = "1234"
        wrong_pin = "5678"
        salt = os.urandom(16)
        person = "A"
        stored_hash = hash_pin(pin, salt, person)
        
        assert verify_pin(wrong_pin, stored_hash, salt, person) is False
        
    def test_verify_pin_none_stored_hash(self):
        """Test that None stored_hash returns True (no PIN required)."""
        pin = "1234"
        salt = os.urandom(16)
        person = "A"
        
        assert verify_pin(pin, None, salt, person) is True
        assert verify_pin(None, None, salt, person) is True
        assert verify_pin("", None, salt, person) is True
        
    def test_verify_pin_none_pin_with_stored_hash(self):
        """Test that None PIN with stored hash returns False."""
        pin = "1234"
        salt = os.urandom(16)
        person = "A"
        stored_hash = hash_pin(pin, salt, person)
        
        assert verify_pin(None, stored_hash, salt, person) is False
        assert verify_pin("", stored_hash, salt, person) is False
        
    def test_verify_pin_wrong_person(self):
        """Test that PIN verified with wrong person fails."""
        pin = "1234"
        salt = os.urandom(16)
        hash_a = hash_pin(pin, salt, "A")
        
        # PIN hash for person A should not verify for person B
        assert verify_pin(pin, hash_a, salt, "B") is False
        
    def test_verify_pin_empty_string(self):
        """Test verification with empty PIN string."""
        pin = ""
        salt = os.urandom(16)
        person = "A"
        stored_hash = hash_pin(pin, salt, person)
        
        assert verify_pin("", stored_hash, salt, person) is True
        assert verify_pin("not_empty", stored_hash, salt, person) is False
        
    def test_verify_pin_unicode(self):
        """Test verification with unicode PIN."""
        pin = "测试🔐"
        salt = os.urandom(16)
        person = "A"
        stored_hash = hash_pin(pin, salt, person)
        
        assert verify_pin(pin, stored_hash, salt, person) is True
        assert verify_pin("wrong", stored_hash, salt, person) is False





