# Script pour lister tous les comptes utilisateurs avec SQLite
# Usage: .\list_accounts.ps1

$oldDbName = $env:DB_NAME
$env:DB_NAME = $null

try {
    Write-Host "Liste des comptes utilisateurs (SQLite)..." -ForegroundColor Cyan
    Write-Host ""
    python manage.py list_users
} finally {
    if ($oldDbName) {
        $env:DB_NAME = $oldDbName
    } else {
        Remove-Item Env:\DB_NAME -ErrorAction SilentlyContinue
    }
}
