#!/bin/bash
set -e

# Attendre que la base soit prête (optionnel, utile avec MySQL/Postgres)
if [ -n "$DATABASE_URL" ] || [ -n "$MYSQL_DATABASE" ]; then
  echo "Exécution des migrations..."
  python manage.py migrate --noinput
  echo "Migrations terminées."
fi

exec "$@"
