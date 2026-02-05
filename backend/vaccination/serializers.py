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
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)
    administered_by_name = serializers.CharField(source='administered_by.get_full_name', read_only=True, allow_null=True)
    is_due = serializers.SerializerMethodField()
    # Champ pour accepter le nom du vaccin au lieu de l'ID
    vaccine_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    class Meta:
        model = Vaccination
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'vaccine': {'required': False, 'allow_null': True}  # Rendre optionnel car on peut utiliser vaccine_name_input
        }
    
    def get_is_due(self, obj):
        from django.utils import timezone
        if obj.next_due_date:
            return timezone.now().date() >= obj.next_due_date
        return False
    
    def to_internal_value(self, data):
        # Récupérer vaccine_name_input avant la validation standard
        vaccine_name_input = data.get('vaccine_name_input', '').strip() if isinstance(data.get('vaccine_name_input'), str) else ''
        
        # Si vaccine_name_input est fourni, créer ou récupérer le vaccin et l'ajouter à data
        if vaccine_name_input:
            try:
                vaccine, created = Vaccine.objects.get_or_create(
                    name=vaccine_name_input,
                    defaults={'is_active': True}
                )
                # Remplacer vaccine_name_input par vaccine (ID) dans les données
                data = data.copy()
                data['vaccine'] = vaccine.id
                data.pop('vaccine_name_input', None)
            except Exception as e:
                raise serializers.ValidationError({
                    'vaccine_name_input': f'Erreur lors de la création du vaccin: {str(e)}'
                })
        elif not data.get('vaccine'):
            # Si ni vaccine ni vaccine_name_input n'est fourni
            raise serializers.ValidationError({
                'vaccine_name_input': 'Le nom du vaccin est requis'
            })
        
        # Appeler la méthode parent pour la validation standard
        return super().to_internal_value(data)


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
    # Champ pour accepter le nom du vaccin au lieu de l'ID
    vaccine_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"

    class Meta:
        model = VaccineContraindication
        fields = '__all__'
        read_only_fields = ['recorded_at', 'recorded_by']
        extra_kwargs = {
            'vaccine': {'required': False, 'allow_null': True}
        }
    
    def to_internal_value(self, data):
        # Récupérer vaccine_name_input avant la validation standard
        vaccine_name_input = data.get('vaccine_name_input', '').strip() if isinstance(data.get('vaccine_name_input'), str) else ''
        
        # Si vaccine_name_input est fourni, créer ou récupérer le vaccin et l'ajouter à data
        if vaccine_name_input:
            try:
                vaccine, created = Vaccine.objects.get_or_create(
                    name=vaccine_name_input,
                    defaults={'is_active': True}
                )
                # Remplacer vaccine_name_input par vaccine (ID) dans les données
                data = data.copy()
                data['vaccine'] = vaccine.id
                data.pop('vaccine_name_input', None)
            except Exception as e:
                raise serializers.ValidationError({
                    'vaccine_name_input': f'Erreur lors de la création du vaccin: {str(e)}'
                })
        elif not data.get('vaccine'):
            # Si ni vaccine ni vaccine_name_input n'est fourni
            raise serializers.ValidationError({
                'vaccine_name_input': 'Le nom du vaccin est requis'
            })
        
        # Appeler la méthode parent pour la validation standard
        return super().to_internal_value(data)


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
