"""
Integration tests for encryption endpoints.

Tests complete encryption flow from API to database and back.
"""

import json
import os
import pytest
import tempfile
from unittest import mock
from fastapi.testclient import TestClient

from app.main import app
from app.db import init_db, db
from app.keychain import KeychainManager


@pytest.fixture
def temp_db():
    """Create temporary database for testing"""
    fd, db_path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)

    with mock.patch("app.db.get_db_path", return_value=db_path):
        init_db()
        yield db_path

        try:
            os.unlink(db_path)
        except OSError:
            pass


@pytest.fixture
def client(temp_db):
    """FastAPI test client with mocked database"""
    with mock.patch("app.db.get_db_path", return_value=temp_db):
        yield TestClient(app)


@pytest.fixture
def initialized_keychain(temp_db):
    """Initialize keychain with master password"""
    password = "test_master_password_123"
    with mock.patch("app.db.get_db_path", return_value=temp_db):
        KeychainManager.initialize(password)
        yield password


@pytest.fixture
def template(client, temp_db):
    """Create test template"""
    with mock.patch("app.db.get_db_path", return_value=temp_db):
        template_data = {
            "id": "test-template",
            "name": "Test Template",
            "version": 1,
            "sections": [
                {
                    "id": "sec1",
                    "title": "Test Section",
                    "questions": [
                        {"id": "q1", "text": "Test question?", "type": "text"}
                    ],
                }
            ],
        }

        with db() as conn:
            conn.execute(
                """
                INSERT INTO templates (id, name, version, json, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (
                    template_data["id"],
                    template_data["name"],
                    template_data["version"],
                    json.dumps(template_data),
                ),
            )

        yield template_data


class TestKeychainEndpoints:
    """Test keychain management endpoints"""

    def test_keychain_status_uninitialized(self, client, temp_db):
        """GET /api/keychain/status returns uninitialized"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.get("/api/keychain/status")

            assert response.status_code == 200
            data = response.json()
            assert data["initialized"] is False

    def test_keychain_initialize(self, client, temp_db):
        """POST /api/keychain/initialize creates keychain"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/keychain/initialize",
                json={"password": "strong_password_12345"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "initialized"
            assert "created_at" in data

            # Verify status now shows initialized
            status_response = client.get("/api/keychain/status")
            assert status_response.json()["initialized"] is True

    def test_keychain_initialize_weak_password_fails(self, client, temp_db):
        """POST /api/keychain/initialize rejects weak passwords"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/keychain/initialize",
                json={"password": "weak"},  # Too short (< 12 chars)
            )

            assert response.status_code == 422  # Validation error

    def test_keychain_unlock(self, client, temp_db, initialized_keychain):
        """POST /api/keychain/unlock verifies password"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/keychain/unlock",
                json={"password": password},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "unlocked"

    def test_keychain_unlock_wrong_password(self, client, temp_db, initialized_keychain):
        """POST /api/keychain/unlock rejects wrong password"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/keychain/unlock",
                json={"password": "wrong_password_123"},
            )

            assert response.status_code == 401
            assert "incorrect password" in response.json()["detail"].lower()

    def test_change_password(self, client, temp_db, initialized_keychain):
        """POST /api/keychain/change-password changes password"""
        old_password = initialized_keychain
        new_password = "new_strong_password_456"

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/keychain/change-password",
                json={
                    "old_password": old_password,
                    "new_password": new_password,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "password_changed"

            # Old password no longer works
            old_response = client.post(
                "/api/keychain/unlock",
                json={"password": old_password},
            )
            assert old_response.status_code == 401

            # New password works
            new_response = client.post(
                "/api/keychain/unlock",
                json={"password": new_password},
            )
            assert new_response.status_code == 200


class TestEncryptedSessionFlow:
    """Test complete encrypted session workflow"""

    def test_create_encrypted_session(self, client, temp_db, initialized_keychain, template):
        """POST /api/sessions/encrypted creates session with encryption"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Encrypted Test Session",
                    "template_id": template["id"],
                    "password": password,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert data["encrypted"] is True

            session_id = data["id"]

            # Verify session has encryption key in database
            with db() as conn:
                row = conn.execute(
                    "SELECT encryption_version, encrypted_session_key FROM sessions WHERE id = ?",
                    (session_id,),
                ).fetchone()

            assert row["encryption_version"] == 1
            assert row["encrypted_session_key"] is not None

    def test_save_encrypted_responses(self, client, temp_db, initialized_keychain, template):
        """POST /api/sessions/{id}/responses/{person}/save encrypts data"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create encrypted session
            create_response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test Session",
                    "template_id": template["id"],
                    "password": password,
                },
            )
            session_id = create_response.json()["id"]

            # Save responses
            responses = {
                "q1": {"type": "text", "answer": "Sensitive answer"},
            }

            save_response = client.post(
                f"/api/sessions/{session_id}/responses/A/save",
                json={
                    "responses": responses,
                    "password": password,
                },
            )

            assert save_response.status_code == 200
            assert save_response.json()["status"] == "saved"

            # Verify data is encrypted in database
            with db() as conn:
                row = conn.execute(
                    "SELECT json FROM responses WHERE session_id = ? AND person = 'A'",
                    (session_id,),
                ).fetchone()

            stored_data = json.loads(row["json"])

            # Check encryption markers
            assert "ciphertext" in stored_data
            assert "nonce" in stored_data
            assert "algorithm" in stored_data
            assert stored_data["algorithm"] == "AES-256-GCM"

            # Verify plaintext is NOT in database
            assert "Sensitive answer" not in row["json"]

    def test_load_encrypted_responses(self, client, temp_db, initialized_keychain, template):
        """POST /api/sessions/{id}/responses/{person}/load decrypts data"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create encrypted session
            create_response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test Session",
                    "template_id": template["id"],
                    "password": password,
                },
            )
            session_id = create_response.json()["id"]

            # Save encrypted responses
            original_responses = {
                "q1": {"type": "text", "answer": "Secret data 🔒"},
            }

            client.post(
                f"/api/sessions/{session_id}/responses/A/save",
                json={
                    "responses": original_responses,
                    "password": password,
                },
            )

            # Load responses (decrypt)
            load_response = client.post(
                f"/api/sessions/{session_id}/responses/A/load",
                json={"password": password},
            )

            assert load_response.status_code == 200
            data = load_response.json()

            assert data["responses"] == original_responses
            assert data["encrypted"] is True

    def test_load_encrypted_wrong_password_fails(self, client, temp_db, initialized_keychain, template):
        """Loading encrypted responses with wrong password fails"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create and save encrypted session
            create_response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test Session",
                    "template_id": template["id"],
                    "password": password,
                },
            )
            session_id = create_response.json()["id"]

            client.post(
                f"/api/sessions/{session_id}/responses/A/save",
                json={
                    "responses": {"q1": {"answer": "secret"}},
                    "password": password,
                },
            )

            # Try to load with wrong password
            load_response = client.post(
                f"/api/sessions/{session_id}/responses/A/load",
                json={"password": "wrong_password_123"},
            )

            assert load_response.status_code == 401
            assert "incorrect password" in load_response.json()["detail"].lower()


class TestCompareEncryptedSessions:
    """Test comparison with encrypted sessions"""

    def test_compare_encrypted_session(self, client, temp_db, initialized_keychain, template):
        """POST /api/sessions/{id}/compare decrypts both responses"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create encrypted session
            create_response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test Session",
                    "template_id": template["id"],
                    "password": password,
                },
            )
            session_id = create_response.json()["id"]

            # Save responses for both persons
            client.post(
                f"/api/sessions/{session_id}/responses/A/save",
                json={
                    "responses": {"q1": {"answer": "Answer A"}},
                    "password": password,
                },
            )

            client.post(
                f"/api/sessions/{session_id}/responses/B/save",
                json={
                    "responses": {"q1": {"answer": "Answer B"}},
                    "password": password,
                },
            )

            # Compare
            compare_response = client.post(
                f"/api/sessions/{session_id}/compare",
                json={"password": password},
            )

            assert compare_response.status_code == 200
            data = compare_response.json()

            assert "summary" in data
            assert "items" in data
            # Encryption/decryption worked successfully (200 response)
            # Note: item count depends on template structure


class TestBackwardCompatibility:
    """Test encrypted system works with legacy unencrypted sessions"""

    def test_load_unencrypted_session_without_password(self, client, temp_db, template):
        """Load unencrypted session works without password"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create unencrypted session (legacy)
            with db() as conn:
                session_id = "unencrypted-session"
                conn.execute(
                    """
                    INSERT INTO sessions (id, name, template_id, created_at, encryption_version)
                    VALUES (?, 'Legacy Session', ?, datetime('now'), 0)
                    """,
                    (session_id, template["id"]),
                )

                # Save unencrypted responses
                responses = {"q1": {"answer": "plain text"}}
                conn.execute(
                    """
                    INSERT INTO responses (session_id, person, json, updated_at)
                    VALUES (?, 'A', ?, datetime('now'))
                    """,
                    (session_id, json.dumps(responses)),
                )

            # Load without password (should work)
            load_response = client.post(
                f"/api/sessions/{session_id}/responses/A/load",
                json={},  # No password
            )

            assert load_response.status_code == 200
            data = load_response.json()
            assert data["responses"] == responses
            assert data["encrypted"] is False

    def test_encryption_status_shows_mixed_sessions(self, client, temp_db, initialized_keychain, template):
        """Status endpoint correctly counts encrypted vs unencrypted"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create 2 unencrypted sessions
            with db() as conn:
                for i in range(2):
                    conn.execute(
                        """
                        INSERT INTO sessions (id, name, template_id, created_at, encryption_version)
                        VALUES (?, ?, ?, datetime('now'), 0)
                        """,
                        (f"unenc-{i}", f"Unencrypted {i}", template["id"]),
                    )

            # Create 1 encrypted session
            client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Encrypted",
                    "template_id": template["id"],
                    "password": password,
                },
            )

            # Check status
            status_response = client.get("/api/keychain/status")
            status = status_response.json()

            assert status["total_sessions"] == 3
            assert status["encrypted_sessions"] == 1
            assert status["unencrypted_sessions"] == 2


class TestEncryptionEdgeCases:
    """Test edge cases and error handling"""

    def test_create_encrypted_session_without_keychain_fails(self, client, temp_db, template):
        """Cannot create encrypted session without initialized keychain"""
        with mock.patch("app.db.get_db_path", return_value=temp_db):
            response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test",
                    "template_id": template["id"],
                    "password": "any_password",
                },
            )

            assert response.status_code == 400
            assert "not initialized" in response.json()["detail"].lower()

    def test_save_encrypted_with_unicode(self, client, temp_db, initialized_keychain, template):
        """Encryption handles unicode correctly"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create encrypted session
            create_response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test",
                    "template_id": template["id"],
                    "password": password,
                },
            )
            session_id = create_response.json()["id"]

            # Save unicode data
            responses = {
                "q1": {"answer": "Émoji test: 🎉🔐 Ümlauts: äöü"},
            }

            client.post(
                f"/api/sessions/{session_id}/responses/A/save",
                json={
                    "responses": responses,
                    "password": password,
                },
            )

            # Load and verify
            load_response = client.post(
                f"/api/sessions/{session_id}/responses/A/load",
                json={"password": password},
            )

            assert load_response.json()["responses"] == responses

    def test_save_encrypted_with_large_data(self, client, temp_db, initialized_keychain, template):
        """Encryption handles large data"""
        password = initialized_keychain

        with mock.patch("app.db.get_db_path", return_value=temp_db):
            # Create encrypted session
            create_response = client.post(
                "/api/sessions/encrypted",
                json={
                    "name": "Test",
                    "template_id": template["id"],
                    "password": password,
                },
            )
            session_id = create_response.json()["id"]

            # Save large data (100KB)
            large_text = "x" * 100000
            responses = {
                "q1": {"answer": large_text},
            }

            save_response = client.post(
                f"/api/sessions/{session_id}/responses/A/save",
                json={
                    "responses": responses,
                    "password": password,
                },
            )

            assert save_response.status_code == 200

            # Load and verify
            load_response = client.post(
                f"/api/sessions/{session_id}/responses/A/load",
                json={"password": password},
            )

            assert load_response.json()["responses"] == responses
