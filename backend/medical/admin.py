from django.contrib import admin
from .models import Agent, DMST, Pathology, AgentPathology, DMSTHistory


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = [
        'matricule', 'last_name', 'first_name', 'age', 'company', 'site', 
        'service', 'function', 'hire_date', 'is_active', 'is_archived'
    ]
    list_filter = [
        'company', 'site', 'service', 'is_active', 'is_archived', 
        'gender', 'professional_category', 'job_position'
    ]
    search_fields = [
        'matricule', 'last_name', 'first_name', 'email', 'phone',
        'emergency_contact_name', 'function', 'grade'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'archived_at', 'age',
        'created_by', 'updated_by', 'archived_by'
    ]
    
    fieldsets = (
        ('Informations administratives', {
            'fields': (
                'matricule', 'title', 'first_name', 'last_name', 
                'date_of_birth', 'age', 'gender', 'email', 'phone', 'address'
            )
        }),
        ('Contact d\'urgence', {
            'fields': (
                'emergency_contact_name', 'emergency_contact_phone', 
                'emergency_contact_relation'
            )
        }),
        ('Informations professionnelles', {
            'fields': (
                'company', 'site', 'service', 'job_position',
                'function', 'grade', 'professional_category',
                'supervisor', 'hire_date'
            )
        }),
        ('Statut', {
            'fields': ('is_active', 'is_archived', 'archived_at', 'archived_by')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def age(self, obj):
        return obj.age
    age.short_description = 'Âge'


@admin.register(DMST)
class DMSTAdmin(admin.ModelAdmin):
    list_display = ['agent', 'under_surveillance', 'created_at', 'updated_at']
    list_filter = ['under_surveillance', 'handicap', 'pregnancy', 'smoking', 'alcohol']
    search_fields = ['agent__matricule', 'agent__last_name', 'agent__first_name']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('agent',)
        }),
        ('Allergies et antécédents', {
            'fields': ('allergies', 'medical_history', 'chronic_diseases', 'hereditary_diseases')
        }),
        ('Habitudes', {
            'fields': ('smoking', 'alcohol', 'drugs', 'habits_notes')
        }),
        ('Pathologies', {
            'fields': ('physical_pathologies', 'mental_pathologies', 'social_pathologies')
        }),
        ('Traitements et médecins', {
            'fields': ('current_treatments', 'treating_doctors')
        }),
        ('Handicap et grossesse', {
            'fields': ('handicap', 'handicap_details', 'pregnancy', 'pregnancy_due_date')
        }),
        ('Surveillance médicale', {
            'fields': ('under_surveillance', 'surveillance_type', 'working_conditions')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        obj._current_user = request.user
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DMSTHistory)
class DMSTHistoryAdmin(admin.ModelAdmin):
    list_display = ['dmst', 'modification_type', 'field_name', 'modified_by', 'modification_date']
    list_filter = ['modification_type', 'modification_date']
    search_fields = ['dmst__agent__matricule', 'dmst__agent__last_name', 'modified_by__username']
    readonly_fields = ['modification_date']
    date_hierarchy = 'modification_date'


@admin.register(Pathology)
class PathologyAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['code', 'name']


@admin.register(AgentPathology)
class AgentPathologyAdmin(admin.ModelAdmin):
    list_display = ['agent', 'pathology', 'diagnosis_date', 'is_active']
    list_filter = ['is_active', 'diagnosis_date']
    search_fields = ['agent__matricule', 'pathology__code', 'pathology__name']
