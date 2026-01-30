"""
Script pour lister tous les utilisateurs du système
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

from accounts.models import User

print("=" * 80)
print("LISTE DE TOUS LES UTILISATEURS")
print("=" * 80)
print()

users = User.objects.all().order_by('last_name', 'first_name')

if not users.exists():
    print("Aucun utilisateur trouvé dans la base de données.")
    print("Créez un super utilisateur avec: python manage.py createsuperuser")
else:
    print(f"Nombre total d'utilisateurs: {users.count()}\n")
    print(f"{'ID':<5} {'Nom d\'utilisateur':<20} {'Nom':<20} {'Prénom':<20} {'Email':<30} {'Rôle':<20} {'Actif':<10}")
    print("-" * 130)
    
    for user in users:
        role_display = user.get_role_display()
        active = "Oui" if user.is_active else "Non"
        print(f"{user.id:<5} {user.username:<20} {user.last_name or '-':<20} {user.first_name or '-':<20} {user.email or '-':<30} {role_display:<20} {active:<10}")
    
    print("\n" + "=" * 80)
    print("\nRÔLES DISPONIBLES DANS LE SYSTÈME:")
    print("-" * 80)
    roles = User.ROLE_CHOICES
    for role_code, role_name in roles:
        count = User.objects.filter(role=role_code).count()
        print(f"  • {role_name} ({role_code}): {count} utilisateur(s)")
