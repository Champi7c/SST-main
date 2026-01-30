"""
Modèles pour la gestion des utilisateurs et des rôles
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Modèle utilisateur personnalisé avec gestion des profils SST
    """
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrateur'),
        ('admin', 'Administrateur'),
        ('medecin', 'Médecin du Travail'),
        ('infirmier', 'Infirmier SST'),
        ('consultant', 'Consultant SST'),
        ('rh', 'Ressources Humaines'),
        ('hse', 'Responsable HSE'),
        ('direction', 'Direction Générale'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Format de téléphone invalide")],
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Relations avec entreprises et sites (via les modèles companies)
    # Ces relations seront définies dans le modèle CompanyMembership
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    @property
    def has_medical_access(self):
        """Vérifie si l'utilisateur a accès aux données médicales"""
        return self.role in ['super_admin', 'medecin', 'infirmier']
    
    @property
    def can_view_dashboard(self):
        """Vérifie si l'utilisateur peut voir le tableau de bord"""
        return True  # Tous les utilisateurs authentifiés peuvent voir le dashboard
    
    @property
    def can_manage_users(self):
        """Vérifie si l'utilisateur peut gérer les utilisateurs"""
        return self.role in ['super_admin', 'admin']


class UserSession(models.Model):
    """Journalisation des sessions utilisateurs pour audit"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Session utilisateur"
        verbose_name_plural = "Sessions utilisateurs"
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time}"
