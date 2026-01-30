# 🔧 Correction des Migrations - Guide Rapide

## Problème
L'erreur `InconsistentMigrationHistory` indique que les migrations ont été appliquées dans le mauvais ordre.

## Solution : Réinitialiser la Base de Données

### ⚠️ ATTENTION
Cette opération **supprime toutes les données**. Utilisez uniquement en développement !

### Étapes à suivre :

1. **Arrêtez le serveur Django** (Ctrl+C dans le terminal où il tourne)

2. **Supprimez la base de données**
   ```powershell
   cd "C:\Users\5340\OneDrive\Desktop\PROJET\PROJET COLY\SST\backend"
   del db.sqlite3
   ```

3. **Recréez les migrations**
   ```powershell
   python manage.py makemigrations
   ```

4. **Appliquez toutes les migrations**
   ```powershell
   python manage.py migrate
   ```

5. **Créez un super utilisateur**
   ```powershell
   python manage.py createsuperuser
   ```
   Entrez :
   - Username: (votre choix, ex: admin)
   - Email: (optionnel)
   - Password: (votre mot de passe)

6. **Définissez le rôle du super utilisateur**
   ```powershell
   python fix_users_role.py
   ```
   Cela donnera automatiquement le rôle `super_admin` au super utilisateur.

7. **Redémarrez le serveur**
   ```powershell
   python manage.py runserver
   ```

8. **Testez la connexion**
   - Allez sur http://localhost:3000
   - Connectez-vous avec les identifiants créés

## Vérification

Après ces étapes, vérifiez que tout fonctionne :

```powershell
python manage.py check
python manage.py showmigrations
```

Toutes les migrations devraient être marquées `[X]` (appliquées).
