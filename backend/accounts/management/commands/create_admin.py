"""
Crée un nouvel administrateur (superuser) avec le rôle super_admin.
Usage:
  python manage.py create_admin --username admin2 --email admin2@example.com --password "MonMotDePasse123!"
  python manage.py create_admin  # mode interactif
"""
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User


class Command(BaseCommand):
    help = "Crée un nouvel admin (superuser) avec le rôle Super Administrateur."

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Nom d’utilisateur')
        parser.add_argument('--email', type=str, default='', help='Email (optionnel)')
        parser.add_argument('--password', type=str, help='Mot de passe')
        parser.add_argument('--first-name', type=str, default='', dest='first_name', help='Prénom')
        parser.add_argument('--last-name', type=str, default='', dest='last_name', help='Nom')

    def handle(self, *args, **options):
        username = options.get('username')
        email = options.get('email') or ''
        password = options.get('password')
        first_name = options.get('first_name') or ''
        last_name = options.get('last_name') or ''

        if not username:
            username = input('Username: ').strip()
        if not username:
            raise CommandError('Le username est obligatoire.')

        if User.objects.filter(username=username).exists():
            raise CommandError(f"Un utilisateur avec le username '{username}' existe déjà.")

        if not password:
            from getpass import getpass
            password = getpass('Password: ')
            password2 = getpass('Password (again): ')
            if password != password2:
                raise CommandError('Les mots de passe ne correspondent pas.')
        if len(password) < 8:
            raise CommandError('Le mot de passe doit contenir au moins 8 caractères.')

        user = User.objects.create_superuser(
            username=username,
            email=email or f'{username}@example.com',
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user.role = 'super_admin'
        user.save(update_fields=['role'])

        self.stdout.write(
            self.style.SUCCESS(
                f"Admin créé : {user.username} (Super Administrateur). Connectez-vous sur /admin ou l’API."
            )
        )
