"""
Middleware pour le logging des erreurs
"""
import logging
import traceback
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)


class ErrorLoggingMiddleware:
    """
    Middleware pour logger les erreurs 500
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """
        Log les exceptions et retourne une réponse JSON en mode DEBUG
        """
        logger.error(
            f"Erreur 500 sur {request.path}",
            exc_info=True,
            extra={
                'request_path': request.path,
                'request_method': request.method,
                'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
            }
        )
        
        if settings.DEBUG:
            # En mode DEBUG, retourner les détails de l'erreur
            return JsonResponse({
                'error': str(exception),
                'type': type(exception).__name__,
                'traceback': traceback.format_exc(),
                'path': request.path,
            }, status=500)
        
        # En production, retourner une erreur générique
        return JsonResponse({
            'error': 'Une erreur interne du serveur s\'est produite.',
            'path': request.path,
        }, status=500)
