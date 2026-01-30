"""
Script de test pour diagnostiquer le problème de login
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

from accounts.models import User
from django.contrib.auth import authenticate

print("="*60)
print("DIAGNOSTIC DU PROBLÈME DE LOGIN")
print("="*60)

# Vérifier les utilisateurs
print("\n1. Vérification des utilisateurs...")
users = User.objects.all()
print(f"Nombre d'utilisateurs: {users.count()}")

if users.count() == 0:
    print("⚠ Aucun utilisateur trouvé. Créez-en un avec:")
    print("   python manage.py createsuperuser")
else:
    print("\nUtilisateurs existants:")
    for user in users:
        print(f"  - {user.username} (role: {user.role if hasattr(user, 'role') else 'NON DÉFINI'})")
        # Vérifier si le rôle est défini
        if not hasattr(user, 'role') or not user.role:
            print(f"    ⚠ ATTENTION: L'utilisateur {user.username} n'a pas de rôle défini!")

# Vérifier le modèle User
print("\n2. Vérification du modèle User...")
try:
    user_fields = [f.name for f in User._meta.get_fields()]
    if 'role' in user_fields:
        print("✓ Le champ 'role' existe dans le modèle User")
    else:
        print("✗ Le champ 'role' n'existe pas dans le modèle User")
        print("  Exécutez: python manage.py makemigrations")
        print("  Puis: python manage.py migrate")
except Exception as e:
    print(f"✗ Erreur: {e}")

# Tester l'authentification
print("\n3. Test d'authentification...")
if users.count() > 0:
    test_user = users.first()
    print(f"Test avec l'utilisateur: {test_user.username}")
    
    # Demander le mot de passe pour tester
    import getpass
    password = getpass.getpass(f"Entrez le mot de passe pour {test_user.username} (ou appuyez sur Entrée pour ignorer): ")
    
    if password:
        user = authenticate(username=test_user.username, password=password)
        if user:
            print("✓ Authentification réussie")
        else:
            print("✗ Authentification échouée - mot de passe incorrect")
    else:
        print("  (Test ignoré)")
else:
    print("  (Aucun utilisateur à tester)")

# Vérifier les migrations
print("\n4. Vérification des migrations...")
from django.core.management import call_command
from io import StringIO

out = StringIO()
try:
    call_command('showmigrations', 'accounts', stdout=out)
    migrations = out.getvalue()
    unapplied = [line for line in migrations.split('\n') if '[ ]' in line and 'accounts' in line]
    if unapplied:
        print(f"⚠ {len(unapplied)} migration(s) non appliquée(s) pour accounts")
        print("   Exécutez: python manage.py migrate accounts")
    else:
        print("✓ Toutes les migrations accounts sont appliquées")
except Exception as e:
    print(f"✗ Erreur: {e}")

print("\n" + "="*60)
print("DIAGNOSTIC TERMINÉ")
print("="*60)
