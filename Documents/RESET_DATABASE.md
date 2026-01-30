# 🔄 Réinitialisation de la Base de Données

## Problème : Historique de Migrations Incohérent

L'erreur `InconsistentMigrationHistory` se produit quand les migrations ont été appliquées dans le mauvais ordre. Cela arrive souvent si :
- Un super utilisateur a été créé avant les migrations du modèle User personnalisé
- La base de données a été partiellement migrée

## Solution : Réinitialiser la Base de Données

### ⚠️ ATTENTION
Cette opération **supprime toutes les données** de la base de données. Utilisez uniquement en développement !

### Étapes

1. **Arrêter le serveur Django** (Ctrl+C)

2. **Supprimer la base de données**
   ```powershell
   cd backend
   del db.sqlite3
   ```

3. **Supprimer les fichiers de migration (sauf __init__.py)**
   ```powershell
   # Supprimer les migrations dans chaque app (sauf __init__.py)
   # Ou laissez-les si vous voulez garder l'historique
   ```

4. **Recréer les migrations**
   ```powershell
   python manage.py makemigrations
   ```

5. **Appliquer les migrations**
   ```powershell
   python manage.py migrate
   ```

6. **Créer un nouveau super utilisateur**
   ```powershell
   python manage.py createsuperuser
   ```
   **Important** : Lors de la création, vous devrez spécifier un rôle. Si le formulaire ne le demande pas, utilisez l'admin Django après.

7. **Définir le rôle du super utilisateur**
   ```powershell
   python fix_users_role.py
   ```

## Alternative : Marquer les Migrations comme Appliquées

Si vous ne voulez pas supprimer la base de données :

```powershell
python manage.py migrate accounts 0001 --fake
python manage.py migrate
```

Mais cette méthode peut causer d'autres problèmes. La réinitialisation est recommandée en développement.

## Vérification

Après la réinitialisation, vérifiez que tout fonctionne :

```powershell
python manage.py check
python manage.py showmigrations
python test_login.py
```
