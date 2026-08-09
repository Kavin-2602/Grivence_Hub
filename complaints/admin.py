from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from complaints.models import CustomUser, Department, Complaint, ComplaintHistory, Feedback, Announcement

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'full_name', 'role', 'department', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'reg_number', 'role', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'full_name', 'reg_number', 'role', 'department')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Department)
admin.site.register(Complaint)
admin.site.register(ComplaintHistory)
admin.site.register(Feedback)
admin.site.register(Announcement)

