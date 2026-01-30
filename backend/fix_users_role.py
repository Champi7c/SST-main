"""
Script pour corriger les utilisateurs sans rôle
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

from accounts.models import User

print("="*60)
print("CORRECTION DES RÔLES UTILISATEURS")
print("="*60)

users = User.objects.all()
updated = 0

for user in users:
    # Vérifier si l'utilisateur a un rôle
    if not hasattr(user, 'role') or not user.role:
        # Si c'est un superuser, lui donner le rôle super_admin
        if user.is_superuser:
            user.role = 'super_admin'
            user.save()
            print(f"✓ {user.username} -> super_admin (superuser)")
            updated += 1
        else:
            # Sinon, lui donner le rôle admin par défaut
            user.role = 'admin'
            user.save()
            print(f"✓ {user.username} -> admin (par défaut)")
            updated += 1
    else:
        print(f"  {user.username} -> {user.role} (déjà défini)")

print(f"\n✓ {updated} utilisateur(s) mis à jour")
print("="*60)
