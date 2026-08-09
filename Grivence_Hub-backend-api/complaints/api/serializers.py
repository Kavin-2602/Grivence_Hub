from rest_framework import serializers
from django.contrib.auth import get_user_model
from complaints.models import CustomUser, Department, Complaint, ComplaintHistory, Feedback, Announcement

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'head_user']


class UserSerializer(serializers.ModelSerializer):
    department_info = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'reg_number', 'role', 'department', 'department_info']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'reg_number', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            reg_number=validated_data.get('reg_number'),
            role='STUDENT'
        )
        return user


class ComplaintHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)

    class Meta:
        model = ComplaintHistory
        fields = ['id', 'old_status', 'new_status', 'remarks', 'timestamp', 'changed_by_name']


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'rating', 'comments', 'selected_tags', 'reopen_requested', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ComplaintSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    assigned_department_name = serializers.CharField(source='assigned_department.name', read_only=True)
    history = ComplaintHistorySerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'ticket_id', 'student', 'student_name', 'title', 'description',
            'category', 'priority', 'status', 'assigned_department', 'assigned_department_name',
            'is_anonymous', 'image_url', 'resolution_proof_url', 'resolution_notes',
            'sla_deadline_at', 'is_sla_breached', 'ai_confidence_score', 'ai_routing_reasoning',
            'created_at', 'updated_at', 'history', 'feedback'
        ]
        read_only_fields = [
            'id', 'ticket_id', 'student', 'category', 'priority', 'status',
            'assigned_department', 'sla_deadline_at', 'is_sla_breached',
            'ai_confidence_score', 'ai_routing_reasoning', 'created_at', 'updated_at'
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'message', 'type', 'priority',
            'target_audience', 'department', 'department_name', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']
