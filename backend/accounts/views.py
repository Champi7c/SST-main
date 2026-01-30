"""
Vues pour l'authentification et la gestion des utilisateurs
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer
)
from .permissions import IsSuperAdminOrAdmin, CanManageUsers


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des utilisateurs
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Les super admins voient tous les utilisateurs
        if user.role == 'super_admin':
            return User.objects.all()
        # Les admins voient les utilisateurs de leurs entreprises
        elif user.role == 'admin':
            # TODO: Filtrer par entreprises associées
            return User.objects.all()
        return User.objects.none()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Retourne les informations de l'utilisateur connecté"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change le mot de passe de l'utilisateur connecté"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": "Mot de passe incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"message": "Mot de passe modifié avec succès."})


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vue personnalisée pour l'obtention des tokens JWT
    """
    def post(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Vérifier que les données sont présentes
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {"detail": "Le nom d'utilisateur et le mot de passe sont requis."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Appeler la méthode parente pour obtenir le token
            response = super().post(request, *args, **kwargs)
            
            # Si la connexion réussit, enregistrer la session
            if response.status_code == 200:
                try:
                    user = authenticate(username=username, password=password)
                    if user:
                        # Enregistrer la session pour audit (optionnel)
                        try:
                            from .models import UserSession
                            UserSession.objects.create(
                                user=user,
                                ip_address=self.get_client_ip(request),
                                user_agent=request.META.get('HTTP_USER_AGENT', '')
                            )
                        except Exception as session_error:
                            # Logger l'erreur mais ne pas faire échouer la connexion
                            logger.warning(f"Impossible d'enregistrer la session utilisateur: {session_error}")
                except Exception as auth_error:
                    logger.warning(f"Erreur lors de l'authentification pour la session: {auth_error}")
            
            return response
            
        except Exception as e:
            # Logger l'erreur complète
            logger.error(f"Erreur lors de l'authentification: {e}", exc_info=True)
            from rest_framework.response import Response
            from rest_framework import status
            import traceback
            
            # En mode DEBUG, retourner plus de détails
            from django.conf import settings
            error_detail = str(e)
            if settings.DEBUG:
                error_detail += f"\n{traceback.format_exc()}"
            
            return Response(
                {
                    "detail": "Erreur lors de l'authentification.",
                    "error": error_detail if settings.DEBUG else "Vérifiez vos identifiants."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
