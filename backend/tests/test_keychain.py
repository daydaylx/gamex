"""
Unit tests for keychain module (app/keychain.py).

Tests master key management, session key management, and password operations.
"""

import json
import os
import pytest
import tempfile
from unittest import mock

from app.keychain import KeychainManager
from app.crypto import InvalidPasswordError
from app.db import init_db, db


@pytest.fixture
def temp_db():
    """Create temporary database for testing"""
    # Create temporary file for test database
    fd, db_path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)

    # Mock the get_db_path to use temp database
    with mock.patch("app.db.get_db_path", return_value=db_path):
        # Initialize database schema
        init_db()

        yield db_path

        # Cleanup
        try:
            os.unlink(db_path)
        except OSError:
            pass


@pytest.fixture
def initialized_keychain(temp_db):
    """Create keychain with initialized master password"""
    with mock.patch("app.db.get_db_path", return_value=temp_db):
        password = "test_password_strong_123"
        KeychainManager.initialize(password)
        yield password


@pytest.fixture
def session_with_data(temp_db, initialized_keychain):
    """Create a test session with encrypted key"""
    password = initialized_keychain

    with mock.patch("app.db.get_db_path", return_value=temp_db):
        # Create test session
        with db() as conn:
            session_id = "test-session-123"
            conn.execute(
                """
                INSERT INTO templates (id, name, version, json, created_at)
                VALUES ('tpl-1', 'Test Template', 1, '{}', datetime('now'))
                """
            )
            conn.execute(
                """
                INSERT INTO sessions (id, name, template_id, created_at)
                VALUES (?, 'Test Session', 'tpl-1', datetime('now'))
                """,
                (session_id,),
            )

        # Create session key
        master_key = KeychainManager.unlock(password)
        session_key = KeychainManager.create_session_key(session_id, master_key)

        yield {
            "session_id": session_id,
            "password": password,
            "session_key": session_key,
        }


class TestKeychainInitialization:
    """Test keychain initialization and status"""

    def test_is_initialized_false_by_default(self, temp_db):
        """New database has no keychain"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            assert KeychainManager.is_initialized() is False

    def test_initialize_creates_keychain(self, temp_db):
        """Initialize creates keychain with encrypted master key"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = "strong_password_12345"
            result = KeychainManager.initialize(password)

            assert result["status"] == "initialized"
            assert "created_at" in result
            assert KeychainManager.is_initialized() is True

    def test_initialize_twice_fails(self, temp_db, initialized_keychain):
        """Cannot initialize keychain twice"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            with pytest.raises(ValueError, match="already initialized"):
                KeychainManager.initialize("another_password")

    def test_initialize_stores_encrypted_master_key(self, temp_db):
        """Initialized keychain stores encrypted master key in database"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = "test_password_strong"
            KeychainManager.initialize(password)

            # Check database contains encrypted key
            with db() as conn:
                row = conn.execute(
                    "SELECT encrypted_master_key, salt FROM keychain WHERE id = 1"
                ).fetchone()

            assert row is not None
            assert row["encrypted_master_key"] is not None
            assert row["salt"] is not None

            # Verify encrypted_master_key is valid JSON
            encrypted = json.loads(row["encrypted_master_key"])
            assert "ciphertext" in encrypted
            assert "nonce" in encrypted
            assert "algorithm" in encrypted


class TestKeychainUnlock:
    """Test keychain unlock and password verification"""

    def test_unlock_with_correct_password(self, temp_db, initialized_keychain):
        """Unlock returns master key with correct password"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain
            master_key = KeychainManager.unlock(password)

            assert isinstance(master_key, bytes)
            assert len(master_key) == 32  # 256 bits

    def test_unlock_with_wrong_password_fails(self, temp_db, initialized_keychain):
        """Unlock fails with wrong password"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            with pytest.raises(InvalidPasswordError, match="Incorrect password"):
                KeychainManager.unlock("wrong_password_123")

    def test_unlock_deterministic(self, temp_db, initialized_keychain):
        """Same password unlocks same master key"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain

            key1 = KeychainManager.unlock(password)
            key2 = KeychainManager.unlock(password)

            assert key1 == key2

    def test_unlock_uninitialized_fails(self, temp_db):
        """Cannot unlock uninitialized keychain"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            with pytest.raises(ValueError, match="not initialized"):
                KeychainManager.unlock("any_password")


class TestPasswordChange:
    """Test master password change"""

    def test_change_password_success(self, temp_db, initialized_keychain):
        """Change password successfully"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            old_password = initialized_keychain
            new_password = "new_strong_password_456"

            # Get original master key
            original_key = KeychainManager.unlock(old_password)

            # Change password
            result = KeychainManager.change_password(old_password, new_password)

            assert result["status"] == "password_changed"
            assert "updated_at" in result

            # Old password no longer works
            with pytest.raises(InvalidPasswordError):
                KeychainManager.unlock(old_password)

            # New password works and returns same master key
            new_key = KeychainManager.unlock(new_password)
            assert new_key == original_key

    def test_change_password_wrong_old_password(self, temp_db, initialized_keychain):
        """Cannot change password with wrong old password"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            with pytest.raises(InvalidPasswordError):
                KeychainManager.change_password(
                    "wrong_old_password",
                    "new_password_123"
                )

    def test_change_password_preserves_session_keys(self, temp_db, session_with_data):
        """Password change doesn't require re-encrypting session keys"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            session_id = session_with_data["session_id"]
            old_password = session_with_data["password"]
            new_password = "brand_new_password_789"

            # Get session key with old password
            old_master_key = KeychainManager.unlock(old_password)
            old_session_key = KeychainManager.get_session_key(session_id, old_master_key)

            # Change password
            KeychainManager.change_password(old_password, new_password)

            # Session key still works with new password
            new_master_key = KeychainManager.unlock(new_password)
            new_session_key = KeychainManager.get_session_key(session_id, new_master_key)

            # Session key unchanged (this is the power of hybrid encryption!)
            assert new_session_key == old_session_key


class TestSessionKeyManagement:
    """Test session key creation and retrieval"""

    def test_create_session_key(self, temp_db, initialized_keychain):
        """Create session key for session"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain

            # Create test session
            with db() as conn:
                session_id = "test-session-create"
                conn.execute(
                    """
                    INSERT INTO templates (id, name, version, json, created_at)
                    VALUES ('tpl-1', 'Test', 1, '{}', datetime('now'))
                    """
                )
                conn.execute(
                    """
                    INSERT INTO sessions (id, name, template_id, created_at)
                    VALUES (?, 'Test', 'tpl-1', datetime('now'))
                    """,
                    (session_id,),
                )

            # Create session key
            master_key = KeychainManager.unlock(password)
            session_key = KeychainManager.create_session_key(session_id, master_key)

            assert isinstance(session_key, bytes)
            assert len(session_key) == 32  # 256 bits

            # Verify encrypted session key stored in database
            with db() as conn:
                row = conn.execute(
                    "SELECT encrypted_session_key, session_salt, encryption_version FROM sessions WHERE id = ?",
                    (session_id,),
                ).fetchone()

            assert row["encrypted_session_key"] is not None
            assert row["session_salt"] is not None
            assert row["encryption_version"] == 1

    def test_create_session_key_randomness(self, temp_db, initialized_keychain):
        """Each session gets unique random key"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain
            master_key = KeychainManager.unlock(password)

            # Create two sessions
            with db() as conn:
                conn.execute(
                    """
                    INSERT INTO templates (id, name, version, json, created_at)
                    VALUES ('tpl-1', 'Test', 1, '{}', datetime('now'))
                    """
                )
                for i in range(2):
                    conn.execute(
                        """
                        INSERT INTO sessions (id, name, template_id, created_at)
                        VALUES (?, ?, 'tpl-1', datetime('now'))
                        """,
                        (f"session-{i}", f"Session {i}"),
                    )

            key1 = KeychainManager.create_session_key("session-0", master_key)
            key2 = KeychainManager.create_session_key("session-1", master_key)

            # Keys must be different (random)
            assert key1 != key2

    def test_get_session_key(self, temp_db, session_with_data):
        """Retrieve session key"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            session_id = session_with_data["session_id"]
            password = session_with_data["password"]
            original_key = session_with_data["session_key"]

            # Retrieve session key
            master_key = KeychainManager.unlock(password)
            retrieved_key = KeychainManager.get_session_key(session_id, master_key)

            assert retrieved_key == original_key

    def test_get_session_key_wrong_master_key_fails(self, temp_db, session_with_data):
        """Cannot decrypt session key with wrong master key"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            session_id = session_with_data["session_id"]

            # Create different keychain with different master key
            with db() as conn:
                conn.execute("DELETE FROM keychain WHERE id = 1")

            KeychainManager.initialize("different_password_123")
            wrong_master_key = KeychainManager.unlock("different_password_123")

            with pytest.raises(InvalidPasswordError):
                KeychainManager.get_session_key(session_id, wrong_master_key)

    def test_get_session_key_unencrypted_session_fails(self, temp_db, initialized_keychain):
        """Cannot get session key from unencrypted session"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain

            # Create unencrypted session (no session key)
            with db() as conn:
                session_id = "unencrypted-session"
                conn.execute(
                    """
                    INSERT INTO templates (id, name, version, json, created_at)
                    VALUES ('tpl-1', 'Test', 1, '{}', datetime('now'))
                    """
                )
                conn.execute(
                    """
                    INSERT INTO sessions (id, name, template_id, created_at)
                    VALUES (?, 'Unencrypted', 'tpl-1', datetime('now'))
                    """,
                    (session_id,),
                )

            master_key = KeychainManager.unlock(password)

            with pytest.raises(ValueError, match="no encryption key"):
                KeychainManager.get_session_key(session_id, master_key)


class TestEncryptionStatus:
    """Test encryption status reporting"""

    def test_encryption_status_uninitialized(self, temp_db):
        """Status for uninitialized keychain"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            status = KeychainManager.get_encryption_status()

            assert status["initialized"] is False
            assert status["total_sessions"] == 0
            assert status["encrypted_sessions"] == 0
            assert status["unencrypted_sessions"] == 0

    def test_encryption_status_initialized(self, temp_db, initialized_keychain):
        """Status for initialized keychain"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            status = KeychainManager.get_encryption_status()

            assert status["initialized"] is True
            assert "created_at" in status
            assert status["version"] == 1

    def test_encryption_status_counts_sessions(self, temp_db, initialized_keychain):
        """Status correctly counts encrypted vs unencrypted sessions"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain
            master_key = KeychainManager.unlock(password)

            # Create sessions
            with db() as conn:
                conn.execute(
                    """
                    INSERT INTO templates (id, name, version, json, created_at)
                    VALUES ('tpl-1', 'Test', 1, '{}', datetime('now'))
                    """
                )

                # 2 unencrypted sessions
                for i in range(2):
                    conn.execute(
                        """
                        INSERT INTO sessions (id, name, template_id, created_at, encryption_version)
                        VALUES (?, ?, 'tpl-1', datetime('now'), 0)
                        """,
                        (f"unenc-{i}", f"Unencrypted {i}"),
                    )

                # 3 encrypted sessions
                for i in range(3):
                    session_id = f"enc-{i}"
                    conn.execute(
                        """
                        INSERT INTO sessions (id, name, template_id, created_at)
                        VALUES (?, ?, 'tpl-1', datetime('now'))
                        """,
                        (session_id, f"Encrypted {i}"),
                    )
                    # Create session keys
                    KeychainManager.create_session_key(session_id, master_key)

            status = KeychainManager.get_encryption_status()

            assert status["total_sessions"] == 5
            assert status["encrypted_sessions"] == 3
            assert status["unencrypted_sessions"] == 2


class TestSessionMigration:
    """Test migration of unencrypted sessions to encrypted"""

    def test_migrate_unencrypted_session(self, temp_db, initialized_keychain):
        """Migrate unencrypted session to encrypted"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain

            # Create unencrypted session
            with db() as conn:
                session_id = "legacy-session"
                conn.execute(
                    """
                    INSERT INTO templates (id, name, version, json, created_at)
                    VALUES ('tpl-1', 'Test', 1, '{}', datetime('now'))
                    """
                )
                conn.execute(
                    """
                    INSERT INTO sessions (id, name, template_id, created_at, encryption_version)
                    VALUES (?, 'Legacy', 'tpl-1', datetime('now'), 0)
                    """,
                    (session_id,),
                )

            # Migrate
            master_key = KeychainManager.unlock(password)
            result = KeychainManager.migrate_session_to_encrypted(session_id, master_key)

            assert result["status"] == "migrated"
            assert result["session_id"] == session_id

            # Verify session now has encryption key
            with db() as conn:
                row = conn.execute(
                    "SELECT encryption_version, encrypted_session_key FROM sessions WHERE id = ?",
                    (session_id,),
                ).fetchone()

            assert row["encryption_version"] == 1
            assert row["encrypted_session_key"] is not None

    def test_migrate_already_encrypted_session(self, temp_db, session_with_data):
        """Migrating already-encrypted session is no-op"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            session_id = session_with_data["session_id"]
            password = session_with_data["password"]

            master_key = KeychainManager.unlock(password)
            result = KeychainManager.migrate_session_to_encrypted(session_id, master_key)

            assert result["status"] == "already_encrypted"

    def test_migrate_nonexistent_session_fails(self, temp_db, initialized_keychain):
        """Migrating non-existent session fails"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            password = initialized_keychain
            master_key = KeychainManager.unlock(password)

            with pytest.raises(ValueError, match="not found"):
                KeychainManager.migrate_session_to_encrypted("nonexistent-id", master_key)
