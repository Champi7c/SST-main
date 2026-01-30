"""
Modèles pour l'audit et la traçabilité
"""
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class AuditLog(models.Model):
    """
    Journal d'audit pour tracer toutes les actions
    """
    ACTION_TYPES = [
        ('create', 'Création'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
        ('view', 'Consultation'),
        ('export', 'Export'),
        ('login', 'Connexion'),
        ('logout', 'Déconnexion'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs', verbose_name="Utilisateur")
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES, verbose_name="Type d'action")
    
    # Objet concerné (générique)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Détails
    model_name = models.CharField(max_length=100, verbose_name="Modèle")
    object_repr = models.CharField(max_length=200, blank=True, null=True, verbose_name="Représentation de l'objet")
    changes = models.JSONField(blank=True, null=True, verbose_name="Modifications")
    
    # Contexte
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Horodatage")
    
    class Meta:
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journaux d'audit"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action_type', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_action_type_display()} - {self.model_name} - {self.timestamp}"


class MedicalDataAccess(models.Model):
    """
    Traçabilité spécifique des accès aux données médicales
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='medical_accesses', verbose_name="Utilisateur")
    
    # Données consultées
    agent = models.ForeignKey('medical.Agent', on_delete=models.SET_NULL, null=True, related_name='access_logs', verbose_name="Agent")
    data_type = models.CharField(max_length=100, verbose_name="Type de données")  # DMST, Visite, etc.
    
    # Contexte
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name="Adresse IP")
    reason = models.TextField(blank=True, null=True, verbose_name="Raison de l'accès")
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Horodatage")
    
    class Meta:
        verbose_name = "Accès données médicales"
        verbose_name_plural = "Accès données médicales"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['agent', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.agent} - {self.data_type} - {self.timestamp}"
