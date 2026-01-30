"""
Test direct de la vue de login pour voir l'erreur exacte
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

from django.test import RequestFactory
from accounts.views import CustomTokenObtainPairView
from accounts.models import User
import json

print("="*60)
print("TEST DIRECT DE LA VUE DE LOGIN")
print("="*60)

# Vérifier qu'il y a des utilisateurs
users = User.objects.all()
if users.count() == 0:
    print("\n✗ Aucun utilisateur trouvé!")
    print("Créez-en un avec: python manage.py createsuperuser")
    sys.exit(1)

test_user = users.first()
print(f"\nTest avec l'utilisateur: {test_user.username}")

# Demander le mot de passe
import getpass
password = getpass.getpass(f"Entrez le mot de passe pour {test_user.username}: ")

if not password:
    print("Mot de passe requis")
    sys.exit(1)

# Créer une requête de test
factory = RequestFactory()
data = {
    'username': test_user.username,
    'password': password
}

request = factory.post(
    '/api/auth/login/',
    data=json.dumps(data),
    content_type='application/json'
)

# Tester la vue
print("\nTest de la vue CustomTokenObtainPairView...")
try:
    view = CustomTokenObtainPairView.as_view()
    response = view(request)
    
    print(f"Status code: {response.status_code}")
    
    if hasattr(response, 'data'):
        print(f"Response data: {response.data}")
    else:
        print(f"Response content: {response.content.decode()[:500]}")
        
    if response.status_code == 500:
        print("\n✗ ERREUR 500 DÉTECTÉE")
        print("Vérifiez les logs Django pour plus de détails")
        
except Exception as e:
    print(f"\n✗ ERREUR lors du test: {e}")
    import traceback
    print("\nTraceback complet:")
    traceback.print_exc()

print("\n" + "="*60)
