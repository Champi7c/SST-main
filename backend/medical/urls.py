from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AgentViewSet, DMSTViewSet, PathologyViewSet, AgentPathologyViewSet, DMSTHistoryViewSet,
    MedicalResultViewSet
)

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'dmst', DMSTViewSet)
router.register(r'pathologies', PathologyViewSet)
router.register(r'agent-pathologies', AgentPathologyViewSet)
router.register(r'dmst-history', DMSTHistoryViewSet)
router.register(r'results', MedicalResultViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
