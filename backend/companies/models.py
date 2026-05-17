"""
Modèles pour la gestion multi-entreprises et multi-sites
"""
from django.db import models
from django.conf import settings


class Company(models.Model):
    """
    Modèle pour les entreprises
    """
    name = models.CharField(max_length=200, verbose_name="Nom de l'entreprise")
    siret = models.CharField(max_length=14, unique=True, verbose_name="SIRET")
    address = models.TextField(verbose_name="Adresse")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprises"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Site(models.Model):
    """
    Modèle pour les sites d'une entreprise
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='sites', verbose_name="Entreprise")
    name = models.CharField(max_length=200, verbose_name="Nom du site")
    address = models.TextField(verbose_name="Adresse")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Site"
        verbose_name_plural = "Sites"
        ordering = ['company', 'name']
        unique_together = ['company', 'name']
    
    def __str__(self):
        return f"{self.company.name} - {self.name}"


class Service(models.Model):
    """
    Modèle pour les services/départements
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='services', verbose_name="Entreprise")
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='services', blank=True, null=True, verbose_name="Site")
    name = models.CharField(max_length=200, verbose_name="Nom du service")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ['company', 'name']
    
    def __str__(self):
        return f"{self.company.name} - {self.name}"


class CompanyMembership(models.Model):
    """
    Modèle pour lier les utilisateurs aux entreprises
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='company_memberships')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='members')
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, blank=True, null=True, related_name='members')
    is_primary = models.BooleanField(default=False, verbose_name="Entreprise principale")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Appartenance entreprise"
        verbose_name_plural = "Appartenances entreprises"
        unique_together = ['user', 'company', 'site']
    
    def __str__(self):
        return f"{self.user.username} - {self.company.name}"


class Doctor(models.Model):
    """
    Modèle pour les médecins (médecins du travail, traitants, spécialistes)
    """
    last_name = models.CharField(max_length=100, verbose_name="Nom")
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    specialty = models.CharField(max_length=200, blank=True, null=True, verbose_name="Spécialité")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctors', verbose_name="Entreprise")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Médecin"
        verbose_name_plural = "Médecins"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"Dr. {self.last_name} {self.first_name}"

    @property
    def full_name(self):
        return f"Dr. {self.last_name} {self.first_name}"


class JobPosition(models.Model):
    """
    Modèle pour les postes de travail
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='job_positions')
    name = models.CharField(max_length=200, verbose_name="Nom du poste")
    code = models.CharField(max_length=50, blank=True, null=True, verbose_name="Code")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Poste de travail"
        verbose_name_plural = "Postes de travail"
        ordering = ['company', 'name']
    
    def __str__(self):
        return f"{self.company.name} - {self.name}"
