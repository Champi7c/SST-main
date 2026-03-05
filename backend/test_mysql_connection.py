"""
Test de connexion MySQL - à lancer depuis le dossier backend.
Affiche la config lue depuis .env et tente une connexion.
"""
import os
import sys

# S'assurer que le répertoire backend est dans le path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from decouple import config

def main():
    # Préfixe SST_ pour ne pas être écrasé par les variables d'un autre projet (ex. feedback_db)
    host = config('SST_DB_HOST', default=config('DB_HOST', default='127.0.0.1'))
    port = config('SST_DB_PORT', default=config('DB_PORT', default=3306, cast=int), cast=int)
    name = config('SST_DB_NAME', default=config('DB_NAME', default=''))
    user = config('SST_DB_USER', default=config('DB_USER', default='root'))
    pwd = config('SST_DB_PASSWORD', default=config('DB_PASSWORD', default=''))
    print("Configuration MySQL SST (depuis .env, variables SST_DB_*) :")
    print(f"  SST_DB_HOST={host}")
    print(f"  SST_DB_PORT={port}")
    print(f"  SST_DB_NAME={name}")
    print(f"  SST_DB_USER={user}")
    print(f"  SST_DB_PASSWORD={'***' if pwd else '(vide)'}")
    print()
    try:
        import pymysql
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=pwd,
            database=name,
            charset='utf8mb4',
        )
        print("Connexion MySQL réussie.")
        conn.close()
        return 0
    except Exception as e:
        print("Erreur de connexion:", e)
        print()
        print("Vérifiez :")
        print("  - que MySQL/MariaDB est bien démarré (XAMPP, WAMP, ou service Windows) ;")
        print("  - le port dans l’URL de phpMyAdmin (ex. ...:3308/... = port 3308).")
        print("  Si le port est 3308, mettez DB_PORT=3308 dans le fichier .env")
        return 1

if __name__ == '__main__':
    sys.exit(main())
