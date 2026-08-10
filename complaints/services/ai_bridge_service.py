from complaints.models import Department

def analyse_complaint_text(description):
    """
    Accepts raw description, computes dynamic Category, Auto-assigned Department (model instance),
    Confidence Score, Priority matrix, and Reasoning text.
    """
    text = description.lower()
    
    # Defaults
    category = "General"
    dept_code = "ACADEMIC"
    reasoning = "Standard routing based on keywords."
    confidence = 0.90
    
    # Priority matrix items default
    severity = 2
    urgency = 2
    impact = 2
    safety_risk = 2
    recurrence = 1

    # Canteen / Food
    if any(k in text for k in ["food", "canteen", "lunch", "dinner", "plate", "meal"]):
        category = "Food / Safety Hazard"
        dept_code = "CANTEEN"
        reasoning = "Complaint mentions food/dining service in canteen."
        confidence = 0.95
        if any(k in text for k in ["metal", "safety", "poison", "insect", "contamination"]):
            safety_risk = 5
            severity = 5
            urgency = 5
            reasoning = "Critical food safety concern detected."
            confidence = 0.98

    # Transport
    elif any(k in text for k in ["bus", "transport", "route", "driver", "shuttle"]):
        category = "Transport"
        dept_code = "TRANSPORT"
        reasoning = "Complaint relates to transport and transit routing."
        confidence = 0.94
        if any(k in text for k in ["accident", "brake", "rash driving", "hazard"]):
            safety_risk = 4
            severity = 4
            urgency = 5
            reasoning = "Safety hazard on transportation route."
            confidence = 0.97

    # Hostel
    elif any(k in text for k in ["hostel", "room", "warden", "water", "geyser", "bed"]):
        category = "Hostel"
        dept_code = "HOSTEL"
        reasoning = "Complaint registered under residential hostel services."
        confidence = 0.96
        if any(k in text for k in ["water contamination", "electric shock", "electric hazard"]):
            safety_risk = 5
            severity = 5
            reasoning = "Critical safety risk identified in hostel room."
            confidence = 0.99

    # Sports
    elif any(k in text for k in ["sports", "gym", "ground", "game", "court", "equipment"]):
        category = "Sports"
        dept_code = "SPORTS"
        reasoning = "Relates to campus sports activities or gymnasium facilities."
        confidence = 0.92

    # Housekeeping
    elif any(k in text for k in ["clean", "sweep", "dustbin", "waste", "garbage", "trash", "housekeeping"]):
        category = "Housekeeping"
        dept_code = "HOUSEKEEPING"
        reasoning = "Complaint assigned to housekeeping for sanitization/cleaning."
        confidence = 0.93

    # Try to find corresponding Department
    try:
        department = Department.objects.get(code=dept_code)
    except Department.DoesNotExist:
        department = None

    return {
        "category": category,
        "department": department,
        "confidence_score": confidence,
        "reasoning": reasoning,
        "priority_matrix": {
            "severity": severity,
            "urgency": urgency,
            "impact": impact,
            "safety_risk": safety_risk,
            "recurrence": recurrence,
        }
    }
