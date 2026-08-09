import pytest
from ai_bridge_service import classify_complaint, DEPARTMENTS, PRIORITIES

def test_ticket_1042_regression():
    """
    Ticket #1042 Seed Regression Test:
    Input: "Piece of metal found in Block C lunch today"
    Expected Output:
    {
      "category": "Food / Safety Hazard",
      "assigned_dept_code": "CANTEEN",
      "priority": "Critical",
      "ai_confidence_score": 97.0,
      "ai_routing_reasoning": "Metal contamination in food is a critical safety risk"
    }
    """
    description = "Piece of metal found in Block C lunch today"
    result = classify_complaint(description)
    
    # Assert exact fields match the requirements
    assert result["category"] == "Food / Safety Hazard"
    assert result["assigned_dept_code"] == "CANTEEN"
    assert result["priority"] == "Critical"
    assert result["ai_confidence_score"] == 97.0
    assert result["ai_routing_reasoning"] == "Metal contamination in food is a critical safety risk"
    # Even if embedding is optional/None, check keys are present
    assert "embedding" in result

def test_safety_override_keywords():
    """
    Test that safety override keywords trigger Critical priority.
    """
    override_texts = [
        "There is an electric hazard in the ground floor lobby",
        "Water contamination reported in block A",
        "A small fire started near the kitchen exhaust",
        "We suspect a gas leak in room 302",
        "There's a poison risk from the cleaning chemicals left open"
    ]
    for text in override_texts:
        result = classify_complaint(text)
        assert result["priority"] == "Critical"
        assert "override" in result["ai_routing_reasoning"].lower()

def test_department_routing():
    """
    Test routing logic for different departments.
    """
    # Transport test
    res_transport = classify_complaint("The shuttle bus driver was late and missed the campus route")
    assert res_transport["assigned_dept_code"] == "TRANSPORT"
    
    # Hostel test
    res_hostel = classify_complaint("The water heater geyser in block b bathroom is not working")
    assert res_hostel["assigned_dept_code"] == "HOSTEL"
    
    # Sports test
    res_sports = classify_complaint("Need new basketball equipment and net repair at the gym court")
    assert res_sports["assigned_dept_code"] == "SPORTS"
    
    # Academic test
    res_academic = classify_complaint("Professor grading for the exam syllabus is delayed")
    assert res_academic["assigned_dept_code"] == "ACADEMIC"
    
    # Hospitality test
    res_hospitality = classify_complaint("Housekeeping cleaning needed for the lobby visitor reception area")
    assert res_hospitality["assigned_dept_code"] == "HOSPITALITY"

def test_priority_score_boundaries():
    """
    Test mapping of composite score to priority levels.
    """
    # Low Priority: very mundane request
    res_low = classify_complaint("The lounge welcome mat is slightly dirty")
    assert res_low["priority"] == "Low" or res_low["priority"] == "Medium"
    
    # Critical due to extreme factors (high severity, urgency, impact, safety risk)
    # "Fire in the whole hostel building immediately"
    res_crit = classify_complaint("Fire hazard reported in the whole dormitory building immediately. Evacuate everyone.")
    assert res_crit["priority"] == "Critical"

def test_edge_cases_and_graceful_failures():
    """
    Test that the classifier handles empty, None, or unexpected inputs gracefully.
    """
    # None description
    res_none = classify_complaint(None)
    assert res_none["assigned_dept_code"] in DEPARTMENTS
    assert res_none["priority"] in PRIORITIES
    assert isinstance(res_none["ai_confidence_score"], float)
    
    # Empty description
    res_empty = classify_complaint("")
    assert res_empty["assigned_dept_code"] in DEPARTMENTS
    assert res_empty["priority"] in PRIORITIES
    
    # Non-string input
    res_int = classify_complaint(12345)
    assert res_int["assigned_dept_code"] in DEPARTMENTS
    assert res_int["priority"] in PRIORITIES

def test_optional_embedding():
    """
    Test that embedding key is present in result (either as None or list of 384 floats).
    """
    result = classify_complaint("Normal complaint about food in the canteen.")
    assert "embedding" in result
    if result["embedding"] is not None:
        assert isinstance(result["embedding"], list)
        assert len(result["embedding"]) == 384
        assert all(isinstance(x, float) for x in result["embedding"])
