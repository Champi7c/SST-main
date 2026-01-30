"""
Modèles pour la gestion de la vaccination et surveillance médicale.
Conformité : secret médical, historisation, liaisons Agent / Visite / Surveillance.
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from medical.models import Agent


class Vaccine(models.Model):
    """
    Référentiel des vaccins
    """
    name = models.CharField(max_length=200, unique=True, verbose_name="Nom du vaccin")
    code = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Code")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    validity_period_months = models.IntegerField(blank=True, null=True, verbose_name="Période de validité (mois)")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Vaccin"
        verbose_name_plural = "Vaccins"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Vaccination(models.Model):
    """
    Vaccination d'un agent
    """
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='vaccinations', verbose_name="Agent")
    vaccine = models.ForeignKey(Vaccine, on_delete=models.PROTECT, related_name='vaccinations', verbose_name="Vaccin")
    
    vaccination_date = models.DateField(verbose_name="Date de vaccination")
    batch_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Numéro de lot")
    next_due_date = models.DateField(blank=True, null=True, verbose_name="Date de rappel")
    
    # Lien avec visite médicale (optionnel)
    visit = models.ForeignKey(
        'visits.MedicalVisit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vaccinations_during_visit',
        verbose_name="Visite médicale associée",
    )
    
    # Personnel médical
    administered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='vaccinations_administered', verbose_name="Administré par")
    
    # Notes
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Vaccination"
        verbose_name_plural = "Vaccinations"
        ordering = ['-vaccination_date']
        unique_together = ['agent', 'vaccine', 'vaccination_date']
    
    def __str__(self):
        return f"{self.agent} - {self.vaccine} - {self.vaccination_date}"
    
    def is_up_to_date(self):
        """Statut à jour si next_due_date dans le futur (ou pas de rappel)."""
        from django.utils import timezone
        if not self.next_due_date:
            return True
        return self.next_due_date >= timezone.now().date()


class MedicalSurveillance(models.Model):
    """
    Surveillance médicale quinquennale ou spécifique
    """
    SURVEILLANCE_TYPE_CHOICES = [
        ('quinquennial', 'Quinquennale'),
        ('specific', 'Spécifique'),
        ('chronic', 'Maladie chronique'),
    ]
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='surveillances', verbose_name="Agent")
    
    surveillance_type = models.CharField(max_length=20, choices=SURVEILLANCE_TYPE_CHOICES, verbose_name="Type de surveillance")
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(blank=True, null=True, verbose_name="Date de fin")
    next_review_date = models.DateField(blank=True, null=True, verbose_name="Date de prochaine révision")
    
    reason = models.TextField(verbose_name="Raison de la surveillance")
    medical_findings = models.TextField(blank=True, null=True, verbose_name="Constats médicaux")
    recommendations = models.TextField(blank=True, null=True, verbose_name="Recommandations")
    
    is_active = models.BooleanField(default=True, verbose_name="Active")
    
    # Personnel médical
    prescribed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='surveillances_prescribed', verbose_name="Prescrit par")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Surveillance médicale"
        verbose_name_plural = "Surveillances médicales"
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.agent} - {self.get_surveillance_type_display()} - {self.start_date}"


class VaccineContraindication(models.Model):
    """
    Contre-indication vaccinale par agent. Données médicales — accès personnel médical uniquement.
    """
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='vaccine_contraindications', verbose_name="Agent")
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE, related_name='contraindications', verbose_name="Vaccin")
    reason = models.TextField(verbose_name="Raison de la contre-indication")
    recorded_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de constat")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='vaccine_contraindications_recorded',
        verbose_name="Constaté par",
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    class Meta:
        verbose_name = "Contre-indication vaccinale"
        verbose_name_plural = "Contre-indications vaccinales"
        ordering = ['-recorded_at']
        unique_together = ['agent', 'vaccine']
    
    def __str__(self):
        return f"{self.agent} - {self.vaccine} (contre-indication)"


class VaccineRequirement(models.Model):
    """
    Vaccin obligatoire ou recommandé selon le poste ou la catégorie de risque.
    Au moins un parmi job_position ou risk_category doit être renseigné.
    """
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE, related_name='requirements', verbose_name="Vaccin")
    job_position = models.ForeignKey(
        'companies.JobPosition',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='vaccine_requirements',
        verbose_name="Poste de travail",
    )
    risk_category = models.ForeignKey(
        'prevention.RiskCategory',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='vaccine_requirements',
        verbose_name="Catégorie de risque",
    )
    mandatory = models.BooleanField(default=True, verbose_name="Obligatoire")
    
    class Meta:
        verbose_name = "Vaccination obligatoire / recommandée"
        verbose_name_plural = "Vaccinations obligatoires / recommandées"
        ordering = ['vaccine']
        constraints = [
            models.CheckConstraint(
                check=models.Q(job_position__isnull=False) | models.Q(risk_category__isnull=False),
                name='vaccine_requirement_job_or_risk',
            ),
        ]
    
    def __str__(self):
        target = self.job_position or self.risk_category
        return f"{self.vaccine} — {target} ({'obligatoire' if self.mandatory else 'recommandé'})"
    
    def clean(self):
        if not self.job_position and not self.risk_category:
            raise ValidationError("Renseigner au moins le poste de travail ou la catégorie de risque.")


class VaccinationAlert(models.Model):
    """
    Alerte vaccin à échéance ou expiré. Générée par logique métier (service / tâche planifiée).
    """
    ALERT_TYPE_CHOICES = [
        ('due_soon', 'À échéance'),
        ('overdue', 'En retard'),
    ]
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='vaccination_alerts', verbose_name="Agent")
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE, related_name='alerts', verbose_name="Vaccin")
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, verbose_name="Type d'alerte")
    due_date = models.DateField(verbose_name="Date de rappel")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créée le")
    acknowledged = models.BooleanField(default=False, verbose_name="Pris en compte")
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name="Pris en compte le")
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vaccination_alerts_acknowledged',
        verbose_name="Pris en compte par",
    )
    
    class Meta:
        verbose_name = "Alerte vaccination"
        verbose_name_plural = "Alertes vaccination"
        ordering = ['due_date', 'agent']
        indexes = [
            models.Index(fields=['alert_type', 'due_date']),
            models.Index(fields=['acknowledged']),
        ]
    
    def __str__(self):
        return f"{self.agent} - {self.vaccine} - {self.get_alert_type_display()} ({self.due_date})"
