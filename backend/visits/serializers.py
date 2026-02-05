from rest_framework import serializers
from .models import VisitType, MedicalVisit, VisitConvocation
from medical.serializers import AgentSerializer


class VisitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitType
        fields = '__all__'


class MedicalVisitSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    visit_type_name = serializers.CharField(source='visit_type.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True, allow_null=True)
    nurse_name = serializers.CharField(source='nurse.get_full_name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    validated_by_name = serializers.CharField(source='validated_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    avis_display = serializers.CharField(source='get_avis_display', read_only=True, allow_null=True)
    can_be_modified = serializers.SerializerMethodField()
    
    def get_can_be_modified(self, obj):
        return obj.can_be_modified()
    
    class Meta:
        model = MedicalVisit
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'validated_at', 'validated_by']
    
    def to_representation(self, instance):
        """Filtre les champs médicaux pour les RH"""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        if request and request.user and request.user.role == 'rh':
            # Les RH ne voient que le statut et les informations non médicales
            medical_fields = [
                'temperature', 'blood_pressure_systolic', 'blood_pressure_diastolic',
                'heart_rate', 'blood_sugar', 'weight', 'height',
                'diagnosis', 'prescriptions', 'recommendations',
                'avis', 'avis_details', 'notes'
            ]
            for field in medical_fields:
                representation[field] = None
        
        return representation


class MedicalVisitStatusSerializer(serializers.ModelSerializer):
    """Serializer limité pour les RH (statut uniquement)"""
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    visit_type_name = serializers.CharField(source='visit_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    avis_display = serializers.CharField(source='get_avis_display', read_only=True, allow_null=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    class Meta:
        model = MedicalVisit
        fields = [
            'id', 'agent', 'agent_name', 'agent_matricule',
            'visit_type', 'visit_type_name',
            'scheduled_date', 'actual_date', 'status', 'status_display',
            'avis', 'avis_display',
            'alert_rh', 'alert_direction', 'alert_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class VisitConvocationSerializer(serializers.ModelSerializer):
    visit_details = MedicalVisitSerializer(source='visit', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = VisitConvocation
        fields = '__all__'
        read_only_fields = ['sent_date', 'sent_by']
