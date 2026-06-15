from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TrainingTypeViewSet, TrainingViewSet, EducationalArticleViewSet,
    ArticleRecipientViewSet, TrainingRequirementViewSet, AgentCertificationViewSet,
)

router = DefaultRouter()
router.register(r'training-types', TrainingTypeViewSet)
router.register(r'trainings', TrainingViewSet)
router.register(r'articles', EducationalArticleViewSet)
router.register(r'article-recipients', ArticleRecipientViewSet)
router.register(r'requirements', TrainingRequirementViewSet, basename='training-requirement')
router.register(r'agent-certifications', AgentCertificationViewSet, basename='agent-certification')

urlpatterns = [
    path('', include(router.urls)),
]
