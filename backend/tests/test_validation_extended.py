import pytest
from app.routes import validate_responses


class TestValidationEdgeCases:
    """Extended tests for validation edge cases."""
    
    def test_validate_missing_question_id(self):
        """Test validation with responses for non-existent questions."""
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
                    "label": "Question 1",
                    "tags": []
                }]
            }]
        }
        
        responses = {
            "Q1": {"status": "YES", "interest": 3, "comfort": 4},
            "Q_UNKNOWN": {"status": "YES"}  # Unknown question
        }
        
        errors, warnings = validate_responses(template, responses)
        
        assert len(warnings) > 0
        assert any(w["type"] == "unknown_question" for w in warnings)
        
    def test_validate_empty_responses(self):
        """Test validation with empty responses dict."""
        template = {
            "id": "test",
            "name": "Test",
            "version": 1,
            "modules": []
        }
        
        responses = {}
        
        errors, warnings = validate_responses(template, responses)
        
        assert len(errors) == 0
        assert len(warnings) == 0
        
    def test_validate_non_dict_response(self):
        """Test validation with non-dict response value."""
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
                    "label": "Question 1",
                    "tags": []
                }]
            }]
        }
        
        responses = {
            "Q1": "not a dict"  # Invalid format
        }
        
        errors, warnings = validate_responses(template, responses)
        
        # Should handle gracefully without crashing
        assert isinstance(errors, list)
        assert isinstance(warnings, list)
        
    def test_validate_consent_rating_all_statuses(self):
        """Test validation for all consent_rating status values."""
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
                    "label": "Question 1",
                    "tags": []
                }]
            }]
        }
        
        # Test YES
        responses_yes = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        errors, warnings = validate_responses(template, responses_yes)
        assert len(errors) == 0
        
        # Test NO
        responses_no = {"Q1": {"status": "NO", "interest": 0, "comfort": 0}}
        errors, warnings = validate_responses(template, responses_no)
        assert len(errors) == 0
        
        # Test MAYBE without conditions (should error)
        responses_maybe = {"Q1": {"status": "MAYBE", "interest": 2, "comfort": 2}}
        errors, warnings = validate_responses(template, responses_maybe)
        assert len(errors) > 0
        
        # Test MAYBE with conditions (should be valid)
        responses_maybe_cond = {
            "Q1": {
                "status": "MAYBE",
                "interest": 2,
                "comfort": 2,
                "conditions": "Slow and gentle"
            }
        }
        errors, warnings = validate_responses(template, responses_maybe_cond)
        assert len(errors) == 0
        
    def test_validate_consent_rating_boundary_values(self):
        """Test validation with boundary values for interest/comfort."""
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
                    "label": "Question 1",
                    "tags": []
                }]
            }]
        }
        
        # Test minimum values
        responses_min = {"Q1": {"status": "YES", "interest": 0, "comfort": 0}}
        errors, warnings = validate_responses(template, responses_min)
        assert len(errors) == 0
        
        # Test maximum values
        responses_max = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}
        errors, warnings = validate_responses(template, responses_max)
        assert len(errors) == 0
        
        # Test out of range (negative)
        responses_neg = {"Q1": {"status": "YES", "interest": -1, "comfort": 0}}
        errors, warnings = validate_responses(template, responses_neg)
        assert len(errors) > 0
        
        # Test out of range (too high)
        responses_high = {"Q1": {"status": "YES", "interest": 5, "comfort": 4}}
        errors, warnings = validate_responses(template, responses_high)
        assert len(errors) > 0
        
    def test_validate_scale_1_10_boundary_values(self):
        """Test validation with boundary values for scale_1_10."""
        template = {
            "id": "test",
            "name": "Test",
            "version": 1,
            "modules": [{
                "id": "m1",
                "name": "Module",
                "questions": [{
                    "id": "Q1",
                    "schema": "scale_1_10",
                    "label": "Question 1",
                    "tags": []
                }]
            }]
        }
        
        # Test minimum
        responses_min = {"Q1": {"value": 1}}
        errors, warnings = validate_responses(template, responses_min)
        assert len(errors) == 0
        
        # Test maximum
        responses_max = {"Q1": {"value": 10}}
        errors, warnings = validate_responses(template, responses_max)
        assert len(errors) == 0
        
        # Test out of range (below range)
        responses_neg = {"Q1": {"value": 0}}
        errors, warnings = validate_responses(template, responses_neg)
        assert len(errors) > 0
        
        # Test out of range (too high)
        responses_high = {"Q1": {"value": 11}}
        errors, warnings = validate_responses(template, responses_high)
        assert len(errors) > 0
        
    def test_validate_high_risk_warning(self):
        """Test that high-risk questions trigger warnings."""
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
                    "risk_level": "C",
                    "label": "High Risk Question",
                    "tags": []
                }]
            }]
        }
        
        # YES without conditions should trigger warning
        responses = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        errors, warnings = validate_responses(template, responses)
        assert len(warnings) > 0
        assert any(w["type"] == "high_risk_missing_conditions" for w in warnings)
        
        # YES with conditions should not trigger warning
        responses_with_cond = {
            "Q1": {
                "status": "YES",
                "interest": 3,
                "comfort": 4,
                "conditions": "With safety measures"
            }
        }
        errors, warnings = validate_responses(template, responses_with_cond)
        assert not any(w["type"] == "high_risk_missing_conditions" for w in warnings)
        
    def test_validate_dom_sub_variants(self):
        """Test validation for dom/sub variants."""
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
                    "label": "Dom/Sub Question",
                    "tags": []
                }]
            }]
        }
        
        # Dom MAYBE without conditions should error
        responses = {
            "Q1": {
                "dom_status": "MAYBE",
                "dom_interest": 2,
                "dom_comfort": 2,
                "sub_status": "YES",
                "sub_interest": 3,
                "sub_comfort": 4
            }
        }
        errors, warnings = validate_responses(template, responses)
        assert len(errors) > 0
        
        # Dom MAYBE with conditions should be valid
        responses_valid = {
            "Q1": {
                "dom_status": "MAYBE",
                "dom_interest": 2,
                "dom_comfort": 2,
                "sub_status": "YES",
                "sub_interest": 3,
                "sub_comfort": 4,
                "conditions": "With safe word"
            }
        }
        errors, warnings = validate_responses(template, responses_valid)
        assert len(errors) == 0
        
    def test_validate_active_passive_variants(self):
        """Test validation for active/passive variants."""
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
                    "label": "Active/Passive Question",
                    "tags": []
                }]
            }]
        }
        
        # Active MAYBE without conditions should error
        responses = {
            "Q1": {
                "active_status": "MAYBE",
                "active_interest": 2,
                "active_comfort": 2,
                "passive_status": "YES",
                "passive_interest": 3,
                "passive_comfort": 4
            }
        }
        errors, warnings = validate_responses(template, responses)
        assert len(errors) > 0
        
        # Active MAYBE with conditions should be valid
        responses_valid = {
            "Q1": {
                "active_status": "MAYBE",
                "active_interest": 2,
                "active_comfort": 2,
                "passive_status": "YES",
                "passive_interest": 3,
                "passive_comfort": 4,
                "conditions": "Gentle approach"
            }
        }
        errors, warnings = validate_responses(template, responses_valid)
        assert len(errors) == 0
        
    def test_validate_mixed_schemas(self):
        """Test validation with multiple different schemas."""
        template = {
            "id": "test",
            "name": "Test",
            "version": 1,
            "modules": [{
                "id": "m1",
                "name": "Module",
                "questions": [
                    {
                        "id": "Q1",
                        "schema": "consent_rating",
                        "label": "Question 1",
                        "tags": []
                    },
                    {
                        "id": "Q2",
                        "schema": "scale_1_10",
                        "label": "Question 2",
                        "tags": []
                    },
                    {
                        "id": "Q3",
                        "schema": "enum",
                        "label": "Question 3",
                        "options": ["A", "B", "C"],
                        "tags": []
                    }
                ]
            }]
        }
        
        responses = {
            "Q1": {"status": "YES", "interest": 3, "comfort": 4},
            "Q2": {"value": 7},
            "Q3": {"value": "A"}
        }
        
        errors, warnings = validate_responses(template, responses)
        assert len(errors) == 0
