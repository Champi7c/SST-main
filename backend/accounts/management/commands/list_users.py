"""
Commande Django pour lister tous les utilisateurs
Usage: python manage.py list_users
"""
from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Affiche la liste de tous les utilisateurs du système'

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("LISTE DE TOUS LES UTILISATEURS"))
        self.stdout.write("=" * 80)
        self.stdout.write("")

        users = User.objects.all().order_by('last_name', 'first_name')

        if not users.exists():
            self.stdout.write(self.style.WARNING("Aucun utilisateur trouvé dans la base de données."))
            self.stdout.write("Créez un super utilisateur avec: python manage.py createsuperuser")
        else:
            self.stdout.write(f"Nombre total d'utilisateurs: {users.count()}\n")
            self.stdout.write(f"{'ID':<5} {'Nom d\'utilisateur':<20} {'Nom':<20} {'Prénom':<20} {'Email':<30} {'Rôle':<20} {'Actif':<10}")
            self.stdout.write("-" * 130)
            
            for user in users:
                role_display = user.get_role_display()
                active = "Oui" if user.is_active else "Non"
                self.stdout.write(f"{user.id:<5} {user.username:<20} {user.last_name or '-':<20} {user.first_name or '-':<20} {user.email or '-':<30} {role_display:<20} {active:<10}")
            
            self.stdout.write("\n" + "=" * 80)
            self.stdout.write("\nRÔLES DISPONIBLES DANS LE SYSTÈME:")
            self.stdout.write("-" * 80)
            roles = User.ROLE_CHOICES
            for role_code, role_name in roles:
                count = User.objects.filter(role=role_code).count()
                self.stdout.write(f"  • {role_name} ({role_code}): {count} utilisateur(s)")
