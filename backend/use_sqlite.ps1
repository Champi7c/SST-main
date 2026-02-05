# Script PowerShell pour utiliser SQLite au lieu de MySQL
# Usage: .\use_sqlite.ps1 <commande_django>
# Exemple: .\use_sqlite.ps1 "python manage.py list_users"

# Sauvegarder les valeurs actuelles
$oldUseMysql = $env:USE_MYSQL
$oldDbName = $env:DB_NAME

# Désactiver USE_MYSQL pour forcer l'utilisation de SQLite
Remove-Item Env:\USE_MYSQL -ErrorAction SilentlyContinue
Remove-Item Env:\DB_NAME -ErrorAction SilentlyContinue

try {
    # Exécuter la commande passée en argument
    if ($args.Count -gt 0) {
        $command = $args -join " "
        Invoke-Expression $command
    } else {
        Write-Host "Usage: .\use_sqlite.ps1 <commande_django>"
        Write-Host "Exemples:"
        Write-Host "  .\use_sqlite.ps1 'python manage.py list_users'"
        Write-Host "  .\use_sqlite.ps1 'python manage.py createsuperuser'"
        Write-Host "  .\use_sqlite.ps1 'python manage.py export_accounts'"
    }
} finally {
    # Restaurer les valeurs originales
    if ($oldUseMysql) {
        $env:USE_MYSQL = $oldUseMysql
    }
    if ($oldDbName) {
        $env:DB_NAME = $oldDbName
    }
}
