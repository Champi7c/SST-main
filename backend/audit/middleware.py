"""
Middleware pour l'audit automatique
"""
from .models import AuditLog
from django.utils.deprecation import MiddlewareMixin
import json


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware pour enregistrer automatiquement les actions dans le journal d'audit
    """
    def process_request(self, request):
        # Cette méthode est appelée avant chaque requête
        # L'audit sera géré dans les vues via des signaux ou des décorateurs
        pass
    
    @staticmethod
    def log_action(user, action_type, model_instance=None, changes=None, request=None):
        """
        Méthode statique pour enregistrer une action dans le journal d'audit
        """
        if not user or not user.is_authenticated:
            return
        
        log_data = {
            'user': user,
            'action_type': action_type,
            'model_name': '',
            'object_repr': '',
            'changes': changes,
        }
        
        if model_instance:
            log_data['content_type'] = type(model_instance)._meta.label
            log_data['model_name'] = type(model_instance).__name__
            log_data['object_repr'] = str(model_instance)
            log_data['object_id'] = model_instance.pk
        
        if request:
            log_data['ip_address'] = AuditMiddleware.get_client_ip(request)
            log_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        AuditLog.objects.create(**log_data)
    
    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
