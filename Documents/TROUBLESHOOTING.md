# 🔧 Guide de Résolution des Problèmes - Plateforme SST

## `python: command not found` au démarrage du backend

**Symptôme** : En lançant `python manage.py runserver`, zsh affiche `command not found: python`.

**Solution** : Sur macOS, l’exécutable est souvent `python3`. Utilisez le **venv** du projet :

```bash
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Sans activer le venv :
```bash
cd backend
./venv/bin/python manage.py runserver 0.0.0.0:8000
```

## `PermissionError` sur `logs/django.log`

**Symptôme** : Au démarrage, Django échoue avec `Unable to configure handler 'file'` / `PermissionError` sur `backend/logs/django.log`.

**Solution** : Le logging fichier est désormais **optionnel**. Si le fichier n’est pas accessible en écriture, Django utilise uniquement la console. Pour activer les logs fichier :

```bash
mkdir -p backend/logs
chmod 755 backend/logs
```

---

## Erreur 500 (Internal Server Error)

### Diagnostic Rapide

1. **Vérifier les logs du serveur Django**
   ```powershell
   # Les erreurs s'affichent dans la console où vous avez lancé le serveur
   python manage.py runserver
   ```

2. **Exécuter le script de diagnostic**
   ```powershell
   cd backend
   python check_server.py
   ```

3. **Vérifier les migrations**
   ```powershell
   python manage.py showmigrations
   python manage.py migrate
   ```

### Causes Courantes et Solutions

#### 1. Migrations non appliquées
**Symptôme** : Erreur "no such table" ou "relation does not exist"

**Solution** :
```powershell
python manage.py makemigrations
python manage.py migrate
```

#### 1b. `seed_data --flush` : "Table 'sst.audit_medicaldataaccess' doesn't exist"
**Symptôme** : Le flush plante lors de la suppression des agents, avec une erreur sur `audit_medicaldataaccess`.

**Solution** : La commande exécute désormais `migrate` automatiquement avant le flush. Si l’erreur persiste :
```bash
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py seed_data --flush
```
Vérifiez que l’app `audit` possède des migrations (`audit/migrations/0001_initial.py`) et qu’elles sont appliquées.

#### 2. Module manquant ou erreur d'import
**Symptôme** : "ModuleNotFoundError" ou "ImportError"

**Solution** :
```powershell
# Vérifier que toutes les dépendances sont installées
pip install -r requirements.txt

# Vérifier que les fichiers __init__.py existent dans chaque app
# Vérifier que les fichiers apps.py existent
```

#### 3. Erreur dans les serializers
**Symptôme** : Erreur lors de l'accès à une API

**Solution** :
- Vérifier les logs Django pour voir l'erreur exacte
- Vérifier que tous les champs dans les serializers correspondent aux modèles
- Vérifier les méthodes `get_*` dans les serializers

#### 4. Problème de permissions
**Symptôme** : Erreur lors de l'accès à une ressource

**Solution** :
- Vérifier que l'utilisateur est authentifié
- Vérifier que l'utilisateur a les bonnes permissions
- Vérifier les classes de permissions dans les views

#### 5. Erreur de base de données
**Symptôme** : Erreur SQL ou de connexion

**Solution** :
```powershell
# Vérifier la connexion
python manage.py dbshell

# Réinitialiser la base (ATTENTION: supprime toutes les données)
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
```

### Mode DEBUG

Pour voir les détails des erreurs, assurez-vous que `DEBUG=True` dans `settings.py` :

```python
DEBUG = True
```

En mode DEBUG, les erreurs 500 affichent la trace complète de l'erreur.

### Logs

Les logs sont maintenant configurés dans `settings.py`. Vérifiez :
- Console (sortie standard)
- Fichier `backend/logs/django.log` (si le dossier existe)

Pour créer le dossier logs :
```powershell
mkdir backend\logs
```

### Vérifications Système

1. **Python et Django**
   ```powershell
   python --version
   python manage.py version
   ```

2. **Base de données**
   ```powershell
   python manage.py dbshell
   # Tapez .tables pour voir les tables
   ```

3. **Applications installées**
   ```powershell
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.INSTALLED_APPS)
   ```

### Erreurs Spécifiques

#### "pkg_resources is deprecated"
**Solution** : Installer setuptools
```powershell
pip install setuptools
```

#### "no such table: accounts_user"
**Solution** : Appliquer les migrations
```powershell
python manage.py migrate
```

#### "Table 'X' already exists" (MySQL) — ex. `medical_agent`
**Symptôme** : `OperationalError (1050, "Table 'medical_agent' already exists")` lors de `migrate`.

**Cause** : Les tables existent déjà en base (migration précédente ou autre outil), mais Django ne les considère pas comme migrées (`django_migrations` incohérent).

**Solution** : Marquer les migrations concernées comme appliquées **sans** exécuter le SQL (fake), puis relancer `migrate` :

```bash
cd backend
source venv/bin/activate   # Mac/Linux — ou venv\Scripts\activate sur Windows

# 1. Fake la migration qui échoue (ex. medical)
python manage.py migrate medical 0001_initial --fake

# 2. Si d'autres apps échouent pareil (visits, accidents, etc.), les faker aussi :
# python manage.py migrate visits 0001_initial --fake
# python manage.py migrate accidents 0001_initial --fake

# 3. Relancer migrate pour appliquer le reste (prevention, vaccination, training, etc.)
python manage.py migrate
```

**Alternative (réinitialisation complète)** : En dev, recréer la base MySQL `sst` vide dans phpMyAdmin, puis `python manage.py migrate` depuis zéro. Voir `RESET_DATABASE.md`.

#### "ModuleNotFoundError: No module named 'X'"
**Solution** : Installer le module manquant
```powershell
pip install X
```

#### Erreur CORS
**Solution** : Vérifier la configuration CORS dans `settings.py`
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Commandes Utiles

```powershell
# Vérifier la configuration
python manage.py check

# Voir les migrations
python manage.py showmigrations

# Appliquer les migrations
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser

# Lancer le serveur en mode verbose
python manage.py runserver --verbosity 2

# Shell Django pour tester
python manage.py shell
```

### Contact Support

Si le problème persiste :
1. Notez l'erreur exacte (message complet)
2. Notez l'URL qui cause l'erreur
3. Vérifiez les logs Django
4. Exécutez `python check_server.py` et partagez le résultat
