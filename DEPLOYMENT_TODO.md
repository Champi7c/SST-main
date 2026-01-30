[ Plateforme SST - Déploiement Netlify + Railway ]

# TODO: Hébergement Frontend (Netlify) + Backend + MySQL (Railway)

## Étape 1: Configuration Frontend pour Netlify ✅ TERMINÉ
- [x] Créer `netlify.toml` avec les règles de rewrite pour React Router
- [x] Configurer la variable d'environnement `VITE_API_URL`
- [x] Mettre à jour le fichier `_redirects` dans `public/`

## Étape 2: Configuration Backend pour Railway ✅ TERMINÉ
- [x] Créer `Dockerfile` pour le backend Django
- [x] Créer `railway.json` pour la configuration Railway
- [x] Créer `.env.production` avec les variables Railway
- [x] Mettre à jour `settings.py` pour les variables Railway (DATABASE_URL support)

## Étape 3: Base de données MySQL sur Railway ⏳ À FAIRE PAR L'UTILISATEUR
- [ ] Créer le service MySQL sur Railway
- [ ] Récupérer les variables de connexion (DATABASE_URL)
- [ ] Configurer les migrations Django

## Étape 4: Déploiement ⏳ À FAIRE PAR L'UTILISATEUR
- [ ] Connecter le repo GitHub à Railway
- [ ] Configurer les variables d'environnement
- [ ] Déployer le backend
- [ ] Connecter le repo à Netlify
- [ ] Configurer les variables d'environnement frontend
- [ ] Déployer le frontend

## Étape 5: Tests et validation ⏳ À FAIRE APRÈS DÉPLOIEMENT
- [ ] Tester l'API backend
- [ ] Tester le frontend avec authentification
- [ ] Vérifier les CORS

## Notes importantes:
- Frontend: statique → Netlify (gratuit)
- Backend: Python/Django → Railway (gratuit tier)
- MySQL: Railway MySQL plugin (gratuit tier)
- Temps estimé: 30-45 minutes

