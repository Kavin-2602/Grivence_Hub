from django.core.management.base import BaseCommand
from django.utils import timezone
from complaints.models import Complaint, ComplaintHistory

class Command(BaseCommand):
    help = "Checks for unresolved complaints that have breached SLA and escalates them."

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Unresolved are anything except Resolved or Closed
        unresolved_statuses = [
            'Submitted',
            'AI Analysed',
            'Assigned',
            'In Progress',
            'Resolution Pending Verification',
            'Reopened'
        ]
        
        breached_complaints = Complaint.objects.filter(
            status__in=unresolved_statuses,
            sla_deadline_at__lt=now,
            is_sla_breached=False
        )

        count = 0
        for complaint in breached_complaints:
            old_priority = complaint.priority
            complaint.is_sla_breached = True
            complaint.priority = 'Critical'
            complaint.save()

            # Record history
            ComplaintHistory.objects.create(
                complaint=complaint,
                changed_by=None,
                old_status=complaint.status,
                new_status=complaint.status,
                remarks=f"SLA breached (Deadline: {complaint.sla_deadline_at}). Priority elevated from {old_priority} to Critical."
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully processed SLA breaches. Escalated {count} tickets."))
