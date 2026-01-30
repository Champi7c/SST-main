"""
Modèles pour la gestion de la formation et de l'éducation sanitaire.
SST, incendie, EPI, hygiène & sécurité ; habilitations par poste ; diffusion ciblée.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from medical.models import Agent


class TrainingType(models.Model):
    """
    Types de formations SST
    """
    name = models.CharField(max_length=200, unique=True, verbose_name="Nom")
    code = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Code")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    validity_period_months = models.IntegerField(blank=True, null=True, verbose_name="Période de validité (mois)")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Type de formation"
        verbose_name_plural = "Types de formations"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Training(models.Model):
    """
    Formation SST
    """
    STATUS_CHOICES = [
        ('planned', 'Planifiée'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]
    
    training_type = models.ForeignKey(TrainingType, on_delete=models.PROTECT, related_name='trainings', verbose_name="Type de formation")
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='trainings', verbose_name="Agent")
    
    # Dates
    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(blank=True, null=True, verbose_name="Date de fin")
    next_due_date = models.DateField(blank=True, null=True, verbose_name="Date de prochain rappel")
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned', verbose_name="Statut")
    
    # Organisme formateur
    training_organization = models.CharField(max_length=200, blank=True, null=True, verbose_name="Organisme formateur")
    trainer_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Formateur")
    
    # Résultats
    result = models.CharField(max_length=50, blank=True, null=True, verbose_name="Résultat")  # Réussi, Échoué, etc.
    certificate_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Numéro de certificat")
    
    # Notes
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='trainings_created')
    
    class Meta:
        verbose_name = "Formation"
        verbose_name_plural = "Formations"
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.agent} - {self.training_type} - {self.start_date}"
    
    def is_valid(self):
        """Formation à jour si terminée et next_due_date dans le futur."""
        if self.status != 'completed':
            return False
        if not self.next_due_date:
            return True
        return self.next_due_date >= timezone.now().date()


class EducationalArticle(models.Model):
    """
    Article éducatif pour la diffusion
    """
    TARGET_AUDIENCE_CHOICES = [
        ('all', 'Tous les agents'),
        ('category', 'Par catégorie'),
        ('surveillance', 'Agents sous surveillance'),
        ('specific', 'Agents spécifiques'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Titre")
    content = models.TextField(verbose_name="Contenu")
    theme = models.CharField(max_length=200, blank=True, null=True, verbose_name="Thématique")
    links = models.TextField(blank=True, null=True, verbose_name="Liens")
    
    # Diffusion
    target_audience = models.CharField(max_length=20, choices=TARGET_AUDIENCE_CHOICES, default='all', verbose_name="Public cible")
    is_published = models.BooleanField(default=False, verbose_name="Publié")
    published_date = models.DateTimeField(blank=True, null=True, verbose_name="Date de publication")
    
    # Auteur
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='articles_authored', verbose_name="Auteur")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Article éducatif"
        verbose_name_plural = "Articles éducatifs"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class ArticleRecipient(models.Model):
    """
    Destinataires d'un article éducatif
    """
    article = models.ForeignKey(EducationalArticle, on_delete=models.CASCADE, related_name='recipients', verbose_name="Article")
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='received_articles', verbose_name="Agent")
    read = models.BooleanField(default=False, verbose_name="Lu")
    read_date = models.DateTimeField(blank=True, null=True, verbose_name="Date de lecture")
    
    class Meta:
        verbose_name = "Destinataire d'article"
        verbose_name_plural = "Destinataires d'articles"
        unique_together = ['article', 'agent']
    
    def __str__(self):
        return f"{self.article.title} - {self.agent}"


class TrainingRequirement(models.Model):
    """
    Formation obligatoire ou recommandée par poste de travail (habilitation).
    """
    training_type = models.ForeignKey(
        TrainingType,
        on_delete=models.CASCADE,
        related_name='requirements',
        verbose_name="Type de formation",
    )
    job_position = models.ForeignKey(
        'companies.JobPosition',
        on_delete=models.CASCADE,
        related_name='training_requirements',
        verbose_name="Poste de travail",
    )
    mandatory = models.BooleanField(default=True, verbose_name="Obligatoire")
    
    class Meta:
        verbose_name = "Formation obligatoire / recommandée"
        verbose_name_plural = "Formations obligatoires / recommandées"
        unique_together = ['training_type', 'job_position']
        ordering = ['job_position', 'training_type']
    
    def __str__(self):
        return f"{self.training_type} — {self.job_position} ({'obligatoire' if self.mandatory else 'recommandé'})"
