"""
Script pour corriger l'historique des migrations
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

from django.db import connection

print("="*60)
print("CORRECTION DE L'HISTORIQUE DES MIGRATIONS")
print("="*60)

with connection.cursor() as cursor:
    # Vérifier les migrations appliquées
    cursor.execute("SELECT app, name FROM django_migrations WHERE app IN ('admin', 'accounts') ORDER BY app, name")
    migrations = cursor.fetchall()
    
    print("\nMigrations actuelles:")
    for app, name in migrations:
        print(f"  {app}.{name}")
    
    # Vérifier si accounts.0001_initial existe
    cursor.execute("SELECT COUNT(*) FROM django_migrations WHERE app='accounts' AND name='0001_initial'")
    accounts_exists = cursor.fetchone()[0] > 0
    
    # Vérifier si admin.0001_initial existe
    cursor.execute("SELECT COUNT(*) FROM django_migrations WHERE app='admin' AND name='0001_initial'")
    admin_exists = cursor.fetchone()[0] > 0
    
    if admin_exists and not accounts_exists:
        print("\n⚠ Problème détecté: admin.0001_initial appliquée avant accounts.0001_initial")
        print("\nOptions:")
        print("1. Supprimer la base de données et recommencer (recommandé en développement)")
        print("2. Marquer manuellement accounts.0001_initial comme appliquée")
        print("\nPour l'option 1, exécutez:")
        print("  del backend\\db.sqlite3")
        print("  python manage.py migrate")
        print("  python manage.py createsuperuser")
