from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import viewsets, permissions
from .models import AuditLog, MedicalDataAccess
from rest_framework import serializers


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'


class MedicalDataAccessSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    agent_name = serializers.SerializerMethodField()
    
    def get_agent_name(self, obj):
        if obj.agent:
            return f"{obj.agent.last_name} {obj.agent.first_name}"
        return None
    
    class Meta:
        model = MedicalDataAccess
        fields = '__all__'


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Les utilisateurs ne peuvent voir que leurs propres logs sauf si admin
        user = self.request.user
        if user.role in ['super_admin', 'admin']:
            return AuditLog.objects.all()
        return AuditLog.objects.filter(user=user)


class MedicalDataAccessViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MedicalDataAccess.objects.all()
    serializer_class = MedicalDataAccessSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Seuls les admins peuvent voir tous les accès
        user = self.request.user
        if user.role in ['super_admin', 'admin']:
            return MedicalDataAccess.objects.all()
        return MedicalDataAccess.objects.filter(user=user)


router = DefaultRouter()
router.register(r'logs', AuditLogViewSet)
router.register(r'medical-accesses', MedicalDataAccessViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
