import pytest
from app.compare import (
    compare,
    _status_pair,
    _flag_low_comfort_high_interest,
    _generate_action_plan
)


class TestStatusPair:
    """Tests for _status_pair function."""
    
    def test_status_pair_match(self):
        """Test that YES/YES produces MATCH."""
        assert _status_pair("YES", "YES") == "MATCH"
        
    def test_status_pair_boundary_no(self):
        """Test that NO in either position produces BOUNDARY."""
        assert _status_pair("NO", "YES") == "BOUNDARY"
        assert _status_pair("YES", "NO") == "BOUNDARY"
        assert _status_pair("NO", "NO") == "BOUNDARY"
        
    def test_status_pair_boundary_hard_limit(self):
        """Test that HARD_LIMIT produces BOUNDARY."""
        assert _status_pair("HARD_LIMIT", "YES") == "BOUNDARY"
        assert _status_pair("YES", "HARD_LIMIT") == "BOUNDARY"
        assert _status_pair("HARD_LIMIT", "MAYBE") == "BOUNDARY"
        
    def test_status_pair_explore(self):
        """Test that other combinations produce EXPLORE."""
        assert _status_pair("YES", "MAYBE") == "EXPLORE"
        assert _status_pair("MAYBE", "YES") == "EXPLORE"
        assert _status_pair("MAYBE", "MAYBE") == "EXPLORE"


class TestFlagLowComfortHighInterest:
    """Tests for _flag_low_comfort_high_interest function."""
    
    def test_flag_low_comfort_high_interest_positive(self):
        """Test that high interest and low comfort triggers flag."""
        entry = {"interest": 3, "comfort": 2}
        assert _flag_low_comfort_high_interest(entry) is True
        
        entry = {"interest": 4, "comfort": 1}
        assert _flag_low_comfort_high_interest(entry) is True
        
        entry = {"interest": 3, "comfort": 1}
        assert _flag_low_comfort_high_interest(entry) is True
        
    def test_flag_low_comfort_high_interest_negative(self):
        """Test that other combinations don't trigger flag."""
        entry = {"interest": 2, "comfort": 3}
        assert _flag_low_comfort_high_interest(entry) is False
        
        entry = {"interest": 3, "comfort": 3}
        assert _flag_low_comfort_high_interest(entry) is False
        
        entry = {"interest": 4, "comfort": 4}
        assert _flag_low_comfort_high_interest(entry) is False
        
    def test_flag_low_comfort_high_interest_missing_values(self):
        """Test handling of missing values."""
        entry = {}
        assert _flag_low_comfort_high_interest(entry) is False
        
        entry = {"interest": 3}
        assert _flag_low_comfort_high_interest(entry) is False
        
        entry = {"comfort": 2}
        assert _flag_low_comfort_high_interest(entry) is False
        
    def test_flag_low_comfort_high_interest_invalid_types(self):
        """Test handling of invalid types."""
        entry = {"interest": "not_a_number", "comfort": 2}
        assert _flag_low_comfort_high_interest(entry) is False
        
        entry = {"interest": 3, "comfort": "not_a_number"}
        assert _flag_low_comfort_high_interest(entry) is False


class TestCompareConsentRating:
    """Tests for compare function with consent_rating schema."""
    
    def test_compare_consent_rating_match(self, sample_template, sample_responses):
        """Test MATCH status for YES/YES."""
        resp_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        assert len(result["items"]) > 0
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert q1_item["pair_status"] == "MATCH"
        assert result["summary"]["counts"]["MATCH"] >= 1
        
    def test_compare_consent_rating_boundary(self, sample_template):
        """Test BOUNDARY status for NO."""
        resp_a = {"Q1": {"status": "NO", "interest": 0, "comfort": 0}}
        resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert q1_item["pair_status"] == "BOUNDARY"
        assert result["summary"]["counts"]["BOUNDARY"] >= 1
        
    def test_compare_consent_rating_explore(self, sample_template):
        """Test EXPLORE status for MAYBE."""
        resp_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 4}}
        resp_b = {"Q1": {"status": "MAYBE", "interest": 2, "comfort": 3, "conditions": "Slow"}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert q1_item["pair_status"] == "EXPLORE"
        assert result["summary"]["counts"]["EXPLORE"] >= 1
        
    def test_compare_consent_rating_deltas(self, sample_template):
        """Test delta calculations for interest and comfort."""
        resp_a = {"Q1": {"status": "YES", "interest": 1, "comfort": 2}}
        resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert q1_item["delta_interest"] == 3
        assert q1_item["delta_comfort"] == 2
        
    def test_compare_consent_rating_low_comfort_high_interest_flag(self, sample_template):
        """Test low comfort high interest flag."""
        resp_a = {"Q1": {"status": "YES", "interest": 3, "comfort": 2}}
        resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 3}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert "low_comfort_high_interest" in q1_item["flags"]
        assert result["summary"]["flags"]["low_comfort_high_interest"] >= 1
        
    def test_compare_consent_rating_big_delta_flag(self, sample_template):
        """Test big delta flag."""
        resp_a = {"Q1": {"status": "YES", "interest": 0, "comfort": 0}}
        resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert "big_delta" in q1_item["flags"]
        assert result["summary"]["flags"]["big_delta"] >= 1
        
    def test_compare_consent_rating_hard_limit_violation(self, sample_template):
        """Test hard limit violation flag."""
        resp_a = {"Q1": {"status": "HARD_LIMIT", "interest": 0, "comfort": 0}}
        resp_b = {"Q1": {"status": "YES", "interest": 4, "comfort": 4}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q1_item = next((item for item in result["items"] if item["question_id"] == "Q1"), None)
        assert q1_item is not None
        assert "hard_limit_violation" in q1_item["flags"]
        assert result["summary"]["flags"]["hard_limit_violation"] >= 1
        
    def test_compare_consent_rating_dom_sub_variant(self, sample_template_with_variants, sample_responses_with_variants):
        """Test dom/sub variant handling."""
        result = compare(
            sample_template_with_variants,
            sample_responses_with_variants["A"],
            sample_responses_with_variants["B"]
        )
        
        q_dom = next((item for item in result["items"] if item["question_id"] == "Q_DOM"), None)
        assert q_dom is not None
        assert "dom_status" in q_dom
        assert "sub_status" in q_dom
        assert q_dom["dom_status"] in ["MATCH", "EXPLORE", "BOUNDARY"]
        assert q_dom["sub_status"] in ["MATCH", "EXPLORE", "BOUNDARY"]
        
    def test_compare_consent_rating_active_passive_variant(self, sample_template_with_variants, sample_responses_with_variants):
        """Test active/passive variant handling."""
        result = compare(
            sample_template_with_variants,
            sample_responses_with_variants["A"],
            sample_responses_with_variants["B"]
        )
        
        q_active = next((item for item in result["items"] if item["question_id"] == "Q_ACTIVE"), None)
        assert q_active is not None
        assert "active_status" in q_active
        assert "passive_status" in q_active
        assert q_active["active_status"] in ["MATCH", "EXPLORE", "BOUNDARY"]
        assert q_active["passive_status"] in ["MATCH", "EXPLORE", "BOUNDARY"]


class TestCompareScale010:
    """Tests for compare function with scale_0_10 schema."""
    
    def test_compare_scale_match(self, sample_template):
        """Test MATCH for close values."""
        resp_a = {"Q2": {"value": 7}}
        resp_b = {"Q2": {"value": 8}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q2_item = next((item for item in result["items"] if item["question_id"] == "Q2"), None)
        assert q2_item is not None
        assert q2_item["pair_status"] == "MATCH"
        assert q2_item["delta_value"] == 1
        
    def test_compare_scale_explore(self, sample_template):
        """Test EXPLORE for distant values."""
        resp_a = {"Q2": {"value": 2}}
        resp_b = {"Q2": {"value": 8}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q2_item = next((item for item in result["items"] if item["question_id"] == "Q2"), None)
        assert q2_item is not None
        assert q2_item["pair_status"] == "EXPLORE"
        assert q2_item["delta_value"] == 6
        
    def test_compare_scale_big_delta_flag(self, sample_template):
        """Test big delta flag for scale."""
        resp_a = {"Q2": {"value": 0}}
        resp_b = {"Q2": {"value": 5}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q2_item = next((item for item in result["items"] if item["question_id"] == "Q2"), None)
        assert q2_item is not None
        assert "big_delta" in q2_item["flags"]
        assert result["summary"]["flags"]["big_delta"] >= 1


class TestCompareEnum:
    """Tests for compare function with enum schema."""
    
    def test_compare_enum_match(self, sample_template):
        """Test MATCH for same enum value."""
        resp_a = {"Q3": {"value": "Option1"}}
        resp_b = {"Q3": {"value": "Option1"}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q3_item = next((item for item in result["items"] if item["question_id"] == "Q3"), None)
        assert q3_item is not None
        assert q3_item["pair_status"] == "MATCH"
        assert q3_item["match_value"] is True
        
    def test_compare_enum_explore(self, sample_template):
        """Test EXPLORE for different enum values."""
        resp_a = {"Q3": {"value": "Option1"}}
        resp_b = {"Q3": {"value": "Option2"}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q3_item = next((item for item in result["items"] if item["question_id"] == "Q3"), None)
        assert q3_item is not None
        assert q3_item["pair_status"] == "EXPLORE"
        assert q3_item["match_value"] is False


class TestCompareMulti:
    """Tests for compare function with multi schema."""
    
    def test_compare_multi_match(self, sample_template):
        """Test MATCH when intersection exists."""
        resp_a = {"Q4": {"values": ["Option1", "Option2"]}}
        resp_b = {"Q4": {"values": ["Option1", "Option3"]}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q4_item = next((item for item in result["items"] if item["question_id"] == "Q4"), None)
        assert q4_item is not None
        assert q4_item["pair_status"] == "MATCH"
        assert "intersection" in q4_item
        assert "Option1" in q4_item["intersection"]
        
    def test_compare_multi_explore(self, sample_template):
        """Test EXPLORE when no intersection."""
        resp_a = {"Q4": {"values": ["Option1", "Option2"]}}
        resp_b = {"Q4": {"values": ["Option3"]}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q4_item = next((item for item in result["items"] if item["question_id"] == "Q4"), None)
        assert q4_item is not None
        assert q4_item["pair_status"] == "EXPLORE"
        assert len(q4_item["intersection"]) == 0


class TestCompareText:
    """Tests for compare function with text schema."""
    
    def test_compare_text_explore(self, sample_template):
        """Test that text schema always results in EXPLORE."""
        resp_a = {"Q5": {"text": "Some text"}}
        resp_b = {"Q5": {"text": "Other text"}}
        
        result = compare(sample_template, resp_a, resp_b)
        
        q5_item = next((item for item in result["items"] if item["question_id"] == "Q5"), None)
        assert q5_item is not None
        assert q5_item["pair_status"] == "EXPLORE"


class TestCompareRiskLevel:
    """Tests for risk level handling."""
    
    def test_compare_high_risk_flag(self, sample_template):
        """Test that risk level C triggers high_risk flag."""
        # Create template with risk level C
        template = {
            "id": "test",
            "name": "Test",
            "version": 1,
            "modules": [{
                "id": "m1",
                "name": "Module",
                "questions": [{
                    "id": "Q_HIGH_RISK",
                    "schema": "consent_rating",
                    "risk_level": "C",
                    "label": "High Risk Question",
                    "tags": []
                }]
            }]
        }
        
        resp_a = {"Q_HIGH_RISK": {"status": "YES", "interest": 3, "comfort": 4}}
        resp_b = {"Q_HIGH_RISK": {"status": "YES", "interest": 4, "comfort": 3}}
        
        result = compare(template, resp_a, resp_b)
        
        q_item = next((item for item in result["items"] if item["question_id"] == "Q_HIGH_RISK"), None)
        assert q_item is not None
        assert "high_risk" in q_item["flags"]
        assert result["summary"]["flags"]["high_risk"] >= 1


class TestGenerateActionPlan:
    """Tests for _generate_action_plan function."""
    
    def test_generate_action_plan_empty(self):
        """Test action plan generation with no matches."""
        items = []
        plan = _generate_action_plan(items)
        assert plan == []
        
    def test_generate_action_plan_matches(self):
        """Test action plan generation with matches."""
        items = [
            {
                "pair_status": "MATCH",
                "schema": "consent_rating",
                "a": {"comfort": 3, "interest": 3},
                "b": {"comfort": 4, "interest": 3},
                "module_id": "m1",
                "tags": ["kissing"],
                "risk_level": "A"
            },
            {
                "pair_status": "MATCH",
                "schema": "consent_rating",
                "a": {"comfort": 4, "interest": 4},
                "b": {"comfort": 3, "interest": 4},
                "module_id": "m2",
                "tags": ["touching"],
                "risk_level": "A"
            },
            {
                "pair_status": "MATCH",
                "schema": "consent_rating",
                "a": {"comfort": 3, "interest": 3},
                "b": {"comfort": 3, "interest": 3},
                "module_id": "m3",
                "tags": ["cuddling"],
                "risk_level": "A"
            },
            {
                "pair_status": "EXPLORE",  # Should be filtered out
                "schema": "consent_rating",
                "a": {"comfort": 3, "interest": 3},
                "b": {"comfort": 3, "interest": 3},
                "module_id": "m4",
                "tags": [],
                "risk_level": "A"
            }
        ]
        
        plan = _generate_action_plan(items)
        
        assert len(plan) <= 3
        assert all(item["pair_status"] == "MATCH" for item in plan)
        assert all(item["schema"] == "consent_rating" for item in plan)
        
    def test_generate_action_plan_low_comfort_filtered(self):
        """Test that items with low comfort are filtered out."""
        items = [
            {
                "pair_status": "MATCH",
                "schema": "consent_rating",
                "a": {"comfort": 2, "interest": 3},  # Low comfort
                "b": {"comfort": 1, "interest": 3},  # Low comfort
                "module_id": "m1",
                "tags": ["kissing"],
                "risk_level": "A"
            }
        ]
        
        plan = _generate_action_plan(items)
        assert len(plan) == 0


class TestCompareFull:
    """Tests for full compare function with all features."""
    
    def test_compare_full_template(self, sample_template, sample_responses):
        """Test compare with full template and responses."""
        result = compare(
            sample_template,
            sample_responses["A"],
            sample_responses["B"]
        )
        
        assert "meta" in result
        assert "summary" in result
        assert "items" in result
        assert "action_plan" in result
        
        assert result["meta"]["template_id"] == sample_template["id"]
        assert "counts" in result["summary"]
        assert "flags" in result["summary"]
        assert "generated_at" in result["summary"]
        assert isinstance(result["items"], list)
        assert isinstance(result["action_plan"], list)
        
    def test_compare_items_sorted(self, sample_template, sample_responses):
        """Test that items are sorted correctly (BOUNDARY first, then EXPLORE, then MATCH)."""
        result = compare(
            sample_template,
            sample_responses["A"],
            sample_responses["B"]
        )
        
        items = result["items"]
        order_map = {"BOUNDARY": 0, "EXPLORE": 1, "MATCH": 2}
        
        for i in range(len(items) - 1):
            current_order = order_map.get(items[i]["pair_status"], 9)
            next_order = order_map.get(items[i + 1]["pair_status"], 9)
            assert current_order <= next_order

