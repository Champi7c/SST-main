@echo off
cd /d "%~dp0"
echo Test de connexion MySQL (port 3306)...
python test_mysql_connection.py
if errorlevel 1 (
    echo.
    echo Corrigez la connexion puis relancez ce script.
    pause
    exit /b 1
)
echo.
echo Application des migrations vers sst_coly...
python manage.py migrate
echo.
echo Termine. Vous pouvez lancer le serveur avec: python manage.py runserver
pause
