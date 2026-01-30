from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, SiteViewSet, ServiceViewSet,
    JobPositionViewSet, CompanyMembershipViewSet
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'sites', SiteViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'job-positions', JobPositionViewSet)
router.register(r'memberships', CompanyMembershipViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
