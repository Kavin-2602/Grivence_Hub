from django.utils import timezone
from datetime import timedelta

def calculate_priority_and_sla(
    description,
    title="",
    severity=1,
    urgency=1,
    impact=1,
    safety_risk=1,
    recurrence=0
):
    """
    Calculate Priority Score = Severity + Urgency + Impact + Safety Risk + Recurrence.
    Assign SLA Deadlines:
      - Critical -> +4 hrs
      - High -> +24 hrs
      - Medium -> +72 hrs
      - Low -> +168 hrs

    Safety Keyword Override: If keywords like "electric hazard", "water contamination",
    "food safety", "metal" exist or safety risk >= 4, force Priority to 'Critical'
    and SLA to 4 Hours.
    """
    score = severity + urgency + impact + safety_risk + recurrence
    
    # Priority defaults based on score
    if score >= 15:
        priority = "Critical"
    elif score >= 10:
        priority = "High"
    elif score >= 5:
        priority = "Medium"
    else:
        priority = "Low"

    # Safety keywords override check
    safety_keywords = ["electric hazard", "water contamination", "food safety", "metal"]
    text_to_check = (title + " " + description).lower()
    
    has_safety_keyword = any(keyword in text_to_check for keyword in safety_keywords)
    
    if has_safety_keyword or safety_risk >= 4:
        priority = "Critical"

    # Map priority to hours
    sla_hours_map = {
        "Critical": 4,
        "High": 24,
        "Medium": 72,
        "Low": 168
    }
    
    hours = sla_hours_map.get(priority, 72)
    sla_deadline = timezone.now() + timedelta(hours=hours)

    return priority, sla_deadline
