"""
Modèles pour la gestion des accidents de travail et maladies professionnelles
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from medical.models import Agent


class WorkAccident(models.Model):
    """
    Accident de travail
    """
    ACCIDENT_TYPE_CHOICES = [
        ('work', 'Accident de travail'),
        ('commute', 'Accident de trajet'),
        ('service', 'Accident de service'),
        ('mission', 'Accident de mission'),
    ]
    
    SEVERITY_CHOICES = [
        ('light', 'Léger'),
        ('moderate', 'Modéré'),
        ('severe', 'Grave'),
        ('fatal', 'Mortel'),
    ]
    
    STATUS_CHOICES = [
        ('declared', 'Déclaré'),
        ('investigating', 'En cours d\'investigation'),
        ('closed', 'Clôturé'),
    ]
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='accidents', verbose_name="Agent")
    
    # Informations sur l'accident
    accident_type = models.CharField(max_length=20, choices=ACCIDENT_TYPE_CHOICES, default='work', verbose_name="Type d'accident")
    accident_date = models.DateTimeField(verbose_name="Date et heure de l'accident")
    location = models.CharField(max_length=200, verbose_name="Lieu")
    mechanism = models.TextField(verbose_name="Mécanisme")
    description = models.TextField(verbose_name="Description détaillée")
    
    # Date de reprise et IPP
    return_to_work_date = models.DateField(blank=True, null=True, verbose_name="Date de reprise")
    ipp = models.IntegerField(
        blank=True, null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="IPP (%)"
    )
    
    # Gravité et statut
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, verbose_name="Gravité")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='declared', verbose_name="Statut")
    
    # Conséquences
    work_stoppage = models.BooleanField(default=False, verbose_name="Arrêt de travail")
    work_stoppage_days = models.IntegerField(blank=True, null=True, verbose_name="Nombre de jours d'arrêt")
    medical_care = models.BooleanField(default=False, verbose_name="Soins médicaux")
    hospitalization = models.BooleanField(default=False, verbose_name="Hospitalisation")
    
    # Analyse
    root_causes = models.TextField(blank=True, null=True, verbose_name="Causes racines")
    contributing_factors = models.TextField(blank=True, null=True, verbose_name="Facteurs contributifs")
    
    # Actions correctives
    corrective_actions = models.TextField(blank=True, null=True, verbose_name="Actions correctives")
    preventive_actions = models.TextField(blank=True, null=True, verbose_name="Actions préventives")
    
    # Déclaration
    declared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='accidents_declared', verbose_name="Déclaré par")
    declaration_date = models.DateTimeField(auto_now_add=True, verbose_name="Date de déclaration")
    
    # Alertes
    alert_rh = models.BooleanField(default=False, verbose_name="Alerte RH")
    alert_direction = models.BooleanField(default=False, verbose_name="Alerte Direction")
    alert_hse = models.BooleanField(default=False, verbose_name="Alerte HSE")
    alert_sent_at = models.DateTimeField(blank=True, null=True, verbose_name="Date d'envoi des alertes")
    
    # Suivi
    closed_date = models.DateTimeField(blank=True, null=True, verbose_name="Date de clôture")
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='accidents_closed', verbose_name="Clôturé par")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Accident de travail"
        verbose_name_plural = "Accidents de travail"
        ordering = ['-accident_date']
        indexes = [
            models.Index(fields=['accident_type', '-accident_date']),
            models.Index(fields=['severity', '-accident_date']),
            models.Index(fields=['status', '-accident_date']),
            models.Index(fields=['agent', '-accident_date']),
        ]
    
    def __str__(self):
        return f"AT - {self.agent} - {self.accident_date}"
    
    def send_alerts(self):
        """Envoie les alertes selon la gravité"""
        from django.utils import timezone
        
        # Alerte automatique selon la gravité
        if self.severity in ['severe', 'fatal']:
            self.alert_rh = True
            self.alert_direction = True
            self.alert_hse = True
        elif self.severity == 'moderate':
            self.alert_rh = True
            self.alert_hse = True
        
        if self.work_stoppage:
            self.alert_rh = True
        
        self.alert_sent_at = timezone.now()
        self.save()


class OccupationalDisease(models.Model):
    """
    Maladie professionnelle
    """
    DISEASE_TYPE_CHOICES = [
        ('mp', 'Maladie professionnelle'),
        ('mcp', 'Maladie à caractère professionnel'),
        ('ms', 'Maladie suspecte'),
    ]
    
    STATUS_CHOICES = [
        ('declared', 'Déclarée'),
        ('recognized', 'Reconnue'),
        ('rejected', 'Rejetée'),
    ]
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='occupational_diseases', verbose_name="Agent")
    
    # Type et désignation
    disease_type = models.CharField(max_length=10, choices=DISEASE_TYPE_CHOICES, default='mp', verbose_name="Type")
    disease_name = models.CharField(max_length=200, verbose_name="Désignation maladie")
    table_number = models.IntegerField(
        blank=True, null=True,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Numéro de tableau"
    )
    first_symptoms_date = models.DateField(verbose_name="Date des premiers symptômes")
    diagnosis_date = models.DateField(blank=True, null=True, verbose_name="Date de diagnostic")
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='declared', verbose_name="Statut")
    
    # Durée d'absence en jours (0-100)
    return_delay = models.IntegerField(
        blank=True, null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Durée d'absence (jours)"
    )
    
    # Durée d'exposition (deux dates, la durée est calculée)
    exposure_start_date = models.DateField(blank=True, null=True, verbose_name="Début d'exposition")
    exposure_end_date = models.DateField(blank=True, null=True, verbose_name="Fin d'exposition")
    exposure_factors = models.TextField(blank=True, null=True, verbose_name="Facteurs d'exposition")
    
    # Suivi médical
    medical_follow_up = models.TextField(blank=True, null=True, verbose_name="Suivi médical")
    treatment = models.TextField(blank=True, null=True, verbose_name="Traitement")
    
    # Déclaration
    declared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='diseases_declared', verbose_name="Déclaré par")
    declaration_date = models.DateTimeField(auto_now_add=True, verbose_name="Date de déclaration")
    
    # Reconnaissance
    recognition_date = models.DateField(blank=True, null=True, verbose_name="Date de reconnaissance")
    recognition_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Numéro de reconnaissance")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Maladie professionnelle"
        verbose_name_plural = "Maladies professionnelles"
        ordering = ['-first_symptoms_date']
    
    def __str__(self):
        return f"MP - {self.agent} - {self.disease_name}"
