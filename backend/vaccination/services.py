"""
Logique métier vaccination : statut à jour/retard, calcul des alertes.
"""
from datetime import timedelta
from django.utils import timezone

from .models import Vaccination, VaccinationAlert, VaccineContraindication, Vaccine


def vaccination_status(agent, vaccine):
    """
    Statut vaccinal pour (agent, vaccine) : 'up_to_date' | 'overdue' | 'contraindicated' | 'not_vaccinated'.
    """
    if VaccineContraindication.objects.filter(agent=agent, vaccine=vaccine).exists():
        return 'contraindicated'
    latest = (
        Vaccination.objects.filter(agent=agent, vaccine=vaccine)
        .order_by('-vaccination_date')
        .first()
    )
    if not latest:
        return 'not_vaccinated'
    if not latest.next_due_date:
        return 'up_to_date'
    if latest.next_due_date >= timezone.now().date():
        return 'up_to_date'
    return 'overdue'


def compute_vaccination_alerts(*, due_soon_days=30, replace_existing=True):
    """
    Calcule les alertes vaccination (à échéance / en retard).
    - due_soon_days : seuil J pour « à échéance ».
    - replace_existing : si True, supprime les alertes existantes et recrée.
    """
    today = timezone.now().date()
    due_soon_end = today + timedelta(days=due_soon_days)

    if replace_existing:
        VaccinationAlert.objects.all().delete()

    alerts_created = 0
    seen = set()  # (agent_id, vaccine_id) — on ne traite que la dernière vaccination par couple

    qs = (
        Vaccination.objects.filter(next_due_date__isnull=False)
        .select_related('agent', 'vaccine')
        .order_by('agent', 'vaccine', '-vaccination_date')
    )
    for v in qs:
        key = (v.agent_id, v.vaccine_id)
        if key in seen:
            continue
        seen.add(key)
        if VaccineContraindication.objects.filter(agent=v.agent, vaccine=v.vaccine).exists():
            continue
        due = v.next_due_date
        if due < today:
            alert_type = 'overdue'
        elif due <= due_soon_end:
            alert_type = 'due_soon'
        else:
            continue
        _, created = VaccinationAlert.objects.get_or_create(
            agent=v.agent,
            vaccine=v.vaccine,
            alert_type=alert_type,
            defaults={'due_date': due},
        )
        if created:
            alerts_created += 1

    return alerts_created
