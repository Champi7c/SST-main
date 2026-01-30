"""
Modèles pour le Dossier Médical en Santé au Travail (DMST)
"""
from django.db import models
from django.conf import settings
from companies.models import Company, Site, Service, JobPosition


class Agent(models.Model):
    """
    Modèle pour les agents/employés
    """
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('O', 'Autre'),
    ]
    
    TITLE_CHOICES = [
        ('M', 'Monsieur'),
        ('MME', 'Madame'),
        ('MLLE', 'Mademoiselle'),
    ]
    
    # Informations administratives
    matricule = models.CharField(max_length=50, unique=True, verbose_name="Matricule")
    title = models.CharField(max_length=10, choices=TITLE_CHOICES, blank=True, null=True, verbose_name="Civilité")
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    date_of_birth = models.DateField(verbose_name="Date de naissance")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Sexe")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    
    # Personne à contacter en cas d'urgence
    emergency_contact_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nom du contact d'urgence")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone du contact d'urgence")
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True, verbose_name="Relation avec le contact d'urgence")
    
    # Relations avec entreprise
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='agents', verbose_name="Entreprise")
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, blank=True, null=True, related_name='agents', verbose_name="Site")
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, blank=True, null=True, related_name='agents', verbose_name="Service")
    job_position = models.ForeignKey(JobPosition, on_delete=models.SET_NULL, blank=True, null=True, related_name='agents', verbose_name="Poste de travail")
    
    # Informations professionnelles
    function = models.CharField(max_length=200, blank=True, null=True, verbose_name="Fonction")
    grade = models.CharField(max_length=100, blank=True, null=True, verbose_name="Grade")
    professional_category = models.CharField(max_length=100, blank=True, null=True, verbose_name="Catégorie professionnelle")
    
    # Supérieur hiérarchique
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='subordinates', verbose_name="Supérieur hiérarchique")
    
    # Dates importantes
    hire_date = models.DateField(verbose_name="Date d'embauche")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    is_archived = models.BooleanField(default=False, verbose_name="Archivé")
    archived_at = models.DateTimeField(blank=True, null=True, verbose_name="Date d'archivage")
    archived_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name='archived_agents', verbose_name="Archivé par")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_agents', verbose_name="Créé par")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_agents', verbose_name="Modifié par")
    
    class Meta:
        verbose_name = "Agent"
        verbose_name_plural = "Agents"
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['matricule']),
            models.Index(fields=['company', 'site', 'service']),
            models.Index(fields=['is_active', 'is_archived']),
        ]
    
    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.matricule})"
    
    @property
    def age(self):
        """Calcule l'âge de l'agent à partir de sa date de naissance"""
        from datetime import date
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None
    
    def archive(self, user=None):
        """Archive l'agent (soft delete)"""
        from django.utils import timezone
        self.is_archived = True
        self.is_active = False
        self.archived_at = timezone.now()
        if user:
            self.archived_by = user
        self.save()
    
    def unarchive(self):
        """Désarchive l'agent"""
        self.is_archived = False
        self.is_active = True
        self.archived_at = None
        self.archived_by = None
        self.save()


class DMST(models.Model):
    """
    Dossier Médical en Santé au Travail
    """
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name='dmst', verbose_name="Agent")
    
    # Allergies
    allergies = models.TextField(blank=True, null=True, verbose_name="Allergies")
    
    # Antécédents médicaux
    medical_history = models.TextField(blank=True, null=True, verbose_name="Antécédents médicaux")
    chronic_diseases = models.TextField(blank=True, null=True, verbose_name="Maladies chroniques")
    
    # Habitudes
    smoking = models.BooleanField(default=False, verbose_name="Tabagisme")
    alcohol = models.BooleanField(default=False, verbose_name="Alcool")
    drugs = models.BooleanField(default=False, verbose_name="Drogues")
    habits_notes = models.TextField(blank=True, null=True, verbose_name="Notes sur les habitudes")
    
    # Pathologies
    physical_pathologies = models.TextField(blank=True, null=True, verbose_name="Pathologies physiques")
    mental_pathologies = models.TextField(blank=True, null=True, verbose_name="Pathologies mentales")
    social_pathologies = models.TextField(blank=True, null=True, verbose_name="Pathologies sociales")
    
    # Autres informations médicales
    hereditary_diseases = models.TextField(blank=True, null=True, verbose_name="Maladies héréditaires")
    handicap = models.BooleanField(default=False, verbose_name="Handicap")
    handicap_details = models.TextField(blank=True, null=True, verbose_name="Détails du handicap")
    pregnancy = models.BooleanField(default=False, verbose_name="Grossesse")
    pregnancy_due_date = models.DateField(blank=True, null=True, verbose_name="Date prévue d'accouchement")
    
    # Traitements en cours
    current_treatments = models.TextField(blank=True, null=True, verbose_name="Traitements en cours")
    
    # Médecins traitants
    treating_doctors = models.TextField(blank=True, null=True, verbose_name="Médecins traitants")
    
    # Conditions de travail
    working_conditions = models.TextField(blank=True, null=True, verbose_name="Conditions de travail")
    
    # Surveillance médicale
    under_surveillance = models.BooleanField(default=False, verbose_name="Sous surveillance médicale")
    surveillance_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="Type de surveillance")
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='dmst_created')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='dmst_updated')
    
    class Meta:
        verbose_name = "DMST"
        verbose_name_plural = "DMST"
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"DMST - {self.agent}"


class DMSTHistory(models.Model):
    """
    Historique des modifications du DMST pour traçabilité complète
    """
    dmst = models.ForeignKey(DMST, on_delete=models.CASCADE, related_name='history', verbose_name="DMST")
    
    # Informations sur la modification
    modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='dmst_modifications', verbose_name="Modifié par")
    modification_date = models.DateTimeField(auto_now_add=True, verbose_name="Date de modification")
    modification_type = models.CharField(
        max_length=50,
        choices=[
            ('create', 'Création'),
            ('update', 'Modification'),
            ('visit', 'Visite médicale'),
            ('diagnosis', 'Diagnostic'),
            ('prescription', 'Prescription'),
        ],
        verbose_name="Type de modification"
    )
    
    # Champ modifié et valeurs
    field_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Champ modifié")
    old_value = models.TextField(blank=True, null=True, verbose_name="Ancienne valeur")
    new_value = models.TextField(blank=True, null=True, verbose_name="Nouvelle valeur")
    
    # Contexte
    reason = models.TextField(blank=True, null=True, verbose_name="Raison de la modification")
    related_visit = models.ForeignKey('visits.MedicalVisit', on_delete=models.SET_NULL, blank=True, null=True, related_name='dmst_changes', verbose_name="Visite associée")
    
    # Notes
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    class Meta:
        verbose_name = "Historique DMST"
        verbose_name_plural = "Historiques DMST"
        ordering = ['-modification_date']
        indexes = [
            models.Index(fields=['dmst', '-modification_date']),
            models.Index(fields=['modified_by', '-modification_date']),
        ]
    
    def __str__(self):
        return f"Historique DMST - {self.dmst.agent} - {self.modification_date}"


class Pathology(models.Model):
    """
    Modèle pour les pathologies (référentiel CIM-10)
    """
    code = models.CharField(max_length=20, unique=True, verbose_name="Code CIM-10")
    name = models.CharField(max_length=500, verbose_name="Nom")
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name="Catégorie")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Pathologie"
        verbose_name_plural = "Pathologies"
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class AgentPathology(models.Model):
    """
    Lien entre agent et pathologie
    """
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='pathologies')
    pathology = models.ForeignKey(Pathology, on_delete=models.CASCADE, related_name='agents')
    diagnosis_date = models.DateField(verbose_name="Date de diagnostic")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Pathologie agent"
        verbose_name_plural = "Pathologies agents"
        unique_together = ['agent', 'pathology']
    
    def __str__(self):
        return f"{self.agent} - {self.pathology}"
