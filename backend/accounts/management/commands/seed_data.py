"""
Insère des données de démonstration : >20 enregistrements par rubrique.
Usage: python manage.py seed_data
       python manage.py seed_data --flush   # supprime les anciennes données puis réinsère
"""
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import utils as db_utils

from companies.models import Company, Site, Service, JobPosition, CompanyMembership
from medical.models import Agent, Pathology, AgentPathology, DMST, DMSTHistory
from visits.models import VisitType, MedicalVisit, VisitConvocation
from accidents.models import WorkAccident, OccupationalDisease
from vaccination.models import (
    Vaccine, Vaccination, MedicalSurveillance,
    VaccineContraindication, VaccineRequirement, VaccinationAlert,
)
from prevention.models import (
    RiskCategory, Risk, PreventiveAction,
    IndividualExposureSheet, IndividualRiskSheet,
    RiskWorkAccidentLink, RiskOccupationalDiseaseLink,
)
from training.models import (
    TrainingType, Training, EducationalArticle,
    ArticleRecipient, TrainingRequirement,
)
try:
    from audit.models import MedicalDataAccess, AuditLog
except ImportError:
    MedicalDataAccess = AuditLog = None

User = get_user_model()

N = 25  # au moins 20 par rubrique

# Prénoms et noms sénégalais
PRENOMS = (
    'Moussa', 'Fatou', 'Amadou', 'Awa', 'Ibrahima', 'Aissatou', 'Ousmane', 'Mariama',
    'Mamadou', 'Khady', 'Souleymane', 'Aminata', 'Cheikh', 'Ndèye', 'Modou', 'Coumba',
    'Babacar', 'Fatoumata', 'Abdoulaye', 'Adama', 'Demba', 'Khadija', 'Malick', 'Ramatoulaye',
    'El Hadji', 'Aïda', 'Serigne', 'Sokhna', 'Idrissa', 'Mame', 'Pape', 'Maimouna',
)
NOMS = (
    'Sow', 'Diallo', 'Ba', 'Fall', 'Ndiaye', 'Sy', 'Kane', 'Diop',
    'Gueye', 'Mbaye', 'Faye', 'Thiam', 'Diouf', 'Seck', 'Sall', 'Mbengue',
    'Camara', 'Touré', 'Cissé', 'Sanneh', 'Mane', 'Bâ', 'Sakho', 'Niang',
)

class Command(BaseCommand):
    help = "Insère des données de démo (>20 par rubrique)."

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Exécuter même si des données existent.')
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Supprimer toutes les données démo (agents, visites, AT, etc.) puis réinsérer. Utile pour enlever les anciennes données.',
        )

    def _safe_delete(self, model, label):
        """Supprime les enregistrements d'un modèle. Ignore si la table n'existe pas (ex. audit)."""
        if model is None:
            return
        try:
            n, _ = model.objects.all().delete()
            if n:
                self.stdout.write(f'  Supprimé {label}: {n} enregistrement(s).')
        except db_utils.ProgrammingError as e:
            err = str(e)
            if '1146' in err or "doesn't exist" in err.lower():
                self.stdout.write(self.style.WARNING(f'  Ignoré {label} (table absente).'))
            else:
                raise

    def _flush_demo_data(self):
        """Supprime les données démo dans l'ordre des dépendances (FK)."""
        models_order = [
            (ArticleRecipient, 'Destinataires articles'),
            (EducationalArticle, 'Articles éducatifs'),
            (TrainingRequirement, 'Habilitations'),
            (Training, 'Formations'),
            (IndividualRiskSheet, 'Fiches individuelles risques'),
            (IndividualExposureSheet, 'Fiches individuelles exposition'),
            (RiskWorkAccidentLink, 'Liens risque–AT'),
            (RiskOccupationalDiseaseLink, 'Liens risque–MP'),
            (PreventiveAction, 'Actions préventives'),
            (Risk, 'Risques'),
            (VaccinationAlert, 'Alertes vaccination'),
            (VaccineContraindication, 'Contre-indications'),
            (VaccineRequirement, 'Exigences vaccins'),
            (MedicalSurveillance, 'Surveillances médicales'),
            (Vaccination, 'Vaccinations'),
            (WorkAccident, 'Accidents de travail'),
            (OccupationalDisease, 'Maladies professionnelles'),
            (VisitConvocation, 'Convocations'),
            (MedicalVisit, 'Visites médicales'),
            (AgentPathology, 'Pathologies agents'),
            (DMSTHistory, 'Historiques DMST'),
            (DMST, 'Dossiers médicaux'),
            (MedicalDataAccess, 'Accès données médicales'),
            (AuditLog, 'Journal d\'audit'),
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
        for model, label in models_order:
            self._safe_delete(model, label)

    def handle(self, *args, **options):
        if options.get('flush'):
            from django.core.management import call_command
            self.stdout.write('Application des migrations (audit, etc.) si nécessaire...')
            call_command('migrate', '--no-input')
            self.stdout.write('Suppression des anciennes données...')
            self._flush_demo_data()
            self.stdout.write(self.style.SUCCESS('Anciennes données supprimées.\n'))

        # Créer ou récupérer le compte démo (demo / demo1234) pour partage facile
        demo_user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'first_name': 'Démo',
                'last_name': 'Utilisateur',
                'email': 'demo@example.com',
                'is_superuser': True,
                'is_staff': True,
                'role': 'super_admin',
            },
        )
        if created:
            demo_user.set_password('demo1234')
            demo_user.save()
            self.stdout.write(self.style.SUCCESS('Compte démo créé : demo / demo1234'))
        else:
            demo_user.set_password('demo1234')
            demo_user.save(update_fields=['password'])
            self.stdout.write(self.style.SUCCESS('Compte démo mis à jour : demo / demo1234'))

        user = User.objects.filter(is_superuser=True).first()
        if not user:
            user = demo_user

        today = timezone.now().date()
        today_dt = timezone.now()

        # --- Structures : entreprises sénégalaises ---
        self.stdout.write('Structures (companies, sites, services, postes)...')
        ENTREPRISES = [
            ('Sonatel SA', '12345678901234', '10 boulevard de la République, Dakar Plateau', '33 839 00 00', 'contact@sonatel.sn'),
            ('Port Autonome de Dakar', '98765432109876', 'Quai des Jument, Dakar', '33 849 55 55', 'contact@pad.sn'),
            ('Industries Chimiques du Sénégal', '45678912345678', 'Zone industrielle de Mbao, Dakar', '33 859 12 34', 'contact@ics.sn'),
            ('Sénégal Solutions & Services', '32165498703210', 'Avenue Léopold Sédar Senghor, Almadies, Dakar', '33 860 99 00', 'contact@senegalsolutions.sn'),
        ]
        companies = []
        for i, (name, siret, address, phone, email) in enumerate(ENTREPRISES, 1):
            c, _ = Company.objects.get_or_create(
                siret=siret,
                defaults={'name': name, 'address': address, 'phone': phone, 'email': email}
            )
            companies.append(c)

        sites, services, jobs = [], [], []
        lieux_sn = ['Dakar Plateau', 'Thiaroye', 'Pikine', 'Rufisque', 'Mbao', 'Sicap Liberté']
        for co in companies:
            short = co.name.split()[0][:8]  # Sonatel, Port, Industr, Sénégal
            off = sum(ord(x) for x in co.name) % len(lieux_sn)
            for i in range(1, 4):
                lieu = lieux_sn[(off + i) % len(lieux_sn)]
                s, _ = Site.objects.get_or_create(
                    company=co, name=f'Site {short} {lieu}',
                    defaults={'address': f'Zone {lieu}, Dakar'}
                )
                sites.append(s)
            for i in range(1, 5):
                svc, _ = Service.objects.get_or_create(company=co, name=f'Service {short} {i}', defaults={})
                services.append(svc)
            for i, name in enumerate(['Opérateur', 'Technicien', 'Agent administratif', 'Chef d\'équipe', 'Ingénieur'], 1):
                j, _ = JobPosition.objects.get_or_create(company=co, name=name, defaults={'code': f'JP{i}'})
                jobs.append(j)

        # --- Agents (25+) ---
        self.stdout.write('Agents...')
        base_date = today - timedelta(days=365 * 5)
        agents = []
        for i in range(N):
            mat = f'EMP{2020 + (i % 5)}{i:04d}'
            if Agent.objects.filter(matricule=mat).exists():
                continue
            co = random.choice(companies)
            ag = Agent.objects.create(
                matricule=mat,
                first_name=random.choice(PRENOMS),
                last_name=random.choice(NOMS),
                date_of_birth=base_date - timedelta(days=365 * (25 + i % 25)),
                gender=random.choice(['M', 'F']),
                email=f'agent{i}@example.sn',
                company=co,
                site=random.choice([None] + [s for s in sites if s.company_id == co.id]),
                service=random.choice([None] + [s for s in services if s.company_id == co.id]),
                job_position=random.choice([None] + [j for j in jobs if j.company_id == co.id]),
                hire_date=base_date + timedelta(days=30 * i),
                is_active=True,
                is_archived=False,
                created_by=user,
                updated_by=user,
            )
            agents.append(ag)
        agents = list(Agent.objects.filter(is_active=True, is_archived=False))[: N * 2]
        if len(agents) < 5:
            self.stdout.write(self.style.WARNING('Pas assez d’agents. Création supplémentaire...'))
            for i in range(max(0, 20 - len(agents))):
                mat = f'SEED{i + 1000:05d}'
                if Agent.objects.filter(matricule=mat).exists():
                    continue
                co = random.choice(companies)
                ag = Agent.objects.create(
                    matricule=mat,
                    first_name=random.choice(PRENOMS),
                    last_name=random.choice(NOMS),
                    date_of_birth=base_date - timedelta(days=365 * 30),
                    gender=random.choice(['M', 'F']),
                    company=co,
                    hire_date=base_date,
                    is_active=True,
                    is_archived=False,
                    created_by=user,
                    updated_by=user,
                )
                agents.append(ag)
        agents = list(Agent.objects.filter(is_active=True, is_archived=False))[: N + 10]
        if not agents:
            self.stdout.write(self.style.WARNING('Aucun agent actif. Vérifiez les structures (companies, etc.) puis relancez.'))
            return

        # --- Types de visite ---
        self.stdout.write('Types de visite...')
        vtypes = []
        for name, code in [('Visite d\'embauche', 'EMB'), ('Visite périodique', 'PER'), ('Reprise après arrêt', 'REP'), ('Visite de préreprise', 'PRE')]:
            vt, _ = VisitType.objects.get_or_create(code=code, defaults={'name': name})
            vtypes.append(vt)

        # --- Visites médicales (25+) ---
        self.stdout.write('Visites médicales...')
        existant = MedicalVisit.objects.count()
        if existant < N or options.get('force'):
            for i, ag in enumerate(agents[:N]):
                sd = today_dt - timedelta(days=30 * (N - i) + random.randint(0, 20))
                status = random.choice(['scheduled', 'completed', 'completed', 'completed', 'absent'])
                MedicalVisit.objects.get_or_create(
                    agent=ag,
                    visit_type=random.choice(vtypes),
                    scheduled_date=sd,
                    defaults={
                        'status': status,
                        'actual_date': sd if status == 'completed' else None,
                        'reason': 'Contrôle périodique',
                        'avis': random.choice(['apte', 'apte_avec_reserves', 'inapte_temporaire']) if status == 'completed' else None,
                        'created_by': user,
                        'doctor': user,
                    }
                )

        # --- Accidents de travail (25+) ---
        self.stdout.write('Accidents de travail...')
        existant = WorkAccident.objects.count()
        if existant < N or options.get('force'):
            for i, ag in enumerate(agents[:N]):
                ad = today_dt - timedelta(days=60 * (N - i) + random.randint(0, 30))
                WorkAccident.objects.create(
                    agent=ag,
                    accident_type=random.choice(['work', 'work', 'commute', 'service', 'mission']),
                    accident_date=ad,
                    location='Atelier' if i % 2 else 'Bureau',
                    mechanism='Chute / glissade',
                    description='Description détaillée de l\'accident.',
                    severity=random.choice(['light', 'light', 'moderate', 'severe']),
                    status=random.choice(['declared', 'investigating', 'closed']),
                    work_stoppage=random.choice([True, False, False]),
                    work_stoppage_days=random.randint(0, 30) if random.random() > 0.6 else None,
                    medical_care=random.choice([True, False]),
                    hospitalization=False,
                    declared_by=user,
                )

        # --- Maladies professionnelles (20+) ---
        self.stdout.write('Maladies professionnelles...')
        mps = ['Troubles musculosquelettiques', 'Surdité', 'Dermatose', 'Asthme', 'Stress']
        existant = OccupationalDisease.objects.count()
        if existant < 20 or options.get('force'):
            for i in range(max(20, len(agents))):
                ag = agents[i % len(agents)]
                fd = today - timedelta(days=180 * (i % 5) + random.randint(0, 90))
                OccupationalDisease.objects.create(
                    agent=ag,
                    disease_type=random.choice(['mp', 'mcp', 'ms']),
                    disease_name=random.choice(mps),
                    table_number=random.randint(1, 100) if i % 3 else None,
                    first_symptoms_date=fd,
                    diagnosis_date=fd + timedelta(days=30),
                    status=random.choice(['declared', 'recognized', 'rejected']),
                    exposure_start_date=fd - timedelta(days=365) if i % 2 else None,
                    exposure_end_date=fd - timedelta(days=30) if i % 2 else None,
                    declared_by=user,
                )

        # --- Vaccins & Vaccinations (25+) ---
        self.stdout.write('Vaccination...')
        vax_ref = []
        for name, code, months in [('DTP', 'DTP', 120), ('Hépatite B', 'HEP B', 60), ('Grippe', 'GRIP', 12), ('Covid-19', 'COVID', 12), ('ROR', 'ROR', None)]:
            v, _ = Vaccine.objects.get_or_create(name=name, defaults={'code': code, 'validity_period_months': months})
            vax_ref.append(v)
        existant = Vaccination.objects.count()
        if existant < N or options.get('force'):
            for i, ag in enumerate(agents[:N]):
                vx = random.choice(vax_ref)
                vd = today - timedelta(days=90 * (i % 6) + random.randint(0, 60))
                nd = (vd + timedelta(days=(vx.validity_period_months or 12) * 30)) if vx.validity_period_months else None
                Vaccination.objects.get_or_create(
                    agent=ag,
                    vaccine=vx,
                    vaccination_date=vd,
                    defaults={'batch_number': f'LOT{1000 + i}', 'next_due_date': nd, 'administered_by': user}
                )
        existant = MedicalSurveillance.objects.count()
        if existant < N or options.get('force'):
            for i, ag in enumerate(agents[:N]):
                sd = today - timedelta(days=200 * (i % 4) + random.randint(0, 100))
                MedicalSurveillance.objects.create(
                    agent=ag,
                    surveillance_type=random.choice(['quinquennial', 'specific', 'chronic']),
                    start_date=sd,
                    next_review_date=sd + timedelta(days=365 * 2),
                    reason='Contrôle régulier',
                    is_active=True,
                    prescribed_by=user,
                )

        # --- Prévention: catégories, risques, actions, FIE, FIR (25+) ---
        self.stdout.write('Prévention...')
        rc_ref = []
        for name, code, ctype in [
            ('Physique', 'PHY', 'physical'), ('Biologique', 'BIO', 'biological'), ('Chimique', 'CHI', 'chemical'),
            ('Psychosocial', 'PSY', 'psychosocial'), ('Ergonomique', 'ERG', 'ergonomic'),
        ]:
            r, _ = RiskCategory.objects.get_or_create(name=name, defaults={'code': code, 'category_type': ctype})
            rc_ref.append(r)
        risks_created = []
        existant = Risk.objects.count()
        if existant < N or options.get('force'):
            for i in range(N):
                co = random.choice(companies)
                r = Risk.objects.create(
                    company=co,
                    site=random.choice([None] + [s for s in sites if s.company_id == co.id]),
                    service=random.choice([None] + [s for s in services if s.company_id == co.id]),
                    job_position=random.choice([None] + [j for j in jobs if j.company_id == co.id]),
                    category=random.choice(rc_ref),
                    name=f'Risque {["bruit", "charge", "chimique", "TMS", "stress"][i % 5]} #{i}',
                    description='Description du risque.',
                    severity=random.choice(['low', 'medium', 'high', 'critical']),
                    probability=random.choice(['low', 'medium', 'high']),
                    identification_date=today - timedelta(days=100 + i * 10),
                    is_active=True,
                    identified_by=user,
                )
                risks_created.append(r)
        risks_created = list(Risk.objects.filter(is_active=True))[: N + 10]
        for r in risks_created[: N]:
            actions_count = PreventiveAction.objects.filter(risk=r).count()
            if actions_count >= 2:
                continue
            pd = today - timedelta(days=50 + random.randint(0, 30))
            PreventiveAction.objects.create(
                risk=r,
                action_type=random.choice(['preventive', 'corrective']),
                title=f'Action {r.name[:20]}',
                description='Action préventive ou corrective.',
                planned_date=pd,
                due_date=pd + timedelta(days=30),
                status=random.choice(['planned', 'in_progress', 'completed', 'completed']),
                responsible=user,
                created_by=user,
            )
        for ag in agents[:N]:
            if IndividualExposureSheet.objects.filter(agent=ag).exists():
                continue
            fie = IndividualExposureSheet.objects.create(agent=ag, exposure_period='2020-01 / présent', created_by=user)
            if risks_created:
                fie.exposed_risks.set(random.sample(risks_created, min(3, len(risks_created))))
            if not IndividualRiskSheet.objects.filter(agent=ag).exists():
                IndividualRiskSheet.objects.create(
                    agent=ag,
                    risks_description='Risques liés au poste.',
                    preventive_measures='Port des EPI, formation.',
                    created_by=user,
                )

        # --- Formation: types, formations, articles (25+) ---
        self.stdout.write('Formation...')
        tt_ref = []
        for name, code, months in [('SST', 'SST', 24), ('Incendie', 'INC', 12), ('EPI', 'EPI', 24), ('Hygiène', 'HYG', 12), ('Habilitation électrique', 'HEL', 36)]:
            t, _ = TrainingType.objects.get_or_create(name=name, defaults={'code': code, 'validity_period_months': months})
            tt_ref.append(t)
        existant = Training.objects.count()
        if existant < N or options.get('force'):
            for i, ag in enumerate(agents[:N]):
                tt = random.choice(tt_ref)
                sd = today - timedelta(days=120 * (i % 5) + random.randint(0, 60))
                ed = sd + timedelta(days=2)
                nd = (ed + timedelta(days=(tt.validity_period_months or 12) * 30)) if tt.validity_period_months else None
                Training.objects.create(
                    training_type=tt,
                    agent=ag,
                    start_date=sd,
                    end_date=ed,
                    next_due_date=nd,
                    status=random.choice(['planned', 'in_progress', 'completed', 'completed', 'completed']),
                    training_organization='Centre de formation SST Dakar',
                    trainer_name='Formateur agréé SST',
                    result='Réussi',
                    certificate_number=f'CERT-{ag.matricule}-{i}',
                    created_by=user,
                )
        existant = EducationalArticle.objects.count()
        if existant < N or options.get('force'):
            themes = ['Gestes et postures', 'Risques chimiques', 'Évacuation', 'Premiers secours', 'Santé au travail']
            for i in range(N):
                EducationalArticle.objects.create(
                    title=f'Article {themes[i % 5]} #{i}',
                    content='Contenu de l\'article d\'éducation sanitaire. Bonnes pratiques et recommandations.',
                    theme=themes[i % 5],
                    target_audience=random.choice(['all', 'all', 'category', 'surveillance']),
                    is_published=random.choice([True, True, False]),
                    published_date=today_dt - timedelta(days=i * 5) if random.random() > 0.3 else None,
                    author=user,
                )

        # --- Pathologies (référentiel) ---
        self.stdout.write('Pathologies (référentiel)...')
        for code, name in [('J00', 'Rhinopharyngite'), ('M54', 'Dorsalgie'), ('F32', 'Épisode dépressif'), ('J45', 'Asthme'), ('H90', 'Surdité')]:
            Pathology.objects.get_or_create(code=code, defaults={'name': name})

        # --- Résumé ---
        self.stdout.write(self.style.SUCCESS('Données insérées.'))
        self.stdout.write(f'  Agents: {Agent.objects.count()} | Visites: {MedicalVisit.objects.count()} | AT: {WorkAccident.objects.count()} | MP: {OccupationalDisease.objects.count()}')
        self.stdout.write(f'  Vaccinations: {Vaccination.objects.count()} | Surveillances: {MedicalSurveillance.objects.count()}')
        self.stdout.write(f'  Risques: {Risk.objects.count()} | Actions: {PreventiveAction.objects.count()} | FIE: {IndividualExposureSheet.objects.count()} | FIR: {IndividualRiskSheet.objects.count()}')
        self.stdout.write(f'  Formations: {Training.objects.count()} | Articles: {EducationalArticle.objects.count()}')
