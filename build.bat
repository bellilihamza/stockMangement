@echo off
echo ================================================
echo   Building Gestion Stock Executable
echo ================================================
echo.

REM Check if PyInstaller is installed
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo [1/3] Installing PyInstaller...
    pip install pyinstaller
    if errorlevel 1 (
        echo ERROR: Failed to install PyInstaller
        pause
        exit /b 1
    )
) else (
    echo [1/3] PyInstaller already installed
)

echo.
echo [2/3] Building executable with PyInstaller...
pyinstaller --clean gestion_stock.spec

if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Build completed successfully!
echo.
echo ================================================
echo   Executable created: dist\GestionStock.exe
echo ================================================
echo.
echo You can now run the application by double-clicking:
echo   dist\GestionStock.exe
echo.
echo Or distribute the entire 'dist' folder to users.
echo.
pause
