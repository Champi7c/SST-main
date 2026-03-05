"""
Supprime toutes les données fictives / métier (entreprises, agents, visites, AT, MP,
vaccinations, formations, prévention, consultations, audit) SANS toucher aux utilisateurs.
Usage: python manage.py flush_fake_data
       python manage.py flush_fake_data --no-input  # sans confirmation
"""
from django.core.management.base import BaseCommand
from django.db import utils as db_utils


def _safe_delete(model, label, stdout, style):
    try:
        n, _ = model.objects.all().delete()
        if n:
            stdout.write(style.SUCCESS(f'  Supprimé {label}: {n} enregistrement(s).'))
    except db_utils.ProgrammingError as e:
        err = str(e)
        if '1146' in err or "doesn't exist" in err.lower():
            stdout.write(style.WARNING(f'  Ignoré {label} (table absente).'))
        else:
            raise


class Command(BaseCommand):
    help = "Supprime toutes les données fictives (entreprises, agents, visites, etc.) SANS supprimer les utilisateurs."

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-input',
            action='store_true',
            help='Ne pas demander de confirmation.',
        )

    def handle(self, *args, **options):
        if not options.get('no_input'):
            self.stdout.write(self.style.WARNING(
                'Cette commande va supprimer TOUTES les données métier (entreprises, agents, visites, '
                'accidents, vaccinations, formations, prévention, consultations, journaux d\'audit). '
                'Les COMPTES UTILISATEURS seront conservés.'
            ))
            if input('Continuer ? (oui/non) : ').strip().lower() != 'oui':
                self.stdout.write('Annulé.')
                return

        self.stdout.write('Suppression des données fictives (ordre des dépendances)...')

        # Imports des modèles (ordre inverse des dépendances = supprimer les enfants en premier)
        from training.models import ArticleRecipient, EducationalArticle, TrainingRequirement, Training, TrainingType
        from prevention.models import (
            IndividualRiskSheet, IndividualExposureSheet,
            RiskWorkAccidentLink, RiskOccupationalDiseaseLink,
            PreventiveAction, Risk,
        )
        from vaccination.models import (
            VaccinationAlert, VaccineContraindication, VaccineRequirement,
            MedicalSurveillance, Vaccination,
        )
        from accidents.models import WorkAccident, OccupationalDisease
        from visits.models import VisitConvocation, MedicalVisit, VisitType
        from medical.models import AgentPathology, DMSTHistory, DMST, Agent, Pathology
        from companies.models import CompanyMembership, JobPosition, Service, Site, Company
        from vaccination.models import Vaccine
        from prevention.models import RiskCategory

        try:
            from audit.models import MedicalDataAccess, AuditLog
        except ImportError:
            MedicalDataAccess = AuditLog = None

        try:
            from consultations.models import OnlineConsultation
        except ImportError:
            OnlineConsultation = None

        # Ordre de suppression (enfants avant parents)
        steps = [
            (ArticleRecipient, 'Destinataires articles'),
            (EducationalArticle, 'Articles éducatifs'),
            (TrainingRequirement, 'Habilitations formation'),
            (Training, 'Formations'),
            (IndividualRiskSheet, 'Fiches individuelles risques'),
            (IndividualExposureSheet, 'Fiches individuelles exposition'),
            (RiskWorkAccidentLink, 'Liens risque–AT'),
            (RiskOccupationalDiseaseLink, 'Liens risque–MP'),
            (PreventiveAction, 'Actions préventives'),
            (Risk, 'Risques'),
            (VaccinationAlert, 'Alertes vaccination'),
            (VaccineContraindication, 'Contre-indications vaccins'),
            (VaccineRequirement, 'Exigences vaccins'),
            (MedicalSurveillance, 'Surveillances médicales'),
            (Vaccination, 'Vaccinations'),
            (WorkAccident, 'Accidents de travail'),
            (OccupationalDisease, 'Maladies professionnelles'),
            (VisitConvocation, 'Convocations'),
            (MedicalVisit, 'Visites médicales'),
            (AgentPathology, 'Pathologies agents'),
            (DMSTHistory, 'Historiques DMST'),
            (DMST, 'Dossiers médicaux (DMST)'),
            (MedicalDataAccess, 'Accès données médicales'),
            (AuditLog, 'Journal d\'audit'),
            (OnlineConsultation, 'Consultations en ligne'),
            (Agent, 'Agents'),
            (CompanyMembership, 'Appartenances entreprises'),
            (JobPosition, 'Postes'),
            (Service, 'Services'),
            (Site, 'Sites'),
            (Company, 'Entreprises'),
            (VisitType, 'Types de visite'),
            (Vaccine, 'Vaccins'),
            (RiskCategory, 'Catégories risques'),
            (TrainingType, 'Types formation'),
            (Pathology, 'Pathologies'),
        ]

        for model, label in steps:
            if model is None:
                continue
            _safe_delete(model, label, self.stdout, self.style)

        self.stdout.write(self.style.SUCCESS('Données fictives supprimées. Les utilisateurs ont été conservés.'))
