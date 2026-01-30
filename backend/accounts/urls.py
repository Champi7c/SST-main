"""
URLs pour l'authentification et les utilisateurs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views import UserViewSet, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

@api_view(['GET'])
def health_check(request):
    """Endpoint de vérification de santé"""
    return Response({"status": "ok", "message": "API auth fonctionnelle"})

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='auth_health'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
