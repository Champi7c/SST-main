from rest_framework import viewsets, permissions, filters, status
from rest_framework import serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Agent, DMST, Pathology, AgentPathology, DMSTHistory
from .serializers import (
    AgentSerializer, DMSTSerializer, PathologySerializer, AgentPathologySerializer, DMSTHistorySerializer
)
from accounts.permissions import CanViewMedicalData, IsMedicalStaff, CanManageAgents
from audit.models import MedicalDataAccess


class AgentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des agents
    Accessible par: Admin, RH, HSE, Médecin, Infirmier
    """
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Permet la lecture à tous les utilisateurs authentifiés,
        mais restreint la création/modification/suppression aux rôles autorisés
        """
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanManageAgents()]
    
    def create(self, request, *args, **kwargs):
        """Création avec gestion d'erreurs améliorée"""
        import logging
        logger = logging.getLogger(__name__)
        
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except drf_serializers.ValidationError as e:
            logger.error(f"Erreur de validation lors de la création d'un agent: {e.detail}")
            logger.error(f"Données reçues: {request.data}")
            raise
        except Exception as e:
            logger.error(f"Erreur inattendue lors de la création d'un agent: {e}", exc_info=True)
            raise
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'site', 'service', 'is_active', 'is_archived', 'job_position', 'professional_category']
    search_fields = ['matricule', 'last_name', 'first_name', 'email', 'phone']
    ordering_fields = ['last_name', 'first_name', 'hire_date', 'created_at']
    ordering = ['last_name', 'first_name']
    
     def get_queryset(self):
         """Filtre les agents selon les permissions et les paramètres"""
         queryset = super().get_queryset().select_related(
             'company', 'site', 'service', 'job_position', 'supervisor',
             'created_by', 'updated_by', 'archived_by', 'dmst'
         )

        # Par défaut, exclure les agents archivés sauf si explicitement demandé
        show_archived = self.request.query_params.get('show_archived', 'false').lower() == 'true'
        if not show_archived:
            queryset = queryset.filter(is_archived=False)

        # Filtrage par entreprise : super_admin, médecin et infirmier voient tous les agents
        unrestricted_roles = ['super_admin', 'medecin', 'infirmier']
        if hasattr(self.request, 'user') and self.request.user.role not in unrestricted_roles:
            user_companies = list(
                self.request.user.company_memberships.values_list('company_id', flat=True)
            )
            queryset = queryset.filter(company_id__in=user_companies)

        return queryset
    
    def get_serializer_context(self):
        """Ajoute le request au contexte du serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def _user_can_access_company(self, company_id):
        """Vérifie si l'utilisateur (non super_admin) a accès à cette entreprise."""
        # Le personnel médical (médecin, infirmier) et super_admin ont accès à toutes les entreprises
        if self.request.user.role in ['super_admin', 'medecin', 'infirmier']:
            return True
        user_companies = list(
            self.request.user.company_memberships.values_list('company_id', flat=True)
        )
        if not user_companies:
            return False
        return company_id in user_companies
    
    def perform_create(self, serializer):
        """Vérifie l'accès à l'entreprise avant création."""
        company_id = serializer.validated_data.get('company').id
        if not self._user_can_access_company(company_id):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                'Vous ne pouvez créer des agents que pour les entreprises auxquelles vous êtes rattaché. '
                'Vérifiez votre rattachement aux entreprises dans les paramètres.'
            )
        serializer.save()
    
    def perform_destroy(self, instance):
        """Archivage au lieu de suppression définitive"""
        instance.archive(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Action pour archiver un agent"""
        agent = self.get_object()
        if agent.is_archived:
            return Response(
                {'detail': 'Cet agent est déjà archivé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        agent.archive(user=request.user)
        serializer = self.get_serializer(agent)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        """Action pour désarchiver un agent"""
        # get_queryset exclut les archivés par défaut → récupérer directement
        try:
            agent = Agent.objects.get(pk=pk)
        except Agent.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Agent introuvable.')
        if not agent.is_archived:
            return Response(
                {'detail': 'Cet agent n\'est pas archivé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        agent.unarchive()
        serializer = self.get_serializer(agent)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """Liste des agents archivés"""
        archived_agents = self.get_queryset().filter(is_archived=True)
        page = self.paginate_queryset(archived_agents)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(archived_agents, many=True)
        return Response(serializer.data)


class DMSTViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion du DMST
    Accès exclusif au personnel médical (Médecin, Infirmier, Super Admin)
    """
    queryset = DMST.objects.select_related('agent', 'created_by', 'updated_by').all()
    serializer_class = DMSTSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'agent__company', 'agent__site', 'under_surveillance', 'agent__is_active']
    search_fields = ['agent__matricule', 'agent__last_name', 'agent__first_name']
    ordering_fields = ['created_at', 'updated_at', 'agent__last_name']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Filtre selon les permissions"""
        queryset = super().get_queryset()
        
        # Filtrage par entreprise si l'utilisateur n'est pas super_admin
        if hasattr(self.request, 'user') and self.request.user.role != 'super_admin':
            user_companies = self.request.user.company_memberships.values_list('company_id', flat=True)
            if user_companies:
                queryset = queryset.filter(agent__company_id__in=user_companies)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Enregistre l'accès aux données médicales"""
        instance = self.get_object()
        
        # Enregistrer l'accès dans l'audit
        MedicalDataAccess.objects.create(
            user=request.user,
            agent=instance.agent,
            data_type='DMST',
            ip_address=self.get_client_ip(request),
            reason=f'Consultation du DMST de {instance.agent}'
        )
        
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Création avec enregistrement de l'utilisateur"""
        dmst = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        dmst._current_user = self.request.user
        
        # Enregistrer l'accès
        MedicalDataAccess.objects.create(
            user=self.request.user,
            agent=dmst.agent,
            data_type='DMST',
            ip_address=self.get_client_ip(self.request),
            reason=f'Création du DMST de {dmst.agent}'
        )
    
    def perform_update(self, serializer):
        """Mise à jour avec enregistrement de l'utilisateur"""
        dmst = serializer.save(updated_by=self.request.user)
        dmst._current_user = self.request.user
        
        # Enregistrer l'accès
        MedicalDataAccess.objects.create(
            user=self.request.user,
            agent=dmst.agent,
            data_type='DMST',
            ip_address=self.get_client_ip(self.request),
            reason=f'Modification du DMST de {dmst.agent}'
        )
    
    def get_client_ip(self, request):
        """Récupère l'adresse IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Historique complet des modifications du DMST"""
        dmst = self.get_object()
        history = dmst.history.select_related('modified_by', 'related_visit').all()
        
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = DMSTHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DMSTHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def visits(self, request, pk=None):
        """Historique des visites médicales liées au DMST"""
        from visits.serializers import MedicalVisitSerializer
        
        dmst = self.get_object()
        visits = dmst.agent.visits.select_related('visit_type', 'doctor', 'nurse').order_by('-scheduled_date')
        
        page = self.paginate_queryset(visits)
        if page is not None:
            serializer = MedicalVisitSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MedicalVisitSerializer(visits, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def evolution(self, request, pk=None):
        """Évolution de l'état de santé (résumé des diagnostics successifs)"""
        dmst = self.get_object()
        
        # Récupérer toutes les visites avec diagnostic
        visits = dmst.agent.visits.filter(
            status='completed',
            diagnosis__isnull=False
        ).order_by('scheduled_date')
        
        evolution_data = []
        for visit in visits:
            evolution_data.append({
                'date': visit.scheduled_date,
                'diagnosis': visit.diagnosis,
                'avis': visit.get_avis_display() if visit.avis else None,
                'doctor': visit.doctor.get_full_name() if visit.doctor else None,
                'visit_type': visit.visit_type.name if visit.visit_type else None,
            })
        
        return Response({
            'agent': f"{dmst.agent.last_name} {dmst.agent.first_name}",
            'matricule': dmst.agent.matricule,
            'evolution': evolution_data,
            'total_visits': visits.count()
        })


class PathologyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pathology.objects.filter(is_active=True)
    serializer_class = PathologySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['code', 'name']


class AgentPathologyViewSet(viewsets.ModelViewSet):
    queryset = AgentPathology.objects.all()
    serializer_class = AgentPathologySerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['agent', 'pathology', 'is_active']


class DMSTHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour l'historique des modifications du DMST
    """
    queryset = DMSTHistory.objects.select_related('dmst', 'modified_by', 'related_visit').all()
    serializer_class = DMSTHistorySerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['dmst', 'modified_by', 'modification_type']
    ordering_fields = ['modification_date']
    ordering = ['-modification_date']
