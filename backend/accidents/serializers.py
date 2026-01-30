from rest_framework import serializers
from .models import WorkAccident, OccupationalDisease
from medical.serializers import AgentSerializer


class WorkAccidentSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    agent_company = serializers.CharField(source='agent.company.name', read_only=True)
    agent_site = serializers.CharField(source='agent.site.name', read_only=True, allow_null=True)
    agent_service = serializers.CharField(source='agent.service.name', read_only=True, allow_null=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    declared_by_name = serializers.CharField(source='declared_by.get_full_name', read_only=True, allow_null=True)
    closed_by_name = serializers.CharField(source='closed_by.get_full_name', read_only=True, allow_null=True)
    accident_type_display = serializers.CharField(source='get_accident_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = WorkAccident
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'declaration_date', 'declared_by', 'alert_sent_at']


class OccupationalDiseaseSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    agent_company = serializers.CharField(source='agent.company.name', read_only=True)
    agent_site = serializers.CharField(source='agent.site.name', read_only=True, allow_null=True)
    agent_service = serializers.CharField(source='agent.service.name', read_only=True, allow_null=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    declared_by_name = serializers.CharField(source='declared_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = OccupationalDisease
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'declaration_date', 'declared_by']
