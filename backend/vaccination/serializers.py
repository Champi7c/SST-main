from rest_framework import serializers
from .models import Vaccine, Vaccination, MedicalSurveillance, VaccineContraindication, VaccineRequirement, VaccinationAlert
from medical.serializers import AgentSerializer


class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = '__all__'


class VaccinationSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)
    administered_by_name = serializers.CharField(source='administered_by.get_full_name', read_only=True, allow_null=True)
    is_due = serializers.SerializerMethodField()
    
    class Meta:
        model = Vaccination
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_due(self, obj):
        from django.utils import timezone
        if obj.next_due_date:
            return timezone.now().date() >= obj.next_due_date
        return False


class MedicalSurveillanceSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    surveillance_type_display = serializers.CharField(source='get_surveillance_type_display', read_only=True)
    prescribed_by_name = serializers.CharField(source='prescribed_by.get_full_name', read_only=True, allow_null=True)
    is_due = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalSurveillance
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_due(self, obj):
        from django.utils import timezone
        if obj.next_review_date:
            return timezone.now().date() >= obj.next_review_date
        return False


class VaccineContraindicationSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, allow_null=True)

    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"

    class Meta:
        model = VaccineContraindication
        fields = '__all__'
        read_only_fields = ['recorded_at', 'recorded_by']


class VaccineRequirementSerializer(serializers.ModelSerializer):
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)
    job_position_name = serializers.CharField(source='job_position.name', read_only=True, allow_null=True)
    risk_category_name = serializers.CharField(source='risk_category.name', read_only=True, allow_null=True)

    class Meta:
        model = VaccineRequirement
        fields = '__all__'

    def validate(self, data):
        if not data.get('job_position') and not data.get('risk_category'):
            from rest_framework import serializers as s
            raise s.ValidationError("Renseigner au moins le poste de travail ou la catégorie de risque.")
        return data


class VaccinationAlertSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)

    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"

    class Meta:
        model = VaccinationAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'acknowledged_at', 'acknowledged_by']
