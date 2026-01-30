"""
Commande Django pour réinitialiser le mot de passe d'un utilisateur
Usage: python manage.py reset_user_password <username> [--new-password PASSWORD]
"""
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import getpass


class Command(BaseCommand):
    help = 'Réinitialise le mot de passe d\'un utilisateur'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Nom d\'utilisateur')
        parser.add_argument(
            '--new-password',
            type=str,
            help='Nouveau mot de passe (optionnel, sera demandé si non fourni)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force la réinitialisation sans validation du mot de passe',
        )

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"L'utilisateur '{username}' n'existe pas.")

        self.stdout.write(f"Utilisateur trouvé: {user.get_full_name()} ({user.email})")
        self.stdout.write(f"Rôle: {user.get_role_display()}")

        # Obtenir le nouveau mot de passe
        if options['new_password']:
            new_password = options['new_password']
        else:
            new_password = getpass.getpass('Entrez le nouveau mot de passe: ')
            new_password_confirm = getpass.getpass('Confirmez le nouveau mot de passe: ')
            
            if new_password != new_password_confirm:
                raise CommandError("Les mots de passe ne correspondent pas.")

        # Valider le mot de passe (sauf si --force)
        if not options['force']:
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                raise CommandError(f"Mot de passe invalide: {', '.join(e.messages)}")

        # Définir le nouveau mot de passe
        user.set_password(new_password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Mot de passe réinitialisé avec succès pour l\'utilisateur "{username}"'
            )
        )
