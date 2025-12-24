import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.ai import (
    _build_prompt,
    redact,
    openrouter_analyze,
    list_ai_reports
)


class TestBuildPrompt:
    """Tests for _build_prompt function."""
    
    def test_build_prompt_basic(self):
        """Test that _build_prompt generates a prompt with compare result."""
        compare_result = {
            "meta": {"template_id": "test"},
            "summary": {"counts": {"MATCH": 1}},
            "items": []
        }
        
        prompt = _build_prompt(compare_result)
        
        assert isinstance(prompt, str)
        assert "Fragebögen" in prompt or "Intimität" in prompt
        assert "template_id" in prompt or "test" in prompt
        assert "MATCH" in prompt
        
    def test_build_prompt_includes_compare_result(self):
        """Test that prompt includes the compare result JSON."""
        compare_result = {
            "meta": {"template_id": "test", "template_name": "Test Template"},
            "summary": {
                "counts": {"MATCH": 5, "EXPLORE": 3, "BOUNDARY": 1},
                "flags": {"low_comfort_high_interest": 2}
            },
            "items": [
                {
                    "question_id": "Q1",
                    "pair_status": "MATCH",
                    "schema": "consent_rating"
                }
            ]
        }
        
        prompt = _build_prompt(compare_result)
        
        # Prompt should contain JSON representation
        assert "MATCH" in prompt
        assert "Q1" in prompt
        assert "consent_rating" in prompt
        
    def test_build_prompt_structure(self):
        """Test that prompt has expected structure elements."""
        compare_result = {"meta": {}, "summary": {"counts": {}}, "items": []}
        
        prompt = _build_prompt(compare_result)
        
        # Should contain instructions
        assert len(prompt) > 100  # Should be substantial
        assert isinstance(prompt, str)


class TestRedact:
    """Tests for redact function."""
    
    def test_redact_no_drop_free_text(self):
        """Test that redact doesn't remove text when drop_free_text is False."""
        compare_result = {
            "items": [
                {
                    "a": {
                        "status": "YES",
                        "notes": "Some notes",
                        "conditions": "Some conditions",
                        "text": "Some text"
                    },
                    "b": {
                        "status": "YES",
                        "notes": "Other notes"
                    }
                }
            ]
        }
        
        result = redact(compare_result, drop_free_text=False)
        
        assert result["items"][0]["a"]["notes"] == "Some notes"
        assert result["items"][0]["a"]["conditions"] == "Some conditions"
        assert result["items"][0]["a"]["text"] == "Some text"
        
    def test_redact_drop_free_text(self):
        """Test that redact removes text when drop_free_text is True."""
        compare_result = {
            "items": [
                {
                    "a": {
                        "status": "YES",
                        "interest": 3,
                        "comfort": 4,
                        "notes": "Some notes",
                        "conditions": "Some conditions",
                        "text": "Some text"
                    },
                    "b": {
                        "status": "YES",
                        "notes": "Other notes",
                        "conditions": "Other conditions",
                        "text": "Other text"
                    }
                }
            ]
        }
        
        result = redact(compare_result, drop_free_text=True)
        
        # Free text fields should be removed
        assert "notes" not in result["items"][0]["a"]
        assert "conditions" not in result["items"][0]["a"]
        assert "text" not in result["items"][0]["a"]
        
        assert "notes" not in result["items"][0]["b"]
        assert "conditions" not in result["items"][0]["b"]
        assert "text" not in result["items"][0]["b"]
        
        # Other fields should remain
        assert result["items"][0]["a"]["status"] == "YES"
        assert result["items"][0]["a"]["interest"] == 3
        
    def test_redact_preserves_structure(self):
        """Test that redact preserves overall structure."""
        compare_result = {
            "meta": {"template_id": "test"},
            "summary": {"counts": {"MATCH": 1}},
            "items": [
                {
                    "question_id": "Q1",
                    "a": {"notes": "notes", "status": "YES"},
                    "b": {"text": "text"}
                }
            ]
        }
        
        result = redact(compare_result, drop_free_text=True)
        
        assert "meta" in result
        assert "summary" in result
        assert "items" in result
        assert len(result["items"]) == 1
        assert result["items"][0]["question_id"] == "Q1"
        
    def test_redact_handles_missing_fields(self):
        """Test that redact handles items without free text fields."""
        compare_result = {
            "items": [
                {
                    "a": {"status": "YES", "interest": 3},
                    "b": {"status": "YES"}
                }
            ]
        }
        
        result = redact(compare_result, drop_free_text=True)
        
        assert "status" in result["items"][0]["a"]
        assert "interest" in result["items"][0]["a"]


class TestOpenrouterAnalyze:
    """Tests for openrouter_analyze function."""
    
    @pytest.mark.asyncio
    async def test_openrouter_analyze_success(self, test_db, test_password):
        """Test successful openrouter_analyze call."""
        import os
        salt = os.urandom(16)
        
        compare_result = {
            "meta": {"template_id": "test"},
            "summary": {"counts": {"MATCH": 1}},
            "items": []
        }
        
        mock_response = {
            "choices": [{
                "message": {
                    "content": "This is a test analysis response."
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
            
            result = await openrouter_analyze(
                session_id="test_session",
                password=test_password,
                salt=salt,
                compare_result=compare_result,
                api_key="test_api_key",
                model="test-model",
                base_url="https://api.test.com/v1",
                max_tokens=800,
                redact_free_text=True
            )
            
            assert "id" in result
            assert "created_at" in result
            assert result["provider"] == "openrouter"
            assert result["model"] == "test-model"
            assert result["text"] == "This is a test analysis response."
            
            # Verify API call was made
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert "chat/completions" in call_args[0][0]
            assert call_args[1]["headers"]["Authorization"] == "Bearer test_api_key"
            
    @pytest.mark.asyncio
    async def test_openrouter_analyze_encrypts_result(self, test_db, test_password):
        """Test that openrouter_analyze encrypts and stores the result."""
        import os
        from app.crypto import decrypt_json
        
        salt = os.urandom(16)
        
        compare_result = {"meta": {}, "summary": {}, "items": []}
        
        mock_response = {
            "choices": [{
                "message": {
                    "content": "Encrypted analysis"
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
            
            result = await openrouter_analyze(
                session_id="test_session",
                password=test_password,
                salt=salt,
                compare_result=compare_result,
                api_key="test_key",
                model="test-model",
                base_url="https://api.test.com/v1",
                max_tokens=800,
                redact_free_text=False
            )
            
            # Verify report was stored in database
            from app.db import db
            with db() as conn:
                rows = conn.execute(
                    "SELECT encrypted_blob FROM ai_reports WHERE session_id = ?",
                    ("test_session",)
                ).fetchall()
                
                assert len(rows) == 1
                encrypted_blob = rows[0]["encrypted_blob"]
                
                # Verify it can be decrypted
                decrypted = decrypt_json(test_password, salt, encrypted_blob)
                payload = json.loads(decrypted)
                assert payload["text"] == "Encrypted analysis"
                
    @pytest.mark.asyncio
    async def test_openrouter_analyze_handles_error_response(self, test_db, test_password):
        """Test that openrouter_analyze handles error responses gracefully."""
        import os
        salt = os.urandom(16)
        
        compare_result = {"meta": {}, "summary": {}, "items": []}
        
        # Response without expected structure
        mock_response = {"error": "Invalid request"}
        
        with patch("app.ai.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            mock_response_obj = MagicMock()
            mock_response_obj.json.return_value = mock_response
            mock_response_obj.raise_for_status = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response_obj)
            
            result = await openrouter_analyze(
                session_id="test_session",
                password=test_password,
                salt=salt,
                compare_result=compare_result,
                api_key="test_key",
                model="test-model",
                base_url="https://api.test.com/v1",
                max_tokens=800,
                redact_free_text=False
            )
            
            # Should return JSON dump of response as text
            assert "text" in result
            assert "error" in result["text"] or "Invalid request" in result["text"]


class TestListAiReports:
    """Tests for list_ai_reports function."""
    
    def test_list_ai_reports_empty(self, test_db, test_password):
        """Test listing AI reports when none exist."""
        import os
        salt = os.urandom(16)
        
        reports = list_ai_reports("non_existent_session", test_password, salt)
        
        assert reports == []
        
    def test_list_ai_reports_multiple(self, test_db, test_password):
        """Test listing multiple AI reports."""
        import os
        import uuid
        from app.db import db
        from app.crypto import encrypt_json
        
        salt = os.urandom(16)
        session_id = str(uuid.uuid4())
        
        # Create some reports
        with db() as conn:
            for i in range(3):
                report_id = str(uuid.uuid4())
                text = f"Report {i}"
                blob = encrypt_json(test_password, salt, json.dumps({"text": text}))
                conn.execute(
                    "INSERT INTO ai_reports(id, session_id, created_at, provider, model, encrypted_blob) VALUES (?,?,?,?,?,?)",
                    (report_id, session_id, "2024-01-01T00:00:00Z", "openrouter", "test-model", blob)
                )
        
        reports = list_ai_reports(session_id, test_password, salt)
        
        assert len(reports) == 3
        assert all("id" in r for r in reports)
        assert all("text" in r for r in reports)
        assert all(r["provider"] == "openrouter" for r in reports)
        
    def test_list_ai_reports_decrypts(self, test_db, test_password):
        """Test that list_ai_reports decrypts the stored reports."""
        import os
        import uuid
        from app.db import db
        from app.crypto import encrypt_json
        
        salt = os.urandom(16)
        session_id = str(uuid.uuid4())
        report_text = "This is a secret report"
        
        with db() as conn:
            report_id = str(uuid.uuid4())
            blob = encrypt_json(test_password, salt, json.dumps({"text": report_text}))
            conn.execute(
                "INSERT INTO ai_reports(id, session_id, created_at, provider, model, encrypted_blob) VALUES (?,?,?,?,?,?)",
                (report_id, session_id, "2024-01-01T00:00:00Z", "openrouter", "test-model", blob)
            )
        
        reports = list_ai_reports(session_id, test_password, salt)
        
        assert len(reports) == 1
        assert reports[0]["text"] == report_text
        
    def test_list_ai_reports_sorted(self, test_db, test_password):
        """Test that reports are sorted by created_at DESC."""
        import os
        import uuid
        from app.db import db
        from app.crypto import encrypt_json
        
        salt = os.urandom(16)
        session_id = str(uuid.uuid4())
        
        with db() as conn:
            for i in range(3):
                report_id = str(uuid.uuid4())
                text = f"Report {i}"
                blob = encrypt_json(test_password, salt, json.dumps({"text": text}))
                # Use different timestamps
                timestamp = f"2024-01-0{i+1}T00:00:00Z"
                conn.execute(
                    "INSERT INTO ai_reports(id, session_id, created_at, provider, model, encrypted_blob) VALUES (?,?,?,?,?,?)",
                    (report_id, session_id, timestamp, "openrouter", "test-model", blob)
                )
        
        reports = list_ai_reports(session_id, test_password, salt)
        
        # Should be sorted DESC, so most recent first
        assert len(reports) == 3
        # Check that timestamps are in descending order
        timestamps = [r["created_at"] for r in reports]
        assert timestamps == sorted(timestamps, reverse=True)






