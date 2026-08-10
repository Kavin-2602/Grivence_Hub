from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from complaints.api.views import (
    RegisterView, CustomTokenObtainPairView, MeView,
    AIAnalyseComplaintView, ComplaintCreateListView,
    ComplaintTrackView, ComplaintFeedbackView, AdminDashboardView,
    ComplaintStatusUpdateView, CreateStaffView, AnnouncementCreateListView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),

    # Student Portal & AI
    path('ai/analyse-complaint/', AIAnalyseComplaintView.as_view(), name='ai_analyse_complaint'),
    path('complaints/', ComplaintCreateListView.as_view(), name='complaints_create_list'),
    path('complaints/track/<str:ticket_id>/', ComplaintTrackView.as_view(), name='complaints_track'),
    path('complaints/<uuid:id>/feedback/', ComplaintFeedbackView.as_view(), name='complaints_feedback'),

    # Admin / Staff Dashboards
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('complaints/<uuid:id>/status/', ComplaintStatusUpdateView.as_view(), name='complaints_status_update'),
    path('admin/staff/', CreateStaffView.as_view(), name='admin_staff_create'),
    
    # Announcements
    path('announcements/', AnnouncementCreateListView.as_view(), name='announcements_create_list'),
]
