# 🔐 Gestion des Mots de Passe - Plateforme SST

## ⚠️ Important : Sécurité des Mots de Passe

**Les mots de passe sont stockés de manière sécurisée (hashés) dans Django et ne peuvent PAS être récupérés en clair.**

C'est une fonctionnalité de sécurité essentielle :
- ✅ Même les administrateurs ne peuvent pas voir les mots de passe
- ✅ Les mots de passe sont hashés avec des algorithmes cryptographiques sécurisés
- ✅ En cas de compromission de la base de données, les mots de passe restent protégés

## 🔄 Réinitialiser le Mot de Passe d'un Utilisateur

### Méthode 1 : Commande Django (Recommandée)

```bash
python manage.py reset_user_password <username>
```

Exemple :
```bash
python manage.py reset_user_password medecin1
```

Le système vous demandera de saisir le nouveau mot de passe deux fois.

### Méthode 2 : Avec mot de passe en ligne de commande

```bash
python manage.py reset_user_password <username> --new-password "NouveauMotDePasse123!"
```

### Méthode 3 : Interface d'Administration Django

1. Accédez à http://localhost:8000/admin
2. Connectez-vous avec un super utilisateur
3. Allez dans "Utilisateurs"
4. Cliquez sur l'utilisateur concerné
5. Cliquez sur "Modifier le mot de passe" (lien en haut)
6. Entrez le nouveau mot de passe

### Méthode 4 : Via l'API REST

```bash
curl -X POST http://localhost:8000/api/auth/users/change_password/ \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "ancien_mot_de_passe",
    "new_password": "nouveau_mot_de_passe",
    "new_password_confirm": "nouveau_mot_de_passe"
  }'
```

## 🔑 Définir un Mot de Passe par Défaut (DÉVELOPPEMENT UNIQUEMENT)

⚠️ **ATTENTION** : Cette fonctionnalité est destinée uniquement à l'environnement de développement/test.

Pour définir le même mot de passe pour tous les utilisateurs (utile pour les tests) :

```bash
python manage.py set_default_passwords --password "MotDePasse123!" --confirm
```

**Ne JAMAIS utiliser cette commande en production !**

## 📋 Liste des Utilisateurs et Réinitialisation

### Voir tous les utilisateurs
```bash
python manage.py list_users
```

### Réinitialiser plusieurs utilisateurs
```bash
# Utilisateur 1
python manage.py reset_user_password utilisateur1 --new-password "MotDePasse123!"

# Utilisateur 2
python manage.py reset_user_password utilisateur2 --new-password "MotDePasse123!"
```

## 🔒 Bonnes Pratiques

1. **Mots de passe forts** :
   - Minimum 8 caractères
   - Mélange de lettres majuscules/minuscules
   - Chiffres et caractères spéciaux
   - Pas de mots du dictionnaire

2. **Changement régulier** :
   - Changer les mots de passe tous les 3-6 mois
   - Ne pas réutiliser d'anciens mots de passe

3. **Sécurité** :
   - Ne jamais partager les mots de passe
   - Utiliser un gestionnaire de mots de passe
   - Activer l'authentification à deux facteurs si disponible

4. **En cas d'oubli** :
   - Utiliser la fonction de réinitialisation
   - Contacter l'administrateur système

## 🛠️ Script Python pour Réinitialiser Plusieurs Utilisateurs

Créez un fichier `reset_multiple_users.py` :

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')
django.setup()

from accounts.models import User

# Liste des utilisateurs et leurs nouveaux mots de passe
users_passwords = {
    'admin': 'Admin123!',
    'medecin1': 'Medecin123!',
    'infirmier1': 'Infirmier123!',
    # Ajoutez d'autres utilisateurs ici
}

for username, password in users_passwords.items():
    try:
        user = User.objects.get(username=username)
        user.set_password(password)
        user.save()
        print(f"✓ Mot de passe réinitialisé pour: {username}")
    except User.DoesNotExist:
        print(f"✗ Utilisateur non trouvé: {username}")
```

Exécutez :
```bash
python reset_multiple_users.py
```

## 📞 Support

En cas de problème avec les mots de passe :
1. Vérifiez que l'utilisateur existe : `python manage.py list_users`
2. Réinitialisez le mot de passe : `python manage.py reset_user_password <username>`
3. Contactez l'administrateur système si nécessaire
