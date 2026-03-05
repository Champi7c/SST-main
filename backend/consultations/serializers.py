from rest_framework import serializers
from .models import OnlineConsultation


class OnlineConsultationSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.SerializerMethodField()
    meeting_link = serializers.ReadOnlyField()
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OnlineConsultation
        fields = [
            'id',
            'agent',
            'agent_name',
            'agent_matricule',
            'requested_by',
            'requested_by_name',
            'subject',
            'message',
            'preferred_date',
            'preferred_time',
            'meeting_id',
            'meeting_link',
            'status',
            'status_display',
            'scheduled_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['meeting_id', 'meeting_link', 'created_at', 'updated_at']

    def get_agent_name(self, obj):
        if obj.agent_id:
            return f"{obj.agent.last_name} {obj.agent.first_name}"
        return None

    def get_agent_matricule(self, obj):
        return obj.agent.matricule if obj.agent_id else None
