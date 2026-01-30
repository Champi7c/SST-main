from rest_framework import serializers
from .models import RiskCategory, Risk, PreventiveAction, IndividualExposureSheet, IndividualRiskSheet
from companies.serializers import CompanySerializer, SiteSerializer, ServiceSerializer, JobPositionSerializer
from medical.serializers import AgentSerializer


class RiskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskCategory
        fields = '__all__'


class RiskSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True, allow_null=True)
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)
    job_position_name = serializers.CharField(source='job_position.name', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    identified_by_name = serializers.CharField(source='identified_by.get_full_name', read_only=True, allow_null=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    probability_display = serializers.CharField(source='get_probability_display', read_only=True)
    
    class Meta:
        model = Risk
        fields = '__all__'


class PreventiveActionSerializer(serializers.ModelSerializer):
    risk_name = serializers.CharField(source='risk.name', read_only=True)
    responsible_name = serializers.CharField(source='responsible.get_full_name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PreventiveAction
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class IndividualExposureSheetSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    exposed_risks_details = RiskSerializer(source='exposed_risks', many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = IndividualExposureSheet
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class IndividualRiskSheetSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = IndividualRiskSheet
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']
