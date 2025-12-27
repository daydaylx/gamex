import os
import pytest
import tempfile
from pathlib import Path
from typing import Dict, Any
from fastapi.testclient import TestClient

from app.main import create_app
from app.db import init_db, get_conn


@pytest.fixture(scope="function")
def test_db():
    """Create a temporary test database for each test."""
    fd, db_path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)
    
    original_db = os.environ.get("INTIMACY_TOOL_DB")
    os.environ["INTIMACY_TOOL_DB"] = db_path
    
    try:
        init_db()
        yield db_path
    finally:
        if original_db:
            os.environ["INTIMACY_TOOL_DB"] = original_db
        else:
            os.environ.pop("INTIMACY_TOOL_DB", None)
        if os.path.exists(db_path):
            os.unlink(db_path)


@pytest.fixture
def sample_template() -> Dict[str, Any]:
    """Sample template for testing."""
    return {
        "id": "test_template",
        "name": "Test Template",
        "version": 1,
        "modules": [
            {
                "id": "module1",
                "name": "Test Module",
                "questions": [
                    {
                        "id": "Q1",
                        "schema": "consent_rating",
                        "risk_level": "A",
                        "label": "Test Question 1",
                        "help": "Help text",
                        "tags": ["kissing", "soft"]
                    },
                    {
                        "id": "Q2",
                        "schema": "scale_1_10",
                        "risk_level": "A",
                        "label": "Test Question 2",
                        "help": "Scale question",
                        "tags": []
                    },
                    {
                        "id": "Q3",
                        "schema": "enum",
                        "risk_level": "A",
                        "label": "Test Question 3",
                        "options": ["Option1", "Option2"],
                        "tags": []
                    },
                    {
                        "id": "Q4",
                        "schema": "multi",
                        "risk_level": "A",
                        "label": "Test Question 4",
                        "options": ["Option1", "Option2", "Option3"],
                        "tags": []
                    },
                    {
                        "id": "Q5",
                        "schema": "text",
                        "risk_level": "A",
                        "label": "Test Question 5",
                        "tags": []
                    }
                ]
            }
        ]
    }


@pytest.fixture
def sample_responses() -> Dict[str, Dict[str, Any]]:
    """Sample responses for testing."""
    return {
        "A": {
            "Q1": {
                "status": "YES",
                "interest": 3,
                "comfort": 4
            },
            "Q2": {
                "value": 7
            },
            "Q3": {
                "value": "Option1"
            },
            "Q4": {
                "values": ["Option1", "Option2"]
            },
            "Q5": {
                "text": "Some text response"
            }
        },
        "B": {
            "Q1": {
                "status": "YES",
                "interest": 4,
                "comfort": 3
            },
            "Q2": {
                "value": 8
            },
            "Q3": {
                "value": "Option1"
            },
            "Q4": {
                "values": ["Option1", "Option3"]
            },
            "Q5": {
                "text": "Another text response"
            }
        }
    }


@pytest.fixture
def sample_template_with_variants() -> Dict[str, Any]:
    """Template with dom/sub and active/passive variants."""
    return {
        "id": "test_template_variants",
        "name": "Test Template with Variants",
        "version": 1,
        "modules": [
            {
                "id": "module1",
                "name": "Roles Module",
                "questions": [
                    {
                        "id": "Q_DOM",
                        "schema": "consent_rating",
                        "risk_level": "A",
                        "label": "Dom/Sub Test",
                        "tags": ["kissing", "soft"]
                    },
                    {
                        "id": "Q_ACTIVE",
                        "schema": "consent_rating",
                        "risk_level": "A",
                        "label": "Active/Passive Test",
                        "tags": ["touching"]
                    },
                    {
                        "id": "Q_MATCH",
                        "schema": "consent_rating",
                        "risk_level": "A",
                        "label": "Match Test",
                        "tags": ["cuddling"]
                    }
                ]
            }
        ]
    }


@pytest.fixture
def sample_responses_with_variants() -> Dict[str, Dict[str, Any]]:
    """Responses with dom/sub and active/passive variants."""
    return {
        "A": {
            "Q_DOM": {
                "dom_status": "YES",
                "dom_interest": 3,
                "dom_comfort": 4,
                "sub_status": "MAYBE",
                "sub_interest": 2,
                "sub_comfort": 2,
                "conditions": "With safe word"
            },
            "Q_ACTIVE": {
                "active_status": "YES",
                "active_interest": 4,
                "active_comfort": 3,
                "passive_status": "NO",
                "passive_interest": 0,
                "passive_comfort": 1
            },
            "Q_MATCH": {
                "status": "YES",
                "interest": 3,
                "comfort": 4
            }
        },
        "B": {
            "Q_DOM": {
                "dom_status": "YES",
                "dom_interest": 4,
                "dom_comfort": 3,
                "sub_status": "YES",
                "sub_interest": 3,
                "sub_comfort": 4,
                "conditions": ""
            },
            "Q_ACTIVE": {
                "active_status": "MAYBE",
                "active_interest": 2,
                "active_comfort": 2,
                "passive_status": "YES",
                "passive_interest": 3,
                "passive_comfort": 4,
                "conditions": "Gentle"
            },
            "Q_MATCH": {
                "status": "YES",
                "interest": 4,
                "comfort": 3
            }
        }
    }


@pytest.fixture
def test_client(test_db):
    """FastAPI test client with test database."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def session_data(test_db, test_client, sample_template):
    """Create a test session with template."""
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
        }
    )
    assert response.status_code == 200
    session = response.json()
    
    return {
        "session_id": session["id"],
    }








