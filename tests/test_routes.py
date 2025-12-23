import json
import pytest
from fastapi.testclient import TestClient
from app.routes import validate_responses


class TestHealth:
    """Tests for /health endpoint."""
    
    def test_health_endpoint(self, test_client):
        """Test that health endpoint returns ok."""
        response = test_client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"ok": True}


class TestTemplates:
    """Tests for template endpoints."""
    
    def test_list_templates_empty(self, test_client):
        """Test listing templates when none exist."""
        response = test_client.get("/api/templates")
        assert response.status_code == 200
        assert response.json() == []
        
    def test_get_template(self, test_client, sample_template):
        """Test getting a specific template."""
        from app.template_store import save_template
        
        save_template(
            sample_template["id"],
            sample_template["name"],
            sample_template["version"],
            sample_template
        )
        
        response = test_client.get(f"/api/templates/{sample_template['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_template["id"]
        
    def test_get_template_not_found(self, test_client):
        """Test getting non-existent template returns 404."""
        response = test_client.get("/api/templates/non_existent")
        assert response.status_code == 404


class TestSessions:
    """Tests for session endpoints."""
    
    def test_create_session(self, test_client, sample_template):
        """Test creating a session."""
        from app.template_store import save_template
        
        save_template(
            sample_template["id"],
            sample_template["name"],
            sample_template["version"],
            sample_template
        )
        
        response = test_client.post(
            "/api/sessions",
            json={
                "name": "Test Session",
                "template_id": sample_template["id"],
                "password": "test_password_123",
                "pin_a": "1234",
                "pin_b": "5678"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Session"
        assert data["template_id"] == sample_template["id"]
        assert "id" in data
        assert data["has_a"] is False
        assert data["has_b"] is False
        
    def test_create_session_invalid_template(self, test_client):
        """Test creating session with invalid template_id returns 400."""
        response = test_client.post(
            "/api/sessions",
            json={
                "name": "Test Session",
                "template_id": "non_existent",
                "password": "test_password_123"
            }
        )
        
        assert response.status_code == 400
        
    def test_list_sessions(self, test_client, sample_template, session_data):
        """Test listing sessions."""
        response = test_client.get("/api/sessions")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(s["id"] == session_data["session_id"] for s in data)
        
    def test_get_session_info(self, test_client, sample_template, session_data):
        """Test getting session info."""
        response = test_client.get(f"/api/sessions/{session_data['session_id']}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_data["session_id"]
        assert data["name"] == "Test Session"
        assert "template" in data
        assert data["has_a"] is False
        assert data["has_b"] is False
        
    def test_get_session_not_found(self, test_client):
        """Test getting non-existent session returns 404."""
        response = test_client.get("/api/sessions/non_existent_id")
        assert response.status_code == 404


class TestResponses:
    """Tests for response endpoints."""
    
    def test_save_responses(self, test_client, sample_template, session_data):
        """Test saving responses."""
        responses = {
            "Q1": {
                "status": "YES",
                "interest": 3,
                "comfort": 4
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
        data = response.json()
        assert data["ok"] is True
        
    def test_load_responses_empty(self, test_client, session_data):
        """Test loading responses when none exist."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/load",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["responses"] == {}
        
    def test_load_responses_after_save(self, test_client, sample_template, session_data):
        """Test loading responses after saving."""
        responses = {
            "Q1": {
                "status": "YES",
                "interest": 3,
                "comfort": 4
            }
        }
        
        # Save
        test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": responses
            }
        )
        
        # Load
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/load",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Q1" in data["responses"]
        assert data["responses"]["Q1"]["status"] == "YES"
        
    def test_save_responses_wrong_password(self, test_client, session_data):
        """Test saving responses with wrong password returns 401."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": "wrong_password",
                "pin": session_data["pin_a"],
                "responses": {}
            }
        )
        
        assert response.status_code == 401
        
    def test_save_responses_wrong_pin(self, test_client, session_data):
        """Test saving responses with wrong PIN returns 401."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/save",
            json={
                "password": session_data["password"],
                "pin": "wrong_pin",
                "responses": {}
            }
        )
        
        assert response.status_code == 401
        
    def test_save_responses_invalid_person(self, test_client, session_data):
        """Test saving responses with invalid person returns 400."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/C/save",
            json={
                "password": session_data["password"],
                "pin": session_data["pin_a"],
                "responses": {}
            }
        )
        
        assert response.status_code == 400
        
    def test_load_responses_wrong_password(self, test_client, session_data):
        """Test loading responses with wrong password returns 401."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/responses/A/load",
            json={
                "password": "wrong_password",
                "pin": session_data["pin_a"]
            }
        )
        
        assert response.status_code == 401
        
    def test_save_responses_no_pin_required(self, test_client, sample_template):
        """Test saving responses when no PIN is required."""
        from app.template_store import save_template
        
        save_template(
            sample_template["id"],
            sample_template["name"],
            sample_template["version"],
            sample_template
        )
        
        # Create session without PINs
        create_resp = test_client.post(
            "/api/sessions",
            json={
                "name": "No PIN Session",
                "template_id": sample_template["id"],
                "password": "test_password_123"
            }
        )
        session_id = create_resp.json()["id"]
        
        # Save responses without PIN
        response = test_client.post(
            f"/api/sessions/{session_id}/responses/A/save",
            json={
                "password": "test_password_123",
                "pin": None,
                "responses": {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
            }
        )
        
        assert response.status_code == 200


class TestCompare:
    """Tests for compare endpoint."""
    
    def test_compare_session(self, test_client, sample_template, session_data):
        """Test comparing session responses."""
        responses_a = {
            "Q1": {"status": "YES", "interest": 3, "comfort": 4},
            "Q2": {"value": 7}
        }
        responses_b = {
            "Q1": {"status": "YES", "interest": 4, "comfort": 3},
            "Q2": {"value": 8}
        }
        
        # Save responses for both persons
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
        
        # Compare
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/compare",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "meta" in data
        assert "summary" in data
        assert "items" in data
        assert "action_plan" in data
        
    def test_compare_missing_responses(self, test_client, session_data):
        """Test comparing when responses are missing returns 400."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/compare",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 400
        
    def test_compare_wrong_password(self, test_client, session_data):
        """Test comparing with wrong password returns 401."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/compare",
            json={"password": "wrong_password"}
        )
        
        assert response.status_code == 401


class TestExport:
    """Tests for export endpoints."""
    
    def test_export_json(self, test_client, sample_template, session_data):
        """Test exporting session as JSON."""
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
        assert response.headers["content-type"] == "application/json"
        assert "attachment" in response.headers["content-disposition"]
        data = json.loads(response.content)
        assert "session" in data
        assert "template" in data
        assert "responses" in data
        assert "compare" in data
        
    def test_export_markdown(self, test_client, sample_template, session_data):
        """Test exporting session as Markdown."""
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
        assert "text/markdown" in response.headers["content-type"]
        assert "attachment" in response.headers["content-disposition"]
        content = response.content.decode("utf-8")
        assert "# Report:" in content
        assert "MATCH" in content or "EXPLORE" in content


class TestValidateResponses:
    """Tests for validate_responses function."""
    
    def test_validate_consent_rating_maybe_requires_conditions(self, sample_template):
        """Test that MAYBE status requires conditions."""
        responses = {
            "Q1": {
                "status": "MAYBE",
                "interest": 2,
                "comfort": 2
                # Missing conditions
            }
        }
        
        errors, warnings = validate_responses(sample_template, responses)
        
        assert len(errors) > 0
        assert any(e["type"] == "missing_required" for e in errors)
        
    def test_validate_consent_rating_valid_range(self, sample_template):
        """Test that interest/comfort values are in valid range."""
        responses = {
            "Q1": {
                "status": "YES",
                "interest": 5,  # Out of range (should be 0-4)
                "comfort": -1   # Out of range
            }
        }
        
        errors, warnings = validate_responses(sample_template, responses)
        
        assert len(errors) > 0
        assert any("range_error" in e["type"] for e in errors)
        
    def test_validate_consent_rating_low_comfort_high_interest_warning(self, sample_template):
        """Test that low comfort with high interest triggers warning."""
        responses = {
            "Q1": {
                "status": "YES",
                "interest": 3,
                "comfort": 2  # Low comfort, high interest
            }
        }
        
        errors, warnings = validate_responses(sample_template, responses)
        
        assert len(warnings) > 0
        assert any(w["type"] == "low_comfort_high_interest" for w in warnings)
        
    def test_validate_consent_rating_dom_sub_maybe_requires_conditions(self, sample_template):
        """Test that MAYBE in dom/sub variant requires conditions."""
        template = {
            "id": "test",
            "name": "Test",
            "version": 1,
            "modules": [{
                "id": "m1",
                "name": "Module",
                "questions": [{
                    "id": "Q1",
                    "schema": "consent_rating",
                    "label": "Test",
                    "tags": []
                }]
            }]
        }
        
        responses = {
            "Q1": {
                "dom_status": "MAYBE",
                "dom_interest": 2,
                "dom_comfort": 2
                # Missing conditions
            }
        }
        
        errors, warnings = validate_responses(template, responses)
        
        assert len(errors) > 0
        
    def test_validate_scale_0_10_range(self, sample_template):
        """Test that scale_0_10 values are in valid range."""
        responses = {
            "Q2": {
                "value": 11  # Out of range
            }
        }
        
        errors, warnings = validate_responses(sample_template, responses)
        
        assert len(errors) > 0
        assert any("range_error" in e["type"] for e in errors)
        
    def test_validate_valid_responses_no_errors(self, sample_template):
        """Test that valid responses produce no errors."""
        responses = {
            "Q1": {
                "status": "YES",
                "interest": 3,
                "comfort": 4,
                "conditions": ""
            },
            "Q2": {
                "value": 7
            }
        }
        
        errors, warnings = validate_responses(sample_template, responses)
        
        assert len(errors) == 0


class TestAIAnalyze:
    """Tests for AI analyze endpoint."""
    
    @pytest.mark.asyncio
    async def test_ai_analyze(self, test_client, sample_template, session_data):
        """Test AI analyze endpoint."""
        from unittest.mock import patch, AsyncMock, MagicMock
        
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
        
        mock_response = {
            "choices": [{
                "message": {
                    "content": "Test AI analysis"
                }
            }]
        }
        
        with patch("app.ai.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            mock_response_obj = MagicMock()
            mock_response_obj.json.return_value = mock_response
            mock_response_obj.raise_for_status = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response_obj)
            
            response = test_client.post(
                f"/api/sessions/{session_data['session_id']}/ai/analyze",
                json={
                    "password": session_data["password"],
                    "provider": "openrouter",
                    "api_key": "test_key",
                    "model": "test-model",
                    "max_tokens": 800
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "text" in data
            
    def test_ai_list_empty(self, test_client, session_data):
        """Test listing AI reports when none exist."""
        response = test_client.post(
            f"/api/sessions/{session_data['session_id']}/ai/list",
            json={"password": session_data["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["reports"] == []

