import secrets
from django.db.models import Avg, F, Q
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions, status, views
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from complaints.models import CustomUser, Department, Complaint, Feedback, Announcement
from complaints.api.serializers import (
    RegisterSerializer, UserSerializer, ComplaintSerializer, FeedbackSerializer, AnnouncementSerializer
)
from complaints.services.ai_bridge_service import analyse_complaint_text
from complaints.services.priority_sla_service import calculate_priority_and_sla
from complaints.services.workflow_service import transition_complaint_status


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'department': str(self.user.department.id) if self.user.department else None,
            'department_code': self.user.department.code if self.user.department else None,
            'department_name': self.user.department.name if self.user.department else None
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AIAnalyseComplaintView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        description = request.data.get("description", "")
        if not description:
            return Response({"error": "Description is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        analysis = analyse_complaint_text(description)
        # Combine with priority calculation for response
        priority, sla_deadline = calculate_priority_and_sla(
            description,
            severity=analysis['priority_matrix']['severity'],
            urgency=analysis['priority_matrix']['urgency'],
            impact=analysis['priority_matrix']['impact'],
            safety_risk=analysis['priority_matrix']['safety_risk'],
            recurrence=analysis['priority_matrix']['recurrence']
        )
        
        dept_code = analysis['department'].code if analysis['department'] else None
        confidence = round(analysis['confidence_score'] * 100 if analysis['confidence_score'] <= 1.0 else analysis['confidence_score'], 1)

        return Response({
            "category": analysis['category'],
            "department": str(analysis['department'].id) if analysis['department'] else None,
            "department_name": analysis['department'].name if analysis['department'] else None,
            "department_code": dept_code,
            "assigned_dept_code": dept_code,
            "confidence_score": confidence,
            "ai_confidence_score": confidence,
            "reasoning": analysis['reasoning'],
            "priority": priority,
            "sla_hours_assigned": 4 if priority == "Critical" else (24 if priority == "High" else (72 if priority == "Medium" else 168))
        })


class ComplaintCreateListView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Complaint.objects.select_related('student', 'assigned_department').prefetch_related('history', 'history__changed_by', 'feedback').all().order_by('-created_at')

        # If user is STUDENT, only return their own complaints (where they aren't anonymous or are the owner)
        if user.role == 'STUDENT':
            queryset = queryset.filter(student=user)
        # If user is DEPT_HEAD, filter by their department
        elif user.role == 'DEPT_HEAD' and user.department:
            queryset = queryset.filter(assigned_department=user.department)

        # Filters
        dept_id = self.request.query_params.get('department')
        priority = self.request.query_params.get('priority')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if dept_id:
            queryset = queryset.filter(assigned_department_id=dept_id)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search) | Q(ticket_id__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        description = self.request.data.get('description', '')
        title = self.request.data.get('title', '')
        image_url = self.request.data.get('image_url')
        is_anonymous = self.request.data.get('is_anonymous', False)

        # Run AI Bridge analysis
        analysis = analyse_complaint_text(description)
        priority, sla_deadline = calculate_priority_and_sla(
            description,
            title=title,
            severity=analysis['priority_matrix']['severity'],
            urgency=analysis['priority_matrix']['urgency'],
            impact=analysis['priority_matrix']['impact'],
            safety_risk=analysis['priority_matrix']['safety_risk'],
            recurrence=analysis['priority_matrix']['recurrence']
        )

        serializer.save(
            student=user,
            category=analysis['category'],
            assigned_department=analysis['department'],
            priority=priority,
            sla_deadline_at=sla_deadline,
            ai_confidence_score=analysis['confidence_score'],
            ai_routing_reasoning=analysis['reasoning'],
            image_url=image_url,
            is_anonymous=is_anonymous,
            status='AI Analysed'  # Set to AI Analysed status initially
        )


class ComplaintTrackView(generics.RetrieveAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'ticket_id'


class ComplaintFeedbackView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id, *args, **kwargs):
        try:
            complaint = Complaint.objects.get(id=id)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        if complaint.student != request.user:
            return Response({"error": "Only the student owner can leave feedback"}, status=status.HTTP_403_FORBIDDEN)

        rating = request.data.get('rating')
        comments = request.data.get('comments')
        selected_tags = request.data.get('selected_tags', [])
        reopen_requested = request.data.get('reopen_requested', False)

        feedback_data = {
            'rating': rating,
            'comments': comments,
            'selected_tags': selected_tags,
            'reopen_requested': reopen_requested
        }

        # Check existing feedback
        if hasattr(complaint, 'feedback'):
            return Response({"error": "Feedback already submitted for this complaint"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = FeedbackSerializer(data=feedback_data)
        if serializer.is_valid():
            serializer.save(complaint=complaint)
            
            # If reopen is requested, transition state to Reopened
            if reopen_requested:
                try:
                    transition_complaint_status(
                        complaint,
                        'Reopened',
                        user=request.user,
                        remarks="Reopen requested by student feedback."
                    )
                except ValidationError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminDashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role not in ['ADMIN', 'DEPT_HEAD']:
            return Response({"error": "Unauthorized Access"}, status=status.HTTP_403_FORBIDDEN)

        unresolved_statuses = [
            'Submitted', 'AI Analysed', 'Assigned', 'In Progress',
            'Resolution Pending Verification', 'Reopened'
        ]

        # Total Open Tickets
        total_open = Complaint.objects.filter(status__in=unresolved_statuses).count()

        # Critical Escalations (Priority is Critical, Status is unresolved)
        critical_escalations = Complaint.objects.filter(
            priority='Critical',
            status__in=unresolved_statuses
        ).count()

        # SLA Breaches (is_sla_breached = True)
        sla_breaches = Complaint.objects.filter(is_sla_breached=True).count()

        # Avg Resolution Time (in hours)
        resolved_complaints = Complaint.objects.filter(status__in=['Resolved', 'Closed'])
        durations = []
        for comp in resolved_complaints:
            diff = comp.updated_at - comp.created_at
            durations.append(diff.total_seconds() / 3600.0)

        avg_resolution = round(sum(durations) / len(durations), 1) if durations else 0.0

        return Response({
            "total_open_tickets": total_open,
            "critical_escalations": critical_escalations,
            "sla_breaches": sla_breaches,
            "avg_resolution_time_hours": avg_resolution
        })


PROOF_REQUIRED_STATUSES = {'Resolution Pending Verification', 'Resolved'}

class ComplaintStatusUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id, *args, **kwargs):
        try:
            complaint = Complaint.objects.get(id=id)
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        resolution_proof_url = request.data.get('resolution_proof_url')
        resolution_notes = request.data.get('resolution_notes')
        remarks = request.data.get('remarks')

        # ── Server-side RLS: DEPT_HEAD can only update their own dept's complaints ──
        if request.user.role == 'DEPT_HEAD':
            if not request.user.department or complaint.assigned_department != request.user.department:
                return Response(
                    {"error": "Forbidden: you may only update complaints assigned to your department."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # ── Proof gate: validate from REQUEST body, not stale DB values ────────
        # Each individual PATCH that moves into a restricted status MUST supply
        # proof_url and resolution_notes in THIS request — we do NOT inherit them
        # from prior saves. This prevents a second call (without proof) from
        # passing because the DB row already has proof from an earlier call.
        if new_status in PROOF_REQUIRED_STATUSES:
            if not resolution_proof_url or not resolution_notes:
                return Response(
                    {"error": f"'resolution_proof_url' and 'resolution_notes' are required "
                              f"when transitioning to '{new_status}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Only write proof fields to model if they were provided in this request
        if resolution_proof_url:
            complaint.resolution_proof_url = resolution_proof_url
        if resolution_notes:
            complaint.resolution_notes = resolution_notes

        # Assign department head automatically to Assigned status if transitioning from AI Analysed
        if complaint.status == 'AI Analysed' and new_status == 'Assigned' and complaint.assigned_department:
            pass  # Standard path

        try:
            # Save resolution details first so that workflow_service validation sees them
            complaint.save()
            transition_complaint_status(complaint, new_status, user=request.user, remarks=remarks)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ComplaintSerializer(complaint).data)


class CreateStaffView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admins can create staff accounts"}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email')
        full_name = request.data.get('full_name')
        department_id = request.data.get('department')

        if not email or not full_name or not department_id:
            return Response({"error": "email, full_name, and department are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            try:
                import uuid
                uuid_val = uuid.UUID(department_id)
                department = Department.objects.get(Q(id=uuid_val) | Q(code=department_id))
            except ValueError:
                department = Department.objects.get(code=department_id)
        except Department.DoesNotExist:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

        # Generate temporary password
        temp_password = secrets.token_urlsafe(8)

        try:
            user = CustomUser.objects.create_user(
                email=email,
                password=temp_password,
                full_name=full_name,
                role='DEPT_HEAD',
                department=department
            )
            
            # Associate department's head_user to user
            department.head_user = user
            department.save()
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message": "Staff member created successfully.",
            "user": UserSerializer(user).data,
            "temporary_password": temp_password
        }, status=status.HTTP_201_CREATED)


class AnnouncementCreateListView(generics.ListCreateAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.all()
        
        # Filter for student: show ALL_STUDENTS or SPECIFIC_DEPT matching student's department
        if user.role == 'STUDENT':
            queryset = queryset.filter(
                Q(target_audience='ALL_STUDENTS') |
                (Q(target_audience='SPECIFIC_DEPT') & Q(department=user.department))
            )
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role not in ['ADMIN', 'DEPT_HEAD']:
            raise ValidationError("Only Admins and Department Heads can create announcements.")
        serializer.save(created_by=self.request.user)
