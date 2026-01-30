"""
Script de diagnostic pour vérifier la configuration du serveur
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')

try:
    django.setup()
    print("✓ Django configuré avec succès")
except Exception as e:
    print(f"✗ Erreur de configuration Django: {e}")
    sys.exit(1)

from django.conf import settings
from django.db import connection
from django.core.management import execute_from_command_line

print("\n" + "="*60)
print("DIAGNOSTIC DU SERVEUR SST")
print("="*60)

# Vérifier la base de données
print("\n1. Vérification de la base de données...")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    print("✓ Connexion à la base de données OK")
except Exception as e:
    print(f"✗ Erreur de connexion à la base de données: {e}")

# Vérifier les migrations
print("\n2. Vérification des migrations...")
try:
    from django.core.management import call_command
    from io import StringIO
    
    out = StringIO()
    call_command('showmigrations', '--list', stdout=out)
    migrations = out.getvalue()
    
    unapplied = [line for line in migrations.split('\n') if '[ ]' in line]
    if unapplied:
        print(f"⚠ {len(unapplied)} migration(s) non appliquée(s)")
        print("   Exécutez: python manage.py migrate")
    else:
        print("✓ Toutes les migrations sont appliquées")
except Exception as e:
    print(f"✗ Erreur lors de la vérification des migrations: {e}")

# Vérifier les applications installées
print("\n3. Vérification des applications...")
required_apps = [
    'accounts', 'companies', 'medical', 'visits', 
    'accidents', 'vaccination', 'prevention', 'training', 
    'reporting', 'audit'
]

for app in required_apps:
    if app in settings.INSTALLED_APPS:
        print(f"✓ {app}")
    else:
        print(f"✗ {app} manquante")

# Vérifier les modèles
print("\n4. Vérification des modèles...")
try:
    from accounts.models import User
    from companies.models import Company
    from medical.models import Agent
    print("✓ Modèles principaux chargés")
except Exception as e:
    print(f"✗ Erreur lors du chargement des modèles: {e}")

# Vérifier les URLs
print("\n5. Vérification des URLs...")
try:
    from django.urls import get_resolver
    resolver = get_resolver()
    url_count = len([p for p in resolver.url_patterns])
    print(f"✓ {url_count} pattern(s) d'URL configuré(s)")
except Exception as e:
    print(f"✗ Erreur lors de la vérification des URLs: {e}")

# Vérifier les utilisateurs
print("\n6. Vérification des utilisateurs...")
try:
    user_count = User.objects.count()
    print(f"✓ {user_count} utilisateur(s) dans la base de données")
    if user_count == 0:
        print("   ⚠ Aucun utilisateur. Créez-en un avec: python manage.py createsuperuser")
except Exception as e:
    print(f"✗ Erreur lors de la vérification des utilisateurs: {e}")

# Vérifier les variables d'environnement
print("\n7. Vérification de la configuration...")
print(f"   DEBUG: {settings.DEBUG}")
print(f"   SECRET_KEY: {'✓ Défini' if settings.SECRET_KEY and settings.SECRET_KEY != 'django-insecure-change-me-in-production' else '✗ Non défini ou par défaut'}")
print(f"   ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")

print("\n" + "="*60)
print("DIAGNOSTIC TERMINÉ")
print("="*60)
