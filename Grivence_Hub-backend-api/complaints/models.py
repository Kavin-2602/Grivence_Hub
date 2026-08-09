import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "ADMIN")
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('STUDENT', 'STUDENT'),
        ('ADMIN', 'ADMIN'),
        ('DEPT_HEAD', 'DEPT_HEAD'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    reg_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_members'
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"


class Department(models.Model):
    CODE_CHOICES = [
        ('CANTEEN', 'CANTEEN'),
        ('TRANSPORT', 'TRANSPORT'),
        ('HOSTEL', 'HOSTEL'),
        ('SPORTS', 'SPORTS'),
        ('ACADEMIC', 'ACADEMIC'),
        ('HOSPITALITY', 'HOSPITALITY'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, choices=CODE_CHOICES)
    head_user = models.OneToOneField(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_department'
    )

    class Meta:
        indexes = [
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return self.name


class Complaint(models.Model):
    PRIORITY_CHOICES = [
        ('Critical', 'Critical'),
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]

    STATUS_CHOICES = [
        ('Submitted', 'Submitted'),
        ('AI Analysed', 'AI Analysed'),
        ('Assigned', 'Assigned'),
        ('In Progress', 'In Progress'),
        ('Resolution Pending Verification', 'Resolution Pending Verification'),
        ('Resolved', 'Resolved'),
        ('Reopened', 'Reopened'),
        ('Closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_id = models.CharField(max_length=50, unique=True, editable=False)
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='complaints')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Submitted')
    assigned_department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints'
    )
    is_anonymous = models.BooleanField(default=False)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    resolution_proof_url = models.URLField(max_length=500, null=True, blank=True)
    resolution_notes = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    sla_deadline_at = models.DateTimeField()
    is_sla_breached = models.BooleanField(default=False)
    ai_confidence_score = models.FloatField(default=0.0)
    ai_routing_reasoning = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['ticket_id']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            year = timezone.now().year
            count = Complaint.objects.filter(created_at__year=year).count() + 1
            candidate_id = f"CMP-{year}-{1000 + count}"
            while Complaint.objects.filter(ticket_id=candidate_id).exists():
                count += 1
                candidate_id = f"CMP-{year}-{1000 + count}"
            self.ticket_id = candidate_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_id} - {self.title}"


class ComplaintHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    remarks = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.complaint.ticket_id} transition from {self.old_status} to {self.new_status}"


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField()
    comments = models.TextField(null=True, blank=True)
    selected_tags = models.JSONField(default=list)
    reopen_requested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.complaint.ticket_id} ({self.rating}/5)"


class Announcement(models.Model):
    TYPE_CHOICES = [
        ('HOLIDAY_GENERAL', 'HOLIDAY_GENERAL'),
        ('EMERGENCY_ALERT', 'EMERGENCY_ALERT'),
    ]

    PRIORITY_CHOICES = [
        ('NORMAL', 'NORMAL'),
        ('URGENT', 'URGENT'),
    ]

    TARGET_AUDIENCE_CHOICES = [
        ('ALL_STUDENTS', 'ALL_STUDENTS'),
        ('ALL_DEPT_HEADS', 'ALL_DEPT_HEADS'),
        ('SPECIFIC_DEPT', 'SPECIFIC_DEPT'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    target_audience = models.CharField(max_length=50, choices=TARGET_AUDIENCE_CHOICES)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements'
    )
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
