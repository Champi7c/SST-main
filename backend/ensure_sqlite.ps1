# Script PowerShell pour s'assurer que SQLite est utilisé par défaut
# Ce script supprime la variable d'environnement DB_NAME si elle existe
# et garantit que USE_MYSQL n'est pas défini

Write-Host "Configuration pour utiliser SQLite par défaut..." -ForegroundColor Green

# Supprimer DB_NAME de l'environnement de la session actuelle
if ($env:DB_NAME) {
    Remove-Item Env:\DB_NAME
    Write-Host "✓ Variable DB_NAME supprimée de la session actuelle" -ForegroundColor Yellow
}

# S'assurer que USE_MYSQL n'est pas défini
if ($env:USE_MYSQL) {
    Remove-Item Env:\USE_MYSQL
    Write-Host "✓ Variable USE_MYSQL supprimée de la session actuelle" -ForegroundColor Yellow
}

Write-Host "`nSQLite sera utilisé par défaut." -ForegroundColor Green
Write-Host "Pour utiliser MySQL, définissez USE_MYSQL=True dans le fichier .env" -ForegroundColor Cyan
