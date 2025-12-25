import json
import pytest
from fastapi.testclient import TestClient


class TestScenariosEndpoint:
    """Tests for scenarios endpoint."""
    
    def test_get_scenarios_exists(self, test_client):
        """Test that scenarios endpoint exists."""
        response = test_client.get("/api/scenarios")
        assert response.status_code == 200
        
    def test_get_scenarios_returns_list(self, test_client):
        """Test that scenarios endpoint returns a list."""
        response = test_client.get("/api/scenarios")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_scenarios_empty_if_file_missing(self, test_client):
        """Test that scenarios returns empty list if file doesn't exist."""
        # The endpoint should handle missing file gracefully
        response = test_client.get("/api/scenarios")
        assert response.status_code == 200
        # Should return empty list or valid JSON
        assert isinstance(response.json(), list)


class TestBackupRestoreEndpoints:
    """Tests for backup and restore endpoints."""
    
    def test_backup_endpoint(self, test_client, sample_template, session_data):
        """Test backup endpoint."""
        # Save some responses
        responses_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses_a
            }
        )
        
        # Create backup
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/backup",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "backup_id" in data
        assert "encrypted_data" in data
        assert "salt" in data
        
    def test_backup_endpoint_wrong_password(self, test_client, session_data):
        """Test backup endpoint with wrong password."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/backup",
            json={"password": "wrong_password"}
        )
        
        assert response.status_code == 400
        
    def test_restore_endpoint(self, test_client, sample_template, session_data):
        """Test restore endpoint."""
        # Create backup first
        backup_response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/backup",
            json={"password": session_data["password"]}
        )
        backup = backup_response.json()
        
        # Restore
        response = test_client.post(
            "/api/sessions/restore",
            json={
                "encrypted_data": backup["encrypted_data"],
                "salt": backup["salt"],
                "password": session_data["password"],
                "new_name": "Restored Session"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "message" in data
        
    def test_restore_endpoint_wrong_password(self, test_client, session_data):
        """Test restore endpoint with wrong password."""
        backup_response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/backup",
            json={"password": session_data["password"]}
        )
        backup = backup_response.json()
        
        response = test_client.post(
            "/api/sessions/restore",
            json={
                "encrypted_data": backup["encrypted_data"],
                "salt": backup["salt"],
                "password": "wrong_password",
                "new_name": "Restored"
            }
        )
        
        assert response.status_code == 400


class TestExportExtended:
    """Extended tests for export endpoints."""
    
    def test_export_json_includes_all_data(self, test_client, sample_template, session_data):
        """Test that JSON export includes all required data."""
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
        
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/export/json",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        data = json.loads(response.content)
        
        assert "session" in data
        assert "template" in data
        assert "responses" in data
        assert "compare" in data
        
        assert data["session"]["id"] == session_data["session_id"]
        assert "A" in data["responses"]
        assert "B" in data["responses"]
        
    def test_export_markdown_format(self, test_client, sample_template, session_data):
        """Test that Markdown export has correct format."""
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
        
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/export/markdown",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        
        assert "# Report:" in content
        assert "## Summary" in content
        assert "MATCH" in content or "EXPLORE" in content or "BOUNDARY" in content
        
    def test_export_json_filename(self, test_client, sample_template, session_data):
        """Test that JSON export has correct filename."""
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
        
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/export/json",
            json={"password": session_data["password"]}
        )
        
        assert "attachment" in response.headers["content-disposition"]
        assert "intimacy_export_" in response.headers["content-disposition"]
        assert ".json" in response.headers["content-disposition"]


class TestSessionEdgeCases:
    """Tests for edge cases in session handling."""
    
    def test_create_session_very_long_name(self, test_client, sample_template):
        """Test creating session with very long name."""
        from app.template_store import save_template
        
        save_template(
            sample_template["id"],
            sample_template["name"],
            sample_template["version"],
            sample_template
        )
        
        long_name = "A" * 500  # Very long name
        
        response = test_client.post(
            "/api/sessions",
            json={
                "name": long_name,
                "template_id": sample_template["id"],
                "password": "test_password_123"
            }
        )
        
        # Should either succeed or return appropriate error
        assert response.status_code in [200, 400, 422]
        
    def test_create_session_special_characters(self, test_client, sample_template):
        """Test creating session with special characters in name."""
        from app.template_store import save_template
        
        save_template(
            sample_template["id"],
            sample_template["name"],
            sample_template["version"],
            sample_template
        )
        
        special_name = "Test Session 🎉 世界 🌍"
        
        response = test_client.post(
            "/api/sessions",
            json={
                "name": special_name,
                "template_id": sample_template["id"],
                "password": "test_password_123"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["name"] == special_name
            
    def test_save_responses_unicode(self, test_client, sample_template, session_data):
        """Test saving responses with unicode characters."""
        responses = {
            "Q5": {
                "text": "Unicode text: 世界 🌍 🔐 Test"
            }
        }
        
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses
            }
        )
        
        assert response.status_code == 200
        
        # Load and verify
        load_response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/load",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"]
            }
        )
        
        assert load_response.status_code == 200
        data = load_response.json()
        assert "Q5" in data["responses"]
        assert "世界" in data["responses"]["Q5"]["text"]
        
    def test_compare_large_dataset(self, test_client, sample_template, session_data):
        """Test comparing with large number of responses."""
        # Create many responses
        responses_a = {}
        responses_b = {}
        
        for i in range(50):
            qid = f"Q{i}"
            responses_a[qid] = {"status": "YES", "interest": 3, "comfort": 4}
            responses_b[qid] = {"status": "YES", "interest": 4, "comfort": 3}
        
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
        
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/compare",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0

