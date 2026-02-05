"""
Script pour exporter la liste de tous les comptes utilisateurs
Usage: python export_accounts.py
"""
import os
import sys
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Erreur lors de l'initialisation de Django: {e}")
    print("\nVérifiez que:")
    print("1. Vous êtes dans le répertoire backend/")
    print("2. Les dépendances sont installées (pip install -r requirements.txt)")
    print("3. La base de données est accessible")
    sys.exit(1)

from django.db import connection
from accounts.models import User

def export_accounts():
    """Exporte la liste de tous les comptes utilisateurs"""
    
    print("=" * 100)
    print("EXPORT DES COMPTES UTILISATEURS - Plateforme SST")
    print("=" * 100)
    print()
    print("⚠️  IMPORTANT: Les mots de passe sont stockés de manière sécurisée (hashés)")
    print("   et ne peuvent PAS être récupérés en clair pour des raisons de sécurité.")
    print("   Pour réinitialiser un mot de passe, utilisez:")
    print("   python manage.py reset_user_password <username>")
    print()
    print("=" * 100)
    print()
    
    # Vérifier la connexion à la base de données
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        print(f"❌ Erreur de connexion à la base de données: {e}")
        print("\nSolutions possibles:")
        print("1. Vérifiez que MySQL est démarré (si vous utilisez MySQL)")
        print("2. Vérifiez votre fichier .env (DB_NAME, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD)")
        print("3. Ou utilisez SQLite en supprimant DB_NAME de votre .env")
        return
    
    try:
        users = User.objects.all().order_by('last_name', 'first_name')
    except Exception as e:
        print(f"❌ Erreur lors de la récupération des utilisateurs: {e}")
        print("\nEssayez d'abord: python manage.py migrate")
        return
    
    if not users.exists():
        print("Aucun utilisateur trouvé dans la base de données.")
        print("Créez un utilisateur avec: python manage.py create_admin")
        return
    
    # Préparer les données pour l'export
    accounts_data = []
    
    for user in users:
        role_display = user.get_role_display()
        active = "Oui" if user.is_active else "Non"
        superuser = "Oui" if user.is_superuser else "Non"
        staff = "Oui" if user.is_staff else "Non"
        
        account_info = {
            'id': user.id,
            'username': user.username,
            'email': user.email or '-',
            'first_name': user.first_name or '-',
            'last_name': user.last_name or '-',
            'role': role_display,
            'role_code': user.role or '-',
            'phone': user.phone or '-',
            'is_active': active,
            'is_superuser': superuser,
            'is_staff': staff,
            'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S') if user.date_joined else '-',
            'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Jamais connecté',
        }
        accounts_data.append(account_info)
    
    # Afficher dans la console
    print(f"Nombre total d'utilisateurs: {users.count()}\n")
    print(f"{'ID':<5} {'Nom d\'utilisateur':<20} {'Nom':<20} {'Prénom':<20} {'Email':<30} {'Rôle':<20} {'Actif':<10} {'Superuser':<10}")
    print("-" * 150)
    
    for account in accounts_data:
        print(f"{account['id']:<5} {account['username']:<20} {account['last_name']:<20} {account['first_name']:<20} {account['email']:<30} {account['role']:<20} {account['is_active']:<10} {account['is_superuser']:<10}")
    
    # Exporter dans un fichier texte
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'comptes_utilisateurs_{timestamp}.txt'
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
        f.write("=" * 100 + "\n")
        f.write("EXPORT DES COMPTES UTILISATEURS - Plateforme SST\n")
        f.write(f"Date d'export: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 100 + "\n\n")
        f.write("⚠️  IMPORTANT: Les mots de passe sont stockés de manière sécurisée (hashés)\n")
        f.write("   et ne peuvent PAS être récupérés en clair pour des raisons de sécurité.\n")
        f.write("   Pour réinitialiser un mot de passe, utilisez:\n")
        f.write("   python manage.py reset_user_password <username>\n\n")
        f.write("=" * 100 + "\n\n")
        f.write(f"Nombre total d'utilisateurs: {users.count()}\n\n")
        
        for account in accounts_data:
            f.write(f"\n{'='*100}\n")
            f.write(f"ID: {account['id']}\n")
            f.write(f"Nom d'utilisateur: {account['username']}\n")
            f.write(f"Email: {account['email']}\n")
            f.write(f"Prénom: {account['first_name']}\n")
            f.write(f"Nom: {account['last_name']}\n")
            f.write(f"Rôle: {account['role']} ({account['role_code']})\n")
            f.write(f"Téléphone: {account['phone']}\n")
            f.write(f"Actif: {account['is_active']}\n")
            f.write(f"Super utilisateur: {account['is_superuser']}\n")
            f.write(f"Staff: {account['is_staff']}\n")
            f.write(f"Date d'inscription: {account['date_joined']}\n")
            f.write(f"Dernière connexion: {account['last_login']}\n")
            f.write(f"Mot de passe: [HASHÉ - Non récupérable]\n")
        
            f.write(f"\n{'='*100}\n")
            f.write("\nRÉSUMÉ PAR RÔLE:\n")
            f.write("-" * 100 + "\n")
            roles = User.ROLE_CHOICES
            for role_code, role_name in roles:
                count = User.objects.filter(role=role_code).count()
                f.write(f"  • {role_name} ({role_code}): {count} utilisateur(s)\n")
    except Exception as e:
        print(f"❌ Erreur lors de l'écriture du fichier: {e}")
        return
    
    print(f"\n{'='*100}")
    print(f"\n✅ Export terminé!")
    print(f"📄 Fichier créé: {filename}")
    print(f"\n{'='*100}")
    print("\nRÉSUMÉ PAR RÔLE:")
    print("-" * 100)
    roles = User.ROLE_CHOICES
    for role_code, role_name in roles:
        count = User.objects.filter(role=role_code).count()
        print(f"  • {role_name} ({role_code}): {count} utilisateur(s)")

if __name__ == '__main__':
    export_accounts()
