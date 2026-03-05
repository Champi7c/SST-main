from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OnlineConsultationViewSet

router = DefaultRouter()
router.register(r'', OnlineConsultationViewSet, basename='onlineconsultation')

urlpatterns = [
    path('', include(router.urls)),
]
