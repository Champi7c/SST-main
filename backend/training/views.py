from django.utils import timezone
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import TrainingType, Training, EducationalArticle, ArticleRecipient, TrainingRequirement
from .serializers import (
    TrainingTypeSerializer, TrainingSerializer, EducationalArticleSerializer,
    ArticleRecipientSerializer, TrainingRequirementSerializer,
)
from medical.models import Agent
from accounts.permissions import IsSuperAdminOrAdmin


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
            return [permissions.IsAuthenticated(), IsSuperAdminOrAdmin()]
        return [permissions.IsAuthenticated()]


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
