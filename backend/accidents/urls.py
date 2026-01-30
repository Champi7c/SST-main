from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkAccidentViewSet, OccupationalDiseaseViewSet

router = DefaultRouter()
router.register(r'work-accidents', WorkAccidentViewSet, basename='work-accident')
router.register(r'occupational-diseases', OccupationalDiseaseViewSet, basename='occupational-disease')

urlpatterns = [
    path('', include(router.urls)),
]
