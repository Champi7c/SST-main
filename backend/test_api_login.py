"""
Script pour tester l'API de login directement
"""
import os
import sys
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

print("="*60)
print("TEST DE L'API DE LOGIN")
print("="*60)

# Vérifier d'abord que Django fonctionne
try:
    from accounts.models import User
    from django.contrib.auth import authenticate
    
    print("\n1. Vérification des utilisateurs...")
    users = User.objects.all()
    print(f"   Nombre d'utilisateurs: {users.count()}")
    
    if users.count() == 0:
        print("   ⚠ Aucun utilisateur. Créez-en un avec:")
        print("      python manage.py createsuperuser")
        sys.exit(1)
    
    # Afficher les utilisateurs
    print("\n   Utilisateurs disponibles:")
    for user in users:
        print(f"      - {user.username} (role: {getattr(user, 'role', 'NON DÉFINI')})")
    
    # Tester l'authentification Django
    print("\n2. Test d'authentification Django...")
    test_user = users.first()
    print(f"   Test avec: {test_user.username}")
    
    # Tester l'API
    print("\n3. Test de l'API de login...")
    url = "http://localhost:8000/api/auth/login/"
    
    # Demander les identifiants
    username = input(f"\n   Entrez le nom d'utilisateur [{test_user.username}]: ").strip() or test_user.username
    password = input("   Entrez le mot de passe: ")
    
    if not password:
        print("   ⚠ Mot de passe requis pour tester")
        sys.exit(1)
    
    data = {
        "username": username,
        "password": password
    }
    
    print(f"\n   Envoi de la requête à {url}...")
    try:
        response = requests.post(url, json=data, timeout=5)
        print(f"   Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("   ✓ Connexion réussie!")
            print(f"   Token reçu: {result.get('access', 'N/A')[:50]}...")
        elif response.status_code == 401:
            print("   ✗ Authentification échouée - identifiants incorrects")
            print(f"   Réponse: {response.text}")
        elif response.status_code == 500:
            print("   ✗ Erreur 500 - Erreur serveur")
            print(f"   Réponse: {response.text}")
            try:
                error_detail = response.json()
                print(f"   Détails: {json.dumps(error_detail, indent=2)}")
            except:
                print(f"   Réponse brute: {response.text[:500]}")
        else:
            print(f"   ✗ Erreur {response.status_code}")
            print(f"   Réponse: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ✗ Impossible de se connecter au serveur")
        print("   Assurez-vous que le serveur Django est lancé:")
        print("      python manage.py runserver")
    except Exception as e:
        print(f"   ✗ Erreur: {e}")
        import traceback
        traceback.print_exc()
    
except Exception as e:
    print(f"\n✗ Erreur lors du test: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*60)
