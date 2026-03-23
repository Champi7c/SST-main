#!/bin/bash
set -e

# Attendre que MySQL soit prêt avant de migrer
if [ -n "$SST_DB_NAME" ] || [ -n "$DATABASE_URL" ]; then
  echo "Attente de la base de données..."
  until python -c "
import os, sys
try:
    import MySQLdb
    MySQLdb.connect(
        host=os.environ.get('SST_DB_HOST', '127.0.0.1'),
        port=int(os.environ.get('SST_DB_PORT', 3306)),
        user=os.environ.get('SST_DB_USER', 'root'),
        passwd=os.environ.get('SST_DB_PASSWORD', ''),
        db=os.environ.get('SST_DB_NAME', 'sst_db'),
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "Base non disponible, nouvelle tentative dans 2s..."
    sleep 2
  done
  echo "Base de donnees disponible."

  echo "Execution des migrations..."
  python manage.py migrate --noinput
  echo "Migrations terminees."
fi

echo "Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

exec "$@"
