from rest_framework import serializers
from .models import TrainingType, Training, EducationalArticle, ArticleRecipient, TrainingRequirement, AgentCertification
from medical.serializers import AgentSerializer


class TrainingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingType
        fields = '__all__'


class TrainingSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.SerializerMethodField()
    
    def get_agent_name(self, obj):
        if obj.agent_id:
            return f"{obj.agent.last_name} {obj.agent.first_name}"
        return None
    
    def get_agent_matricule(self, obj):
        return obj.agent.matricule if obj.agent_id else None
    training_type_name = serializers.CharField(source='training_type.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_due = serializers.SerializerMethodField()
    
    class Meta:
        model = Training
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_is_due(self, obj):
        from django.utils import timezone
        if obj.next_due_date:
            return timezone.now().date() >= obj.next_due_date
        return False


class EducationalArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True, allow_null=True)
    target_audience_display = serializers.CharField(source='get_target_audience_display', read_only=True)
    
    class Meta:
        model = EducationalArticle
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ArticleRecipientSerializer(serializers.ModelSerializer):
    article_title = serializers.CharField(source='article.title', read_only=True)
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    class Meta:
        model = ArticleRecipient
        fields = '__all__'


class TrainingRequirementSerializer(serializers.ModelSerializer):
    training_type_name = serializers.CharField(source='training_type.name', read_only=True)
    job_position_name = serializers.CharField(source='job_position.name', read_only=True)
    job_position_company = serializers.IntegerField(source='job_position.company_id', read_only=True)
    
    class Meta:
        model = TrainingRequirement
        fields = '__all__'


class AgentCertificationSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.SerializerMethodField()
    training_type_name = serializers.CharField(source='training_requirement.training_type.name', read_only=True)
    training_type_code = serializers.CharField(source='training_requirement.training_type.code', read_only=True)
    job_position_name = serializers.CharField(source='training_requirement.job_position.name', read_only=True)
    job_position_code = serializers.CharField(source='training_requirement.job_position.code', read_only=True)
    company_name = serializers.CharField(source='training_requirement.job_position.company.name', read_only=True)
    is_due = serializers.SerializerMethodField()
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}" if obj.agent else None
    
    def get_agent_matricule(self, obj):
        return obj.agent.matricule if obj.agent else None
    
    def get_is_due(self, obj):
        if obj.next_due_date:
            from django.utils import timezone
            return timezone.now().date() >= obj.next_due_date
        return False
    
    class Meta:
        model = AgentCertification
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']
