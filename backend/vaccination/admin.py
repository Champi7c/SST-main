from django.contrib import admin
from .models import (
    Vaccine,
    Vaccination,
    MedicalSurveillance,
    VaccineContraindication,
    VaccineRequirement,
    VaccinationAlert,
)


@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'validity_period_months', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = ['agent', 'vaccine', 'vaccination_date', 'next_due_date', 'visit', 'administered_by', 'created_at']
    list_filter = ['vaccine', 'vaccination_date']
    search_fields = ['agent__matricule', 'agent__last_name', 'vaccine__name']
    date_hierarchy = 'vaccination_date'
    raw_id_fields = ['agent', 'vaccine', 'visit', 'administered_by']


@admin.register(MedicalSurveillance)
class MedicalSurveillanceAdmin(admin.ModelAdmin):
    list_display = ['agent', 'surveillance_type', 'start_date', 'next_review_date', 'is_active', 'prescribed_by']
    list_filter = ['surveillance_type', 'is_active', 'start_date']
    search_fields = ['agent__matricule', 'agent__last_name']
    date_hierarchy = 'start_date'


@admin.register(VaccineContraindication)
class VaccineContraindicationAdmin(admin.ModelAdmin):
    list_display = ['agent', 'vaccine', 'recorded_at', 'recorded_by']
    list_filter = ['vaccine']
    search_fields = ['agent__matricule', 'agent__last_name', 'vaccine__name']
    raw_id_fields = ['agent', 'vaccine', 'recorded_by']


@admin.register(VaccineRequirement)
class VaccineRequirementAdmin(admin.ModelAdmin):
    list_display = ['vaccine', 'job_position', 'risk_category', 'mandatory']
    list_filter = ['mandatory', 'vaccine']
    search_fields = ['vaccine__name', 'job_position__name', 'risk_category__name']
    raw_id_fields = ['vaccine', 'job_position', 'risk_category']


@admin.register(VaccinationAlert)
class VaccinationAlertAdmin(admin.ModelAdmin):
    list_display = ['agent', 'vaccine', 'alert_type', 'due_date', 'acknowledged', 'created_at']
    list_filter = ['alert_type', 'acknowledged', 'vaccine']
    search_fields = ['agent__matricule', 'agent__last_name', 'vaccine__name']
    date_hierarchy = 'due_date'
    raw_id_fields = ['agent', 'vaccine', 'acknowledged_by']
