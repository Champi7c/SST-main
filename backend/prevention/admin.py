from django.contrib import admin
from .models import (
    RiskCategory,
    Risk,
    PreventiveAction,
    IndividualExposureSheet,
    IndividualRiskSheet,
    RiskWorkAccidentLink,
    RiskOccupationalDiseaseLink,
)


@admin.register(RiskCategory)
class RiskCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category_type', 'is_active']
    list_filter = ['is_active', 'category_type']
    search_fields = ['name', 'code']


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'category', 'severity', 'probability', 'identification_date', 'is_active']
    list_filter = ['company', 'category', 'severity', 'probability', 'is_active']
    search_fields = ['name', 'description', 'company__name']
    date_hierarchy = 'identification_date'


@admin.register(PreventiveAction)
class PreventiveActionAdmin(admin.ModelAdmin):
    list_display = ['title', 'risk', 'action_type', 'status', 'planned_date', 'responsible', 'created_at']
    list_filter = ['action_type', 'status', 'planned_date']
    search_fields = ['title', 'description', 'risk__name']
    date_hierarchy = 'planned_date'


@admin.register(IndividualExposureSheet)
class IndividualExposureSheetAdmin(admin.ModelAdmin):
    list_display = ['agent', 'exposure_period', 'created_at']
    search_fields = ['agent__matricule', 'agent__last_name']
    filter_horizontal = ['exposed_risks']


@admin.register(IndividualRiskSheet)
class IndividualRiskSheetAdmin(admin.ModelAdmin):
    list_display = ['agent', 'created_at']
    search_fields = ['agent__matricule', 'agent__last_name']


@admin.register(RiskWorkAccidentLink)
class RiskWorkAccidentLinkAdmin(admin.ModelAdmin):
    list_display = ['risk', 'work_accident', 'created_at']
    list_filter = ['risk__category']
    search_fields = ['risk__name', 'work_accident__description', 'comment']
    raw_id_fields = ['risk', 'work_accident']


@admin.register(RiskOccupationalDiseaseLink)
class RiskOccupationalDiseaseLinkAdmin(admin.ModelAdmin):
    list_display = ['risk', 'occupational_disease', 'created_at']
    list_filter = ['risk__category']
    search_fields = ['risk__name', 'occupational_disease__disease_name', 'comment']
    raw_id_fields = ['risk', 'occupational_disease']
