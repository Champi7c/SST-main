from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VaccineViewSet, VaccinationViewSet, MedicalSurveillanceViewSet,
    VaccineContraindicationViewSet, VaccineRequirementViewSet, VaccinationAlertViewSet,
)

router = DefaultRouter()
router.register(r'vaccines', VaccineViewSet)
router.register(r'vaccinations', VaccinationViewSet)
router.register(r'surveillances', MedicalSurveillanceViewSet)
router.register(r'contraindications', VaccineContraindicationViewSet, basename='contraindication')
router.register(r'requirements', VaccineRequirementViewSet, basename='vaccine-requirement')
router.register(r'alerts', VaccinationAlertViewSet, basename='vaccination-alert')

urlpatterns = [
    path('', include(router.urls)),
]
