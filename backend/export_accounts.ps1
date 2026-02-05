# Script pour exporter tous les comptes utilisateurs avec SQLite
# Usage: .\export_accounts.ps1

$oldDbName = $env:DB_NAME
$env:DB_NAME = $null

try {
    Write-Host "Export des comptes utilisateurs (SQLite)..." -ForegroundColor Cyan
    Write-Host ""
    python manage.py export_accounts
} finally {
    if ($oldDbName) {
        $env:DB_NAME = $oldDbName
    } else {
        Remove-Item Env:\DB_NAME -ErrorAction SilentlyContinue
    }
}
