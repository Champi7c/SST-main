"""
Modèles pour la prévention et l'évaluation des risques professionnels.
EVRP, FIE/FIR, plan d'actions, liaisons AT/MP.
"""
from django.db import models
from django.conf import settings
from companies.models import Company, Site, Service, JobPosition
from medical.models import Agent


class RiskCategory(models.Model):
    """
    Catégories de risques professionnels.
    category_type : physique, biologique, chimique, psychosocial, ergonomique.
    """
    CATEGORY_TYPE_CHOICES = [
        ('physical', 'Physique'),
        ('biological', 'Biologique'),
        ('chemical', 'Chimique'),
        ('psychosocial', 'Psychosocial'),
        ('ergonomic', 'Ergonomique'),
    ]
    name = models.CharField(max_length=200, unique=True, verbose_name="Nom")
    code = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Code")
    category_type = models.CharField(
        max_length=20,
        choices=CATEGORY_TYPE_CHOICES,
        blank=True,
        null=True,
        verbose_name="Type de catégorie",
    )
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Catégorie de risque"
        verbose_name_plural = "Catégories de risques"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Risk(models.Model):
    """
    Risque professionnel
    """
    SEVERITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='risks', verbose_name="Entreprise")
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, blank=True, null=True, related_name='risks', verbose_name="Site")
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, blank=True, null=True, related_name='risks', verbose_name="Service")
    job_position = models.ForeignKey(JobPosition, on_delete=models.SET_NULL, blank=True, null=True, related_name='risks', verbose_name="Poste de travail")
    
    category = models.ForeignKey(RiskCategory, on_delete=models.PROTECT, related_name='risks', verbose_name="Catégorie")
    name = models.CharField(max_length=200, verbose_name="Nom du risque")
    description = models.TextField(verbose_name="Description")
    
    # Évaluation
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, verbose_name="Gravité")
    probability = models.CharField(max_length=20, choices=SEVERITY_CHOICES, verbose_name="Probabilité")
    exposure_frequency = models.CharField(max_length=200, blank=True, null=True, verbose_name="Fréquence d'exposition")
    
    # Identification
    identified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='risks_identified', verbose_name="Identifié par")
    identification_date = models.DateField(verbose_name="Date d'identification")
    
    # Statut
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Risque professionnel"
        verbose_name_plural = "Risques professionnels"
        ordering = ['-identification_date']
    
    def __str__(self):
        return f"{self.name} - {self.company}"


class PreventiveAction(models.Model):
    """
    Action préventive ou corrective
    """
    ACTION_TYPE_CHOICES = [
        ('preventive', 'Préventive'),
        ('corrective', 'Corrective'),
    ]
    
    STATUS_CHOICES = [
        ('planned', 'Planifiée'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]
    
    risk = models.ForeignKey(Risk, on_delete=models.CASCADE, related_name='actions', verbose_name="Risque")
    
    action_type = models.CharField(max_length=20, choices=ACTION_TYPE_CHOICES, verbose_name="Type d'action")
    title = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description")
    
    # Planification
    planned_date = models.DateField(verbose_name="Date prévue")
    due_date = models.DateField(blank=True, null=True, verbose_name="Date d'échéance")
    completed_date = models.DateField(blank=True, null=True, verbose_name="Date de réalisation")
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned', verbose_name="Statut")
    
    # Responsable
    responsible = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='actions_responsible', verbose_name="Responsable")
    
    # Suivi
    effectiveness = models.TextField(blank=True, null=True, verbose_name="Efficacité")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='actions_created')
    
    class Meta:
        verbose_name = "Action préventive/corrective"
        verbose_name_plural = "Actions préventives/correctives"
        ordering = ['-planned_date']
    
    def __str__(self):
        return f"{self.title} - {self.risk}"


class IndividualExposureSheet(models.Model):
    """
    Fiche individuelle d'exposition
    """
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name='exposure_sheet', verbose_name="Agent")
    
    exposure_period = models.CharField(max_length=200, verbose_name="Période d'exposition")
    exposed_risks = models.ManyToManyField(Risk, related_name='exposed_agents', verbose_name="Risques exposés")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name = "Fiche individuelle d'exposition"
        verbose_name_plural = "Fiches individuelles d'exposition"
    
    def __str__(self):
        return f"FIE - {self.agent}"


class IndividualRiskSheet(models.Model):
    """
    Fiche individuelle des risques
    """
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name='risk_sheet', verbose_name="Agent")
    
    risks_description = models.TextField(verbose_name="Description des risques")
    preventive_measures = models.TextField(blank=True, null=True, verbose_name="Mesures préventives")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name = "Fiche individuelle des risques"
        verbose_name_plural = "Fiches individuelles des risques"
    
    def __str__(self):
        return f"FIR - {self.agent}"


class RiskWorkAccidentLink(models.Model):
    """
    Liaison risque ↔ accident de travail (analyse des causes, EVRP).
    """
    risk = models.ForeignKey(
        Risk,
        on_delete=models.CASCADE,
        related_name='work_accident_links',
        verbose_name="Risque",
    )
    work_accident = models.ForeignKey(
        'accidents.WorkAccident',
        on_delete=models.CASCADE,
        related_name='risk_links',
        verbose_name="Accident de travail",
    )
    comment = models.TextField(blank=True, null=True, verbose_name="Commentaire")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Lien risque – accident de travail"
        verbose_name_plural = "Liens risque – accidents de travail"
        unique_together = ['risk', 'work_accident']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.risk} ↔ AT {self.work_accident.id}"


class RiskOccupationalDiseaseLink(models.Model):
    """
    Liaison risque ↔ maladie professionnelle.
    """
    risk = models.ForeignKey(
        Risk,
        on_delete=models.CASCADE,
        related_name='occupational_disease_links',
        verbose_name="Risque",
    )
    occupational_disease = models.ForeignKey(
        'accidents.OccupationalDisease',
        on_delete=models.CASCADE,
        related_name='risk_links',
        verbose_name="Maladie professionnelle",
    )
    comment = models.TextField(blank=True, null=True, verbose_name="Commentaire")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Lien risque – maladie professionnelle"
        verbose_name_plural = "Liens risque – maladies professionnelles"
        unique_together = ['risk', 'occupational_disease']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.risk} ↔ MP {self.occupational_disease.id}"
