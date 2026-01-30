from django.contrib import admin
from .models import VisitType, MedicalVisit, VisitConvocation


@admin.register(VisitType)
class VisitTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    list_filter = ['is_active']


@admin.register(MedicalVisit)
class MedicalVisitAdmin(admin.ModelAdmin):
    list_display = ['agent', 'visit_type', 'scheduled_date', 'status', 'decision', 'doctor', 'created_at']
    list_filter = ['status', 'decision', 'visit_type', 'scheduled_date', 'alert_rh', 'alert_direction']
    search_fields = ['agent__matricule', 'agent__last_name', 'agent__first_name']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    date_hierarchy = 'scheduled_date'


@admin.register(VisitConvocation)
class VisitConvocationAdmin(admin.ModelAdmin):
    list_display = ['visit', 'sent_date', 'sent_via', 'acknowledged', 'acknowledged_date']
    list_filter = ['sent_via', 'acknowledged', 'sent_date']
    readonly_fields = ['sent_date', 'sent_by']
