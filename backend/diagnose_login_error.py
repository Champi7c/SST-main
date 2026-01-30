"""
Script de diagnostic pour l'erreur 500 lors du login
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')

try:
    django.setup()
    print("✓ Django configuré")
except Exception as e:
    print(f"✗ Erreur de configuration Django: {e}")
    sys.exit(1)

print("\n" + "="*60)
print("DIAGNOSTIC DE L'ERREUR 500 LORS DU LOGIN")
print("="*60)

# 1. Vérifier les migrations
print("\n1. Vérification des migrations...")
try:
    from django.core.management import call_command
    from io import StringIO
    
    out = StringIO()
    call_command('showmigrations', 'accounts', stdout=out, no_color=True)
    migrations = out.getvalue()
    
    unapplied = [line for line in migrations.split('\n') if '[ ]' in line and 'accounts' in line]
    if unapplied:
        print(f"   ⚠ {len(unapplied)} migration(s) non appliquée(s) pour accounts")
        for line in unapplied[:3]:
            print(f"      {line.strip()}")
        print("\n   SOLUTION: python manage.py migrate accounts")
    else:
        print("   ✓ Toutes les migrations accounts sont appliquées")
except Exception as e:
    print(f"   ✗ Erreur: {e}")

# 2. Vérifier le modèle User
print("\n2. Vérification du modèle User...")
try:
    from accounts.models import User
    
    # Vérifier les champs
    fields = [f.name for f in User._meta.get_fields()]
    required_fields = ['username', 'role']
    
    for field in required_fields:
        if field in fields:
            print(f"   ✓ Champ '{field}' existe")
        else:
            print(f"   ✗ Champ '{field}' manquant!")
    
    # Vérifier les utilisateurs
    users = User.objects.all()
    print(f"\n   Nombre d'utilisateurs: {users.count()}")
    
    if users.count() > 0:
        print("\n   Utilisateurs existants:")
        for user in users[:5]:
            role = getattr(user, 'role', 'NON DÉFINI')
            print(f"      - {user.username} (role: {role})")
            
            # Vérifier si le rôle est valide
            if not role or role == 'NON DÉFINI':
                print(f"        ⚠ ATTENTION: Pas de rôle défini!")
    else:
        print("   ⚠ Aucun utilisateur. Créez-en un avec:")
        print("      python manage.py createsuperuser")
        
except Exception as e:
    print(f"   ✗ Erreur: {e}")
    import traceback
    traceback.print_exc()

# 3. Vérifier la vue de login
print("\n3. Vérification de la vue de login...")
try:
    from accounts.views import CustomTokenObtainPairView
    from accounts.urls import urlpatterns
    
    print("   ✓ CustomTokenObtainPairView importée")
    
    # Vérifier les URLs
    login_url = None
    for pattern in urlpatterns:
        if hasattr(pattern, 'name') and pattern.name == 'token_obtain_pair':
            login_url = pattern
            break
    
    if login_url:
        print("   ✓ URL de login configurée")
    else:
        print("   ✗ URL de login non trouvée")
        
except Exception as e:
    print(f"   ✗ Erreur: {e}")
    import traceback
    traceback.print_exc()

# 4. Tester l'authentification Django
print("\n4. Test d'authentification Django...")
try:
    from django.contrib.auth import authenticate
    from accounts.models import User
    
    users = User.objects.all()
    if users.count() > 0:
        test_user = users.first()
        print(f"   Test avec: {test_user.username}")
        
        # Tester sans mot de passe (juste vérifier que l'utilisateur existe)
        print(f"   ✓ Utilisateur existe dans la base")
        
        # Vérifier le rôle
        if hasattr(test_user, 'role') and test_user.role:
            print(f"   ✓ Rôle défini: {test_user.role}")
        else:
            print(f"   ✗ Rôle non défini - cela peut causer l'erreur 500!")
            print("   SOLUTION: python fix_users_role.py")
    else:
        print("   ⚠ Aucun utilisateur à tester")
        
except Exception as e:
    print(f"   ✗ Erreur: {e}")
    import traceback
    traceback.print_exc()

# 5. Vérifier la base de données
print("\n5. Vérification de la base de données...")
try:
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Vérifier si la table existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='accounts_user'
        """)
        table_exists = cursor.fetchone() is not None
        
        if table_exists:
            print("   ✓ Table accounts_user existe")
            
            # Compter les utilisateurs
            cursor.execute("SELECT COUNT(*) FROM accounts_user")
            count = cursor.fetchone()[0]
            print(f"   ✓ {count} utilisateur(s) dans la table")
        else:
            print("   ✗ Table accounts_user n'existe pas!")
            print("   SOLUTION: python manage.py migrate accounts")
            
except Exception as e:
    print(f"   ✗ Erreur: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("RÉSUMÉ ET SOLUTIONS")
print("="*60)
print("""
Si vous voyez des erreurs ci-dessus, suivez ces étapes :

1. Si des migrations ne sont pas appliquées:
   python manage.py migrate

2. Si les utilisateurs n'ont pas de rôle:
   python fix_users_role.py

3. Si la table n'existe pas:
   python manage.py migrate accounts

4. Si rien ne fonctionne, réinitialisez la base:
   del db.sqlite3
   python manage.py migrate
   python manage.py createsuperuser
   python fix_users_role.py
""")
