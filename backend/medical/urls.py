from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AgentViewSet, DMSTViewSet, PathologyViewSet, AgentPathologyViewSet, DMSTHistoryViewSet
)

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'dmst', DMSTViewSet)
router.register(r'pathologies', PathologyViewSet)
router.register(r'agent-pathologies', AgentPathologyViewSet)
router.register(r'dmst-history', DMSTHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
