from django.contrib import admin
from .models import WorkAccident, OccupationalDisease


@admin.register(WorkAccident)
class WorkAccidentAdmin(admin.ModelAdmin):
    list_display = ['agent', 'accident_date', 'location', 'severity', 'status', 'work_stoppage', 'declared_by', 'created_at']
    list_filter = ['severity', 'status', 'work_stoppage', 'accident_date']
    search_fields = ['agent__matricule', 'agent__last_name', 'agent__first_name', 'location']
    readonly_fields = ['created_at', 'updated_at', 'declaration_date', 'declared_by']
    date_hierarchy = 'accident_date'


@admin.register(OccupationalDisease)
class OccupationalDiseaseAdmin(admin.ModelAdmin):
    list_display = ['agent', 'disease_type', 'disease_name', 'table_number', 'first_symptoms_date', 'status', 'recognition_date', 'declared_by', 'created_at']
    list_filter = ['disease_type', 'status', 'first_symptoms_date']
    search_fields = ['agent__matricule', 'agent__last_name', 'disease_name']
    readonly_fields = ['created_at', 'updated_at', 'declaration_date', 'declared_by']
    date_hierarchy = 'first_symptoms_date'
