import json
import base64
import pytest
from app.backup import create_backup, restore_backup
from app.crypto import decrypt_json, encrypt_json
from app.db import db
from app.template_store import save_template


class TestCreateBackup:
    """Tests for create_backup function."""
    
    def test_create_backup_basic(self, test_db, test_client, sample_template, session_data):
        """Test creating a basic backup."""
        # Save some responses first
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        responses_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses_a
            }
        )
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_b"],
                "responses": responses_b
            }
        )
        
        # Create backup
        backup = create_backup(session_data["session_id"], session_data["password"])
        
        assert "backup_id" in backup
        assert "session_id" in backup
        assert "encrypted_data" in backup
        assert "salt" in backup
        assert backup["session_id"] == session_data["session_id"]
        
    def test_create_backup_includes_responses(self, test_db, test_client, sample_template, session_data):
        """Test that backup includes encrypted responses."""
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        responses_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses_a
            }
        )
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_b"],
                "responses": responses_b
            }
        )
        
        backup = create_backup(session_data["session_id"], session_data["password"])
        
        # Decrypt and verify
        salt = base64.b64decode(backup["salt"])
        encrypted = base64.b64decode(backup["encrypted_data"])
        decrypted = decrypt_json(session_data["password"], salt, encrypted)
        backup_data = json.loads(decrypted)
        
        assert "responses" in backup_data
        assert "A" in backup_data["responses"]
        assert "B" in backup_data["responses"]
        assert backup_data["responses"]["A"]["Q1"]["status"] == "YES"
        
    def test_create_backup_invalid_password(self, test_db, session_data):
        """Test that backup fails with invalid password."""
        with pytest.raises(ValueError, match="Invalid password"):
            create_backup(session_data["session_id"], "wrong_password")
            
    def test_create_backup_session_not_found(self, test_db):
        """Test that backup fails for non-existent session."""
        with pytest.raises(ValueError, match="Session not found"):
            create_backup("non_existent_session", "password")
            
    def test_create_backup_empty_responses(self, test_db, session_data):
        """Test creating backup when no responses exist."""
        backup = create_backup(session_data["session_id"], session_data["password"])
        
        salt = base64.b64decode(backup["salt"])
        encrypted = base64.b64decode(backup["encrypted_data"])
        decrypted = decrypt_json(session_data["password"], salt, encrypted)
        backup_data = json.loads(decrypted)
        
        assert "responses" in backup_data
        assert backup_data["responses"]["A"] is None
        assert backup_data["responses"]["B"] is None


class TestRestoreBackup:
    """Tests for restore_backup function."""
    
    def test_restore_backup_basic(self, test_db, test_client, sample_template, session_data):
        """Test restoring a basic backup."""
        # Create backup
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        responses_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses_a
            }
        )
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_b"],
                "responses": responses_b
            }
        )
        
        backup = create_backup(session_data["session_id"], session_data["password"])
        
        # Restore
        new_session_id = restore_backup(
            backup["encrypted_data"],
            backup["salt"],
            session_data["password"],
            "Restored Session"
        )
        
        assert new_session_id != session_data["session_id"]
        
        # Verify restored session
        response = test_client.get(f"/api/sessions/{new_session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Restored Session"
        
    def test_restore_backup_preserves_responses(self, test_db, test_client, sample_template, session_data):
        """Test that restored backup preserves responses."""
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        responses_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses_a
            }
        )
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_b"],
                "responses": responses_b
            }
        )
        
        backup = create_backup(session_data["session_id"], session_data["password"])
        new_session_id = restore_backup(
            backup["encrypted_data"],
            backup["salt"],
            session_data["password"]
        )
        
        # Load restored responses
        response = test_client.post(
            f"/api/sessions/{new_session_id}/responses/A/load",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Q1" in data["responses"]
        assert data["responses"]["Q1"]["status"] == "YES"
        
    def test_restore_backup_wrong_password(self, test_db, test_client, sample_template, session_data):
        """Test that restore fails with wrong password."""
        backup = create_backup(session_data["session_id"], session_data["password"])
        
        with pytest.raises(ValueError, match="Failed to decrypt"):
            restore_backup(
                backup["encrypted_data"],
                backup["salt"],
                "wrong_password"
            )
            
    def test_restore_backup_invalid_format(self, test_db):
        """Test that restore fails with invalid backup format."""
        # Create invalid backup data
        invalid_data = base64.b64encode(b"invalid data").decode('utf-8')
        invalid_salt = base64.b64encode(b"1234567890123456").decode('utf-8')
        
        with pytest.raises(ValueError):
            restore_backup(invalid_data, invalid_salt, "password")
            
    def test_restore_backup_unsupported_version(self, test_db, session_data):
        """Test that restore fails with unsupported version."""
        # Create backup with wrong version
        backup_data = {
            "version": "2.0",  # Unsupported
            "session": {"id": "test", "name": "Test"}
        }
        
        salt = base64.b64decode(create_backup(session_data["session_id"], session_data["password"])["salt"])
        encrypted = encrypt_json(session_data["password"], salt, json.dumps(backup_data))
        
        with pytest.raises(ValueError, match="Unsupported backup version"):
            restore_backup(
                base64.b64encode(encrypted).decode('utf-8'),
                base64.b64encode(salt).decode('utf-8'),
                session_data["password"]
            )


class TestBackupRestoreIntegration:
    """Integration tests for backup and restore."""
    
    def test_backup_restore_roundtrip(self, test_db, test_client, sample_template, session_data):
        """Test complete backup and restore cycle."""
        # Create session with responses
        responses_a = {
            "Q1": {"status": "YES", "interest": 3, "comfort": 4},
            "Q2": {"value": 7}
        }
        responses_b = {
            "Q1": {"status": "YES", "interest": 4, "comfort": 3},
            "Q2": {"value": 8}
        }
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses_a
            }
        )
        
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/B/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_b"],
                "responses": responses_b
            }
        )
        
        # Backup
        backup = create_backup(session_data["session_id"], session_data["password"])
        
        # Restore
        new_session_id = restore_backup(
            backup["encrypted_data"],
            backup["salt"],
            session_data["password"],
            "Roundtrip Test"
        )
        
        # Verify compare works on restored session
        response = test_client.post(
            f"/api/sessions/{new_session_id}/compare",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "items" in data

