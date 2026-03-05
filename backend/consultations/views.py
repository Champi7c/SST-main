from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import OnlineConsultation
from .serializers import OnlineConsultationSerializer


class OnlineConsultationViewSet(viewsets.ModelViewSet):
    queryset = OnlineConsultation.objects.all()
    serializer_class = OnlineConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'status', 'requested_by']
    search_fields = ['subject', 'message', 'meeting_id']
    ordering_fields = ['created_at', 'scheduled_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Staff / médecins / RH etc. voient toutes les consultations
        if getattr(user, 'role', None) in ('super_admin', 'medecin', 'infirmier', 'admin', 'rh', 'hse', 'direction', 'consultant'):
            return qs
        # Les autres ne voient que les consultations qu'ils ont demandées
        return qs.filter(requested_by=user)

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)
