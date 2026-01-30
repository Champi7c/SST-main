"""
Commande : python manage.py compute_vaccination_alerts [--days=30] [--no-replace]
Recalcule les alertes vaccination (à échéance / en retard). À planifier (cron, Celery).
Exige que les migrations vaccination soient appliquées (python manage.py migrate).
"""
from django.core.management.base import BaseCommand
from django.db import ProgrammingError


class Command(BaseCommand):
    help = "Calcule les alertes vaccination (à échéance / en retard)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Seuil J pour « à échéance » (défaut 30).',
        )
        parser.add_argument(
            '--no-replace',
            action='store_true',
            help='Ne pas supprimer les alertes existantes avant recalcul.',
        )

    def handle(self, *args, **options):
        try:
            from vaccination.services import compute_vaccination_alerts

            n = compute_vaccination_alerts(
                due_soon_days=options['days'],
                replace_existing=not options['no_replace'],
            )
            self.stdout.write(self.style.SUCCESS(f"Alertes créées ou déjà présentes : {n}"))
        except ProgrammingError as e:
            if "doesn't exist" in str(e) or "does not exist" in str(e).lower():
                self.stdout.write(
                    self.style.ERROR(
                        "Les tables vaccination (ex. vaccination_vaccinationalert) sont absentes. "
                        "Appliquez d'abord les migrations : python manage.py migrate"
                    )
                )
            else:
                raise
