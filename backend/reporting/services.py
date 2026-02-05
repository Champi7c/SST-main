"""
Services reporting : agrégation des indicateurs, préparation des exports.
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q

from medical.models import Agent
from visits.models import MedicalVisit
from accidents.models import WorkAccident, OccupationalDisease
from vaccination.models import Vaccination, MedicalSurveillance, VaccinationAlert
from training.models import Training
from companies.models import Company, Site, Service


def _filters_for_agents(company_id, site_id, service_id):
    f = {}
    if company_id:
        f['company_id'] = company_id
    if site_id:
        f['site_id'] = site_id
    if service_id:
        f['service_id'] = service_id
    return f


def _filters_for_related(company_id, site_id, service_id, prefix='agent__'):
    f = {}
    if company_id:
        f[f'{prefix}company_id'] = company_id
    if site_id:
        f[f'{prefix}site_id'] = site_id
    if service_id:
        f[f'{prefix}service_id'] = service_id
    return f


def build_dashboard_stats(company_id=None, site_id=None, service_id=None,
                          start_date=None, end_date=None):
    """
    Construit les stats du tableau de bord (période, filtres structure).
    Retourne un dict prêt pour l’API et les exports.
    """
    use_period = start_date is not None and end_date is not None
    if use_period:
        if not end_date:
            end_date = timezone.now().date()
        if not start_date:
            start_date = end_date - timedelta(days=30)
    else:
        start_date = end_date = None

    fa = _filters_for_agents(company_id, site_id, service_id)
    fr = _filters_for_related(company_id, site_id, service_id)

    agents_qs = Agent.objects.filter(**fa, is_active=True)
    total_agents = agents_qs.count()

    visit_filters = {**fr}
    visits_qs = MedicalVisit.objects.filter(**visit_filters)
    if use_period:
        visits_qs = visits_qs.filter(scheduled_date__date__range=[start_date, end_date])
    total_visits = visits_qs.count()
    completed_visits = visits_qs.filter(status='completed').count()
    scheduled_visits = visits_qs.filter(status='scheduled').count()
    absent_visits = visits_qs.filter(status='absent').count()
    agents_seen = visits_qs.filter(status='completed').values('agent').distinct().count()
    visit_completion_rate = (completed_visits / total_visits * 100) if total_visits > 0 else 0

    acc_filters = {k: v for k, v in fr.items() if 'company' in k or 'site' in k}
    accidents_qs = WorkAccident.objects.filter(**acc_filters)
    if use_period:
        accidents_qs = accidents_qs.filter(accident_date__date__range=[start_date, end_date])
    total_accidents = accidents_qs.count()
    work_stoppages = accidents_qs.filter(work_stoppage=True).count()

    # Nombre d'entreprises (au lieu d'agents sous surveillance)
    company_filters = {}
    if company_id:
        company_filters['pk'] = company_id
    total_companies = Company.objects.filter(**company_filters).count()
    agents_under_surveillance = total_companies  # Utilisé pour le nombre d'entreprises dans le dashboard

    # Alertes vaccination (agrégats uniquement)
    alert_filters = {k: v for k, v in fr.items() if 'company' in k}
    vaccination_alerts_due_soon = VaccinationAlert.objects.filter(
        **alert_filters, alert_type='due_soon', acknowledged=False
    ).count()
    vaccination_alerts_overdue = VaccinationAlert.objects.filter(
        **alert_filters, alert_type='overdue', acknowledged=False
    ).count()

    # Formations à jour : status=completed et (next_due_date >= today ou next_due_date null)
    today = timezone.now().date()
    training_filters = {**fr}
    trainings_valid = Training.objects.filter(
        **training_filters,
        status='completed',
    ).filter(
        Q(next_due_date__gte=today) | Q(next_due_date__isnull=True)
    ).count()
    trainings_expired = Training.objects.filter(
        **training_filters,
        status='completed',
        next_due_date__lt=today,
    ).count()

    fsites = {}
    if company_id:
        fsites['company_id'] = company_id
    if site_id:
        fsites['pk'] = site_id
    if use_period:
        sites_distribution = list(
            Site.objects.filter(**fsites).annotate(
                agents_count=Count('agents', filter=Q(agents__is_active=True)),
                visits_count=Count(
                    'agents__visits',
                    filter=Q(agents__visits__scheduled_date__date__range=[start_date, end_date]),
                ),
                accidents_count=Count(
                    'agents__accidents',
                    filter=Q(agents__accidents__accident_date__date__range=[start_date, end_date]),
                ),
            ).values('id', 'name', 'agents_count', 'visits_count', 'accidents_count')
        )
    else:
        sites_distribution = list(
            Site.objects.filter(**fsites).annotate(
                agents_count=Count('agents', filter=Q(agents__is_active=True)),
                visits_count=Count('agents__visits'),
                accidents_count=Count('agents__accidents'),
            ).values('id', 'name', 'agents_count', 'visits_count', 'accidents_count')
        )

    fservices = {}
    if company_id:
        fservices['company_id'] = company_id
    if site_id:
        fservices['site_id'] = site_id
    if service_id:
        fservices['pk'] = service_id
    if use_period:
        services_distribution = list(
            Service.objects.filter(**fservices).annotate(
                agents_count=Count('agents', filter=Q(agents__is_active=True)),
                visits_count=Count(
                    'agents__visits',
                    filter=Q(agents__visits__scheduled_date__date__range=[start_date, end_date]),
                ),
            ).values('id', 'name', 'agents_count', 'visits_count')
        )
    else:
        services_distribution = list(
            Service.objects.filter(**fservices).annotate(
                agents_count=Count('agents', filter=Q(agents__is_active=True)),
                visits_count=Count('agents__visits'),
            ).values('id', 'name', 'agents_count', 'visits_count')
        )

    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'stats': {
            'total_agents': total_agents,
            'total_visits': total_visits,
            'completed_visits': completed_visits,
            'scheduled_visits': scheduled_visits,
            'absent_visits': absent_visits,
            'agents_seen': agents_seen,
            'visit_completion_rate': round(visit_completion_rate, 2),
            'total_accidents': total_accidents,
            'work_stoppages': work_stoppages,
            'agents_under_surveillance': agents_under_surveillance,
            'vaccination_alerts_due_soon': vaccination_alerts_due_soon,
            'vaccination_alerts_overdue': vaccination_alerts_overdue,
            'trainings_valid': trainings_valid,
            'trainings_expired': trainings_expired,
        },
        'distribution': {
            'by_site': sites_distribution,
            'by_service': services_distribution,
        },
    }
