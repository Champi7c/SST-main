"""
Crée un utilisateur avec un rôle spécifique.
Usage:
  python manage.py create_user --username jean_dupont --first-name "Jean" --last-name "DUPONT" --password "MonMotDePasse123!" --role medecin

Rôles disponibles:
  super_admin  → Super Administrateur
  admin        → Administrateur
  medecin      → Médecin du Travail
  infirmier    → Infirmier SST
  consultant   → Consultant SST
  rh           → Ressources Humaines
  hse          → Responsable HSE
  direction    → Direction Générale
"""
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User

ROLES = {
    'super_admin': 'Super Administrateur',
    'admin': 'Administrateur',
    'medecin': 'Médecin du Travail',
    'infirmier': 'Infirmier SST',
    'consultant': 'Consultant SST',
    'rh': 'Ressources Humaines',
    'hse': 'Responsable HSE',
    'direction': 'Direction Générale',
}


class Command(BaseCommand):
    help = "Crée un utilisateur avec un rôle spécifique."

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Nom d\'utilisateur')
        parser.add_argument('--email', type=str, default='', help='Email (optionnel)')
        parser.add_argument('--password', type=str, help='Mot de passe')
        parser.add_argument('--first-name', type=str, default='', dest='first_name', help='Prénom')
        parser.add_argument('--last-name', type=str, default='', dest='last_name', help='Nom')
        parser.add_argument(
            '--role', type=str, default='admin',
            choices=list(ROLES.keys()),
            help='Rôle : ' + ', '.join(ROLES.keys())
        )

    def handle(self, *args, **options):
        username = options.get('username')
        email = options.get('email') or ''
        password = options.get('password')
        first_name = options.get('first_name') or ''
        last_name = options.get('last_name') or ''
        role = options.get('role')

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

        if role == 'super_admin':
            user = User.objects.create_superuser(
                username=username,
                email=email or f'{username}@example.com',
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
        else:
            user = User.objects.create_user(
                username=username,
                email=email or f'{username}@example.com',
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

        user.role = role
        user.save(update_fields=['role'])

        self.stdout.write(
            self.style.SUCCESS(
                f"Utilisateur créé : {user.username} ({ROLES[role]}). Connectez-vous sur l'API."
            )
        )
