from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RiskCategoryViewSet, RiskViewSet, PreventiveActionViewSet,
    IndividualExposureSheetViewSet, IndividualRiskSheetViewSet,
    PreventionIndicatorsView,
)

router = DefaultRouter()
router.register(r'risk-categories', RiskCategoryViewSet)
router.register(r'risks', RiskViewSet)
router.register(r'actions', PreventiveActionViewSet)
router.register(r'exposure-sheets', IndividualExposureSheetViewSet)
router.register(r'risk-sheets', IndividualRiskSheetViewSet)

urlpatterns = [
    path('indicators/', PreventionIndicatorsView.as_view(), name='prevention-indicators'),
    path('', include(router.urls)),
]
