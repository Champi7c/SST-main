from django.utils import timezone
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import TrainingType, Training, EducationalArticle, ArticleRecipient, TrainingRequirement, AgentCertification
from .serializers import (
    TrainingTypeSerializer, TrainingSerializer, EducationalArticleSerializer,
    ArticleRecipientSerializer, TrainingRequirementSerializer, AgentCertificationSerializer,
)
from medical.models import Agent
from accounts.permissions import CanManageAgents, IsSuperAdminOrAdmin


class TrainingTypeViewSet(viewsets.ModelViewSet):
    queryset = TrainingType.objects.filter(is_active=True)
    serializer_class = TrainingTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']


class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all()
    serializer_class = TrainingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'training_type', 'status', 'agent__company']
    search_fields = ['agent__matricule', 'agent__last_name', 'training_type__name']
    ordering_fields = ['start_date', 'end_date', 'next_due_date']
    ordering = ['-start_date']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EducationalArticleViewSet(viewsets.ModelViewSet):
    queryset = EducationalArticle.objects.all()
    serializer_class = EducationalArticleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['theme', 'target_audience', 'is_published', 'author']
    search_fields = ['title', 'content', 'theme']
    ordering_fields = ['created_at', 'published_date']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publie l'article et crée les destinataires selon target_audience (all, surveillance)."""
        article = self.get_object()
        article.is_published = True
        article.published_date = timezone.now()
        article.author = request.user
        article.save()
        _create_recipients_for_article(article)
        return Response(self.get_serializer(article).data)


class ArticleRecipientViewSet(viewsets.ModelViewSet):
    queryset = ArticleRecipient.objects.all()
    serializer_class = ArticleRecipientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['article', 'agent', 'read']


class TrainingRequirementViewSet(viewsets.ModelViewSet):
    queryset = TrainingRequirement.objects.all()
    serializer_class = TrainingRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['training_type', 'job_position', 'mandatory']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), CanManageAgents()]
        return [permissions.IsAuthenticated()]


class AgentCertificationViewSet(viewsets.ModelViewSet):
    queryset = AgentCertification.objects.all()
    serializer_class = AgentCertificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'training_requirement', 'training_requirement__training_type', 'training_requirement__job_position__company']
    search_fields = ['agent__matricule', 'agent__last_name', 'agent__first_name', 'training_requirement__training_type__name', 'certificate_number']
    ordering_fields = ['start_date', 'end_date', 'next_due_date', 'agent__last_name']
    ordering = ['-start_date']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), CanManageAgents()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def create_from_training_type(self, request):
        """Création avec nom de formation libre (création auto du TrainingRequirement si besoin)"""
        training_type_name = request.data.get('training_type_name')
        job_position_id = request.data.get('job_position')
        agent_id = request.data.get('agent')
        
        if not training_type_name or not agent_id:
            return Response({'detail': 'training_type_name et agent sont requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Trouver ou créer le TrainingType
        training_type, _ = TrainingType.objects.get_or_create(name=training_type_name)
        
        # Trouver ou créer le TrainingRequirement
        if job_position_id:
            job_position = JobPosition.objects.get(id=job_position_id)
            training_requirement, _ = TrainingRequirement.objects.get_or_create(
                training_type=training_type,
                job_position=job_position
            )
        else:
            # Prendre le premier poste disponible ou créer un requirement sans job_position
            training_requirement, _ = TrainingRequirement.objects.get_or_create(
                training_type=training_type,
                defaults={'job_position_id': JobPosition.objects.first().id if JobPosition.objects.exists() else None}
            )
        
        # Créer la certification
        data = request.data.copy()
        data['training_requirement'] = training_requirement.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


def _create_recipients_for_article(article):
    """Crée les ArticleRecipient selon target_audience (all, surveillance)."""
    from vaccination.models import MedicalSurveillance
    ArticleRecipient.objects.filter(article=article).delete()
    agents = Agent.objects.filter(is_active=True)
    if article.target_audience == 'surveillance':
        agent_ids = set(
            MedicalSurveillance.objects.filter(is_active=True).values_list('agent_id', flat=True).distinct()
        )
        agents = agents.filter(id__in=agent_ids)
    for agent in agents:
        ArticleRecipient.objects.get_or_create(article=article, agent=agent, defaults={'read': False})
