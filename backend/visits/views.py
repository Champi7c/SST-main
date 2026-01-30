from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import VisitType, MedicalVisit, VisitConvocation
from .serializers import VisitTypeSerializer, MedicalVisitSerializer, VisitConvocationSerializer
from accounts.permissions import CanViewMedicalData, IsMedicalStaff


class VisitTypeViewSet(viewsets.ModelViewSet):
    queryset = VisitType.objects.filter(is_active=True)
    serializer_class = VisitTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']


class MedicalVisitViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des visites médicales
    - Médecin/Infirmier : accès complet
    - RH : accès au statut uniquement (pas au contenu médical)
    """
    queryset = MedicalVisit.objects.select_related('agent', 'visit_type', 'doctor', 'nurse', 'created_by').all()
    serializer_class = MedicalVisitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'visit_type', 'status', 'decision', 'agent__company', 'agent__site']
    search_fields = ['agent__matricule', 'agent__last_name', 'agent__first_name']
    ordering_fields = ['scheduled_date', 'actual_date', 'created_at']
    ordering = ['-scheduled_date']
    
    def get_serializer_class(self):
        """Utilise un serializer différent pour RH (statut uniquement)"""
        if self.request.user.role == 'rh':
            # Pour RH, on pourrait créer un serializer limité, mais pour l'instant on utilise le même
            # et on filtre les champs dans get_serializer
            return MedicalVisitSerializer
        return MedicalVisitSerializer
    
    def get_serializer(self, *args, **kwargs):
        """Filtre les champs médicaux pour les RH"""
        serializer = super().get_serializer(*args, **kwargs)
        if self.request.user.role == 'rh':
            # Les RH ne voient que le statut, pas le contenu médical
            # On laisse le serializer complet mais on pourrait créer un serializer spécifique
            pass
        return serializer
    
    def get_queryset(self):
        """Filtre selon les permissions"""
        queryset = super().get_queryset()
        
        # Filtrage par entreprise si l'utilisateur n'est pas super_admin
        if hasattr(self.request, 'user') and self.request.user.role != 'super_admin':
            user_companies = self.request.user.company_memberships.values_list('company_id', flat=True)
            if user_companies:
                queryset = queryset.filter(agent__company_id__in=user_companies)
        
        return queryset
    
    def perform_create(self, serializer):
        """Création avec enregistrement de l'utilisateur"""
        visit = serializer.save(created_by=self.request.user)
        
        # Assigner le médecin/infirmier selon le rôle
        if self.request.user.role in ['medecin', 'super_admin']:
            visit.doctor = self.request.user
        elif self.request.user.role == 'infirmier':
            visit.nurse = self.request.user
        visit.save()
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marquer une visite comme complétée"""
        visit = self.get_object()
        
        if visit.status == 'completed':
            return Response(
                {'detail': 'Cette visite est déjà complétée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visit.status = 'completed'
        if not visit.actual_date:
            visit.actual_date = timezone.now()
        if not visit.doctor and request.user.role in ['medecin', 'super_admin']:
            visit.doctor = request.user
        if not visit.nurse and request.user.role == 'infirmier':
            visit.nurse = request.user
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_absent(self, request, pk=None):
        """Marquer un agent comme absent"""
        visit = self.get_object()
        absence_reason = request.data.get('reason', '')
        
        visit.status = 'absent'
        visit.notes = f"Absent. Raison: {absence_reason}"
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reprogrammer une visite"""
        visit = self.get_object()
        new_date = request.data.get('rescheduled_date')
        reason = request.data.get('rescheduling_reason', '')
        
        if not new_date:
            return Response(
                {'detail': 'La nouvelle date est requise.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visit.status = 'rescheduled'
        visit.rescheduled_date = new_date
        visit.rescheduling_reason = reason
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler une visite"""
        visit = self.get_object()
        reason = request.data.get('reason', '')
        
        visit.status = 'cancelled'
        if reason:
            visit.notes = f"Annulée. Raison: {reason}"
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Valider une visite (la rendre non modifiable)"""
        from django.utils import timezone
        
        visit = self.get_object()
        
        if visit.status != 'completed':
            return Response(
                {'detail': 'Seules les visites complétées peuvent être validées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if visit.is_validated:
            return Response(
                {'detail': 'Cette visite est déjà validée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visit.is_validated = True
        visit.validated_at = timezone.now()
        visit.validated_by = request.user
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Empêche la modification d'une visite validée"""
        instance = self.get_object()
        
        if instance.is_validated:
            return Response(
                {'detail': 'Cette visite est validée et ne peut plus être modifiée.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)


class VisitConvocationViewSet(viewsets.ModelViewSet):
    queryset = VisitConvocation.objects.all()
    serializer_class = VisitConvocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['visit', 'acknowledged']
