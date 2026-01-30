from django.contrib import admin
from .models import AuditLog, MedicalDataAccess


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action_type', 'model_name', 'object_repr', 'ip_address', 'timestamp']
    list_filter = ['action_type', 'model_name', 'timestamp']
    search_fields = ['user__username', 'object_repr', 'ip_address']
    readonly_fields = ['user', 'action_type', 'content_type', 'object_id', 'model_name', 'object_repr', 'changes', 'ip_address', 'user_agent', 'timestamp']
    date_hierarchy = 'timestamp'


@admin.register(MedicalDataAccess)
class MedicalDataAccessAdmin(admin.ModelAdmin):
    list_display = ['user', 'agent', 'data_type', 'ip_address', 'timestamp']
    list_filter = ['data_type', 'timestamp']
    search_fields = ['user__username', 'agent__matricule', 'agent__last_name']
    readonly_fields = ['user', 'agent', 'data_type', 'ip_address', 'reason', 'timestamp']
    date_hierarchy = 'timestamp'
