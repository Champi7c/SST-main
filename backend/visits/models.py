"""
Modèles pour la gestion des visites médicales
"""
from django.db import models
from django.conf import settings
from medical.models import Agent


class VisitType(models.Model):
    """
    Types de visites médicales
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Type de visite"
        verbose_name_plural = "Types de visites"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class MedicalVisit(models.Model):
    """
    Visite médicale
    """
    STATUS_CHOICES = [
        ('scheduled', 'Programmée'),
        ('completed', 'Réalisée'),
        ('cancelled', 'Annulée'),
        ('absent', 'Absent'),
        ('rescheduled', 'Reprogrammée'),
    ]
    
    DECISION_CHOICES = [
        ('apte', 'Apte'),
        ('apte_avec_reserves', 'Apte avec réserves'),
        ('inapte_temporaire', 'Inapte temporaire'),
        ('inapte_permanent', 'Inapte permanent'),
        ('inapte_poste', 'Inapte au poste'),
    ]
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='visits', verbose_name="Agent")
    visit_type = models.ForeignKey(VisitType, on_delete=models.PROTECT, related_name='visits', verbose_name="Type de visite")
    
    # Programmation
    scheduled_date = models.DateTimeField(verbose_name="Date et heure programmée")
    actual_date = models.DateTimeField(blank=True, null=True, verbose_name="Date et heure réelle")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name="Statut")
    
    # Raison de la visite
    reason = models.TextField(blank=True, null=True, verbose_name="Raison de la visite")
    
    # Constantes médicales
    temperature = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True, verbose_name="Température (°C)")
    blood_pressure_systolic = models.IntegerField(blank=True, null=True, verbose_name="Tension systolique")
    blood_pressure_diastolic = models.IntegerField(blank=True, null=True, verbose_name="Tension diastolique")
    heart_rate = models.IntegerField(blank=True, null=True, verbose_name="Fréquence cardiaque")
    blood_sugar = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="Glycémie (g/L)")
    weight = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="Poids (kg)")
    height = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="Taille (cm)")
    
    # Diagnostic et prescriptions
    diagnosis = models.TextField(blank=True, null=True, verbose_name="Diagnostic")
    prescriptions = models.TextField(blank=True, null=True, verbose_name="Prescriptions")
    recommendations = models.TextField(blank=True, null=True, verbose_name="Recommandations")
    
    # Décision médicale
    decision = models.CharField(max_length=30, choices=DECISION_CHOICES, blank=True, null=True, verbose_name="Décision médicale")
    decision_details = models.TextField(blank=True, null=True, verbose_name="Détails de la décision")
    
    # Alertes
    alert_rh = models.BooleanField(default=False, verbose_name="Alerte RH")
    alert_direction = models.BooleanField(default=False, verbose_name="Alerte Direction")
    alert_reason = models.TextField(blank=True, null=True, verbose_name="Raison de l'alerte")
    
    # Reprogrammation
    rescheduled_date = models.DateTimeField(blank=True, null=True, verbose_name="Date reprogrammée")
    rescheduling_reason = models.TextField(blank=True, null=True, verbose_name="Raison de la reprogrammation")
    
    # Personnel médical
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='visits_doctor', verbose_name="Médecin")
    nurse = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='visits_nurse', verbose_name="Infirmier")
    
    # Notes
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    # Validation
    is_validated = models.BooleanField(default=False, verbose_name="Validée (non modifiable)")
    validated_at = models.DateTimeField(blank=True, null=True, verbose_name="Date de validation")
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits_validated',
        verbose_name="Validée par"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='visits_created')
    
    class Meta:
        verbose_name = "Visite médicale"
        verbose_name_plural = "Visites médicales"
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['agent', '-scheduled_date']),
            models.Index(fields=['status', '-scheduled_date']),
            models.Index(fields=['is_validated']),
        ]
    
    def __str__(self):
        return f"{self.agent} - {self.visit_type} - {self.scheduled_date}"
    
    def can_be_modified(self):
        """Vérifie si la visite peut être modifiée"""
        return not self.is_validated and self.status != 'completed'


class VisitConvocation(models.Model):
    """
    Convocation pour visite médicale
    """
    visit = models.OneToOneField(MedicalVisit, on_delete=models.CASCADE, related_name='convocation', verbose_name="Visite")
    sent_date = models.DateTimeField(auto_now_add=True, verbose_name="Date d'envoi")
    sent_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Envoyé par")
    sent_via = models.CharField(max_length=50, default='email', verbose_name="Moyen d'envoi")  # email, sms, courrier
    acknowledged = models.BooleanField(default=False, verbose_name="Accusé de réception")
    acknowledged_date = models.DateTimeField(blank=True, null=True, verbose_name="Date d'accusé de réception")
    
    class Meta:
        verbose_name = "Convocation"
        verbose_name_plural = "Convocations"
    
    def __str__(self):
        return f"Convocation - {self.visit.agent} - {self.visit.scheduled_date}"
