from django.contrib import admin
from .models import OnlineConsultation


@admin.register(OnlineConsultation)
class OnlineConsultationAdmin(admin.ModelAdmin):
    list_display = ['subject', 'agent', 'status', 'meeting_id', 'scheduled_at', 'requested_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['subject', 'meeting_id', 'agent__matricule', 'agent__last_name']
    readonly_fields = ['meeting_id', 'created_at', 'updated_at']
