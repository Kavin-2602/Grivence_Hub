from django.core.exceptions import ValidationError
from complaints.models import ComplaintHistory

# Valid next transitions map
VALID_TRANSITIONS = {
    'Submitted': ['AI Analysed'],
    'AI Analysed': ['Assigned'],
    'Assigned': ['In Progress'],
    'In Progress': ['Resolution Pending Verification', 'Resolved'],
    'Resolution Pending Verification': ['Resolved', 'Reopened'],
    'Resolved': ['Closed', 'Reopened'],
    'Reopened': ['In Progress', 'Assigned'],
    'Closed': [],
}

def transition_complaint_status(complaint, new_status, user=None, remarks=None):
    """
    Enforces transitions for Complaint status.
    Logs transition in ComplaintHistory.
    """
    old_status = complaint.status
    if old_status == new_status:
        return complaint

    allowed_next = VALID_TRANSITIONS.get(old_status, [])
    if new_status not in allowed_next:
        raise ValidationError(
            f"Invalid transition from '{old_status}' to '{new_status}'. Allowed transitions: {allowed_next}"
        )

    # Require resolution proof and notes for pending verification or resolved
    if new_status in ['Resolution Pending Verification', 'Resolved']:
        if not complaint.resolution_proof_url or not complaint.resolution_notes:
            raise ValidationError(
                f"Resolution proof URL and resolution notes are required before transitioning to '{new_status}'."
            )

    complaint.status = new_status
    complaint.save()

    # Log historical transition
    ComplaintHistory.objects.create(
        complaint=complaint,
        changed_by=user,
        old_status=old_status,
        new_status=new_status,
        remarks=remarks or f"Status changed from {old_status} to {new_status}"
    )

    return complaint
