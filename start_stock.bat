@echo off
echo ================================================
echo    Systeme de Gestion de Stock
echo ================================================
echo.
echo Demarrage du serveur...
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Python depuis https://www.python.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "data" (
    echo Installation des dependances...
    pip install -r requirements.txt
    echo.
)

REM Start Flask server and open browser
echo Ouverture de l'application...
start http://127.0.0.1:5000
python app.py

pause
