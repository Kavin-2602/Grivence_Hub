import uuid
from datetime import timedelta
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from complaints.models import CustomUser, Department, Complaint, ComplaintHistory, Feedback, Announcement
from complaints.services.priority_sla_service import calculate_priority_and_sla
from complaints.services.workflow_service import transition_complaint_status

class CMSCETests(APITestCase):

    def setUp(self):
        # Create department
        self.canteen_dept = Department.objects.create(
            name="Canteen Operations",
            code="CANTEEN"
        )
        self.transport_dept = Department.objects.create(
            name="Campus Transport",
            code="TRANSPORT"
        )

        # Create student user
        self.student = CustomUser.objects.create_user(
            email="student@cmsce.edu",
            password="studentpassword",
            full_name="John Student",
            reg_number="CMSCE21CS045",
            role="STUDENT"
        )

        # Create admin user
        self.admin = CustomUser.objects.create_superuser(
            email="admin@cmsce.edu",
            password="adminpassword",
            full_name="Admin User"
        )

    def test_jwt_login(self):
        url = reverse('auth_login')
        data = {
            "email": "student@cmsce.edu",
            "password": "studentpassword"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], "student@cmsce.edu")
        self.assertEqual(response.data['user']['role'], "STUDENT")

    def test_priority_safety_override(self):
        # Test keyword trigger
        priority_keyword, deadline_keyword = calculate_priority_and_sla(
            description="Found metal in the food today.",
            title="Metal in Canteen Food",
            severity=1, urgency=1, impact=1, safety_risk=1, recurrence=0
        )
        self.assertEqual(priority_keyword, "Critical")

        # Test safety risk score trigger
        priority_score, deadline_score = calculate_priority_and_sla(
            description="Regular maintenance needed.",
            title="AC maintenance",
            severity=1, urgency=1, impact=1, safety_risk=4, recurrence=0
        )
        self.assertEqual(priority_score, "Critical")

    def test_ticket_creation_and_ai_routing(self):
        # Authenticate student
        self.client.force_authenticate(user=self.student)
        url = reverse('complaints_create_list')
        
        # Post complaint mentioning food safety hazard
        data = {
            "title": "Stale lunch served",
            "description": "The lunch served at the canteen was spoiled. There is a food safety hazard concern.",
            "is_anonymous": False
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['category'], "Food / Safety Hazard")
        self.assertEqual(response.data['priority'], "Critical")
        self.assertEqual(response.data['assigned_department_name'], "Canteen Operations")
        
        # Verify ticket ID is generated format CMP-YYYY-XXXX
        self.assertTrue(response.data['ticket_id'].startswith("CMP-"))

    def test_workflow_state_transitions(self):
        # Create a ticket manually
        now = timezone.now()
        complaint = Complaint.objects.create(
            student=self.student,
            title="Broken chair in class",
            description="A chair is broken in Room 302.",
            category="Academic",
            priority="Medium",
            status="Submitted",
            sla_deadline_at=now + timedelta(hours=72)
        )

        # Submitted -> AI Analysed is valid
        complaint = transition_complaint_status(complaint, 'AI Analysed', user=self.admin)
        self.assertEqual(complaint.status, 'AI Analysed')

        # AI Analysed -> Assigned is valid
        complaint = transition_complaint_status(complaint, 'Assigned', user=self.admin)
        self.assertEqual(complaint.status, 'Assigned')

        # Assigned -> In Progress is valid
        complaint = transition_complaint_status(complaint, 'In Progress', user=self.admin)
        self.assertEqual(complaint.status, 'In Progress')

        # Try In Progress -> Resolved without proof should fail
        with self.assertRaises(ValidationError):
            transition_complaint_status(complaint, 'Resolved', user=self.admin)

        # Set proof URL & notes
        complaint.resolution_proof_url = "https://example.com/resolved.jpg"
        complaint.resolution_notes = "Fixed the broken chair."
        complaint.save()

        # In Progress -> Resolved with proof should succeed
        complaint = transition_complaint_status(complaint, 'Resolved', user=self.admin)
        self.assertEqual(complaint.status, 'Resolved')

        # History should contain entries
        self.assertEqual(ComplaintHistory.objects.filter(complaint=complaint).count(), 4)

    def test_sla_escalation_runner(self):
        # Create a breached complaint
        past_time = timezone.now() - timedelta(hours=10)
        complaint = Complaint.objects.create(
            student=self.student,
            title="Water leak",
            description="Leaky pipe in corridor",
            category="Hostel",
            priority="Medium",
            status="In Progress",
            sla_deadline_at=past_time,
            is_sla_breached=False
        )

        # Run escalation command
        call_command('check_sla_escalation')

        complaint.refresh_from_db()
        self.assertTrue(complaint.is_sla_breached)
        self.assertEqual(complaint.priority, 'Critical')

    def test_admin_dashboard_analytics(self):
        self.client.force_authenticate(user=self.admin)
        
        # Create some complaints
        now = timezone.now()
        Complaint.objects.create(
            student=self.student, title="A", description="A", category="C", priority="Critical", status="In Progress", sla_deadline_at=now, is_sla_breached=True
        )
        Complaint.objects.create(
            student=self.student, title="B", description="B", category="C", priority="Medium", status="Submitted", sla_deadline_at=now
        )
        
        url = reverse('admin_dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_open_tickets'], 2)
        self.assertEqual(response.data['critical_escalations'], 1)
        self.assertEqual(response.data['sla_breaches'], 1)
