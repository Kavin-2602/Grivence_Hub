from complaints.models import Department

def analyse_complaint_text(description):
    """
    Accepts raw description, computes dynamic Category, Auto-assigned Department (model instance),
    Confidence Score (0-100 scale), Priority matrix, and Reasoning text.
    """
    text = description.lower()
    
    # Defaults
    category = "General"
    dept_code = "ACADEMIC"
    reasoning = "Standard routing based on keywords."
    confidence = 90.0
    
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
        confidence = 95.0
        if any(k in text for k in ["metal", "safety", "poison", "insect", "contamination"]):
            safety_risk = 5
            severity = 5
            urgency = 5
            reasoning = "Critical food safety concern detected."
            confidence = 98.0

    # Transport
    elif any(k in text for k in ["bus", "transport", "route", "driver", "shuttle", "delayed", "midterm"]):
        category = "Transport"
        dept_code = "TRANSPORT"
        reasoning = "Complaint relates to transport and transit routing."
        confidence = 94.0
        if any(k in text for k in ["accident", "brake", "rash driving", "hazard"]):
            safety_risk = 4
            severity = 4
            urgency = 5
            reasoning = "Safety hazard on transportation route."
            confidence = 97.0

    # Hostel
    elif any(k in text for k in ["hostel", "room", "warden", "water", "geyser", "bed"]):
        category = "Hostel"
        dept_code = "HOSTEL"
        reasoning = "Complaint registered under residential hostel services."
        confidence = 96.0
        if any(k in text for k in ["water contamination", "electric shock", "electric hazard"]):
            safety_risk = 5
            severity = 5
            reasoning = "Critical safety risk identified in hostel room."
            confidence = 99.0

    # Sports
    elif any(k in text for k in ["sport", "cricket", "ground", "ball", "bat", "gym"]):
        category = "Sports"
        dept_code = "SPORTS"
        reasoning = "Complaint pertains to sports equipment and facilities."
        confidence = 95.0

    # Hospitality
    elif any(k in text for k in ["guest house", "hospitality", "lounge", "air conditioning", "ac"]):
        category = "Hospitality"
        dept_code = "HOSPITALITY"
        reasoning = "Complaint registered under campus hospitality and guest services."
        confidence = 94.0

    # Academic
    elif any(k in text for k in ["exam", "grade", "marksheet", "professor", "class", "course", "academic"]):
        category = "Academic"
        dept_code = "ACADEMIC"
        reasoning = "Complaint related to academic courses, grading, or examinations."
        confidence = 97.0

    # Retrieve Department instance from DB
    department = Department.objects.filter(code=dept_code).first()

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
            "recurrence": recurrence
        }
    }
