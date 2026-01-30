from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitTypeViewSet, MedicalVisitViewSet, VisitConvocationViewSet

router = DefaultRouter()
router.register(r'types', VisitTypeViewSet)
router.register(r'visits', MedicalVisitViewSet)
router.register(r'convocations', VisitConvocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
