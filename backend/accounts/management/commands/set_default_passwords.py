"""
Commande Django pour définir des mots de passe par défaut pour tous les utilisateurs
Usage: python manage.py set_default_passwords --password DEFAULT_PASSWORD
⚠️ ATTENTION: À utiliser uniquement en développement/test
"""
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User
import getpass


class Command(BaseCommand):
    help = 'Définit un mot de passe par défaut pour tous les utilisateurs (DÉVELOPPEMENT UNIQUEMENT)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            help='Mot de passe par défaut à définir',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmer l\'opération (requis pour exécuter)',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  ATTENTION: Cette commande va définir le même mot de passe pour TOUS les utilisateurs!'
                )
            )
            self.stdout.write(
                'Cette commande est destinée uniquement à l\'environnement de développement/test.'
            )
            self.stdout.write(
                'Utilisez --confirm pour confirmer cette opération.'
            )
            return

        # Obtenir le mot de passe
        if options['password']:
            default_password = options['password']
        else:
            default_password = getpass.getpass('Entrez le mot de passe par défaut: ')
            default_password_confirm = getpass.getpass('Confirmez le mot de passe: ')
            
            if default_password != default_password_confirm:
                raise CommandError("Les mots de passe ne correspondent pas.")

        if len(default_password) < 8:
            raise CommandError("Le mot de passe doit contenir au moins 8 caractères.")

        # Mettre à jour tous les utilisateurs
        users = User.objects.all()
        count = 0
        
        for user in users:
            user.set_password(default_password)
            user.save()
            count += 1
            self.stdout.write(f"✓ Mot de passe défini pour: {user.username} ({user.get_full_name()})")

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Mot de passe par défaut défini pour {count} utilisateur(s)'
            )
        )
        self.stdout.write(
            self.style.WARNING(
                '⚠️  N\'oubliez pas de changer ces mots de passe en production!'
            )
        )
