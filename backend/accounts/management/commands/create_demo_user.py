"""
Crée le compte démo (demo / demo1234) pour accès facile au projet partagé.
Usage: python manage.py create_demo_user
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Crée le compte démo (demo / demo1234)."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
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
        user.set_password('demo1234')
        user.save()
        if created:
            self.stdout.write(self.style.SUCCESS('Compte démo créé : demo / demo1234'))
        else:
            self.stdout.write(self.style.SUCCESS('Mot de passe démo réinitialisé : demo / demo1234'))
