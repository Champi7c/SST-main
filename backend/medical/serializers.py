from rest_framework import serializers
from .models import Agent, DMST, Pathology, AgentPathology, DMSTHistory
from companies.serializers import CompanySerializer, SiteSerializer, ServiceSerializer, JobPositionSerializer


class AgentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True, allow_null=True)
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)
    job_position_name = serializers.CharField(source='job_position.name', read_only=True, allow_null=True)
    supervisor_name = serializers.SerializerMethodField()
    supervisor_matricule = serializers.CharField(source='supervisor.matricule', read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True, allow_null=True)
    archived_by_name = serializers.CharField(source='archived_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Agent
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'archived_at', 'created_by', 'updated_by', 'archived_by']
    
    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}"
    
    def get_supervisor_name(self, obj):
        if obj.supervisor:
            return f"{obj.supervisor.last_name} {obj.supervisor.first_name}"
        return None
    
    def create(self, validated_data):
        """Création d'un agent avec enregistrement de l'utilisateur créateur"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mise à jour d'un agent avec enregistrement de l'utilisateur modificateur"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


class DMSTHistorySerializer(serializers.ModelSerializer):
    """Serializer pour l'historique des modifications du DMST"""
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True, allow_null=True)
    related_visit_id = serializers.IntegerField(source='related_visit.id', read_only=True, allow_null=True)
    
    class Meta:
        model = DMSTHistory
        fields = '__all__'
        read_only_fields = ['modification_date']


class DMSTSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True, allow_null=True)
    visits_count = serializers.SerializerMethodField()
    last_visit_date = serializers.SerializerMethodField()
    history_count = serializers.SerializerMethodField()
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    def get_visits_count(self, obj):
        """Nombre total de visites médicales"""
        return obj.agent.visits.count()
    
    def get_last_visit_date(self, obj):
        """Date de la dernière visite médicale"""
        last_visit = obj.agent.visits.order_by('-scheduled_date').first()
        return last_visit.scheduled_date if last_visit else None
    
    def get_history_count(self, obj):
        """Nombre d'entrées dans l'historique"""
        return obj.history.count()
    
    class Meta:
        model = DMST
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class PathologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pathology
        fields = '__all__'


class AgentPathologySerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    pathology_name = serializers.CharField(source='pathology.name', read_only=True)
    pathology_code = serializers.CharField(source='pathology.code', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    class Meta:
        model = AgentPathology
        fields = '__all__'
