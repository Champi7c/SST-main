# Script PowerShell pour réinitialiser la base de données
# ATTENTION: Supprime toutes les données !

Write-Host "=" -NoNewline
Write-Host ("=" * 59)
Write-Host "REINITIALISATION DE LA BASE DE DONNEES" -ForegroundColor Yellow
Write-Host "=" -NoNewline
Write-Host ("=" * 59)
Write-Host ""
Write-Host "ATTENTION: Cette operation va supprimer toutes les donnees!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Etes-vous sur de vouloir continuer? (oui/non)"

if ($confirm -ne "oui") {
    Write-Host "Operation annulee." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "1. Suppression de la base de donnees..." -ForegroundColor Cyan
if (Test-Path "db.sqlite3") {
    Remove-Item "db.sqlite3" -Force
    Write-Host "   Base de donnees supprimee" -ForegroundColor Green
} else {
    Write-Host "   Base de donnees non trouvee (deja supprimee?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Creation des migrations..." -ForegroundColor Cyan
python manage.py makemigrations
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Erreur lors de la creation des migrations!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Application des migrations..." -ForegroundColor Cyan
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Erreur lors de l'application des migrations!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. Correction des roles utilisateurs..." -ForegroundColor Cyan
python fix_users_role.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Avertissement: Impossible d'executer fix_users_role.py" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" -NoNewline
Write-Host ("=" * 59)
Write-Host "REINITIALISATION TERMINEE" -ForegroundColor Green
Write-Host "=" -NoNewline
Write-Host ("=" * 59)
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "  1. Creer un super utilisateur: python manage.py createsuperuser"
Write-Host "  2. Definir le role: python fix_users_role.py"
Write-Host "  3. Lancer le serveur: python manage.py runserver"
Write-Host ""
