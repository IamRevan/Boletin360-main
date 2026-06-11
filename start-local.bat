@echo off
chcp 65001 >nul
echo ============================================
echo   Boletin360 - Inicio Local (Sin Docker)
echo ============================================
echo.

set PGBIN=C:\Program Files\PostgreSQL\18\bin
set PGPASSWORD=123

echo [1/3] Verificando PostgreSQL...
"%PGBIN%\pg_isready.exe" -h localhost -p 5432 -q
if %errorlevel% neq 0 (
    echo PostgreSQL no responde. Intentando iniciar servicio...
    net start postgresql-x64-18
    timeout /t 3 /nobreak >nul
    "%PGBIN%\pg_isready.exe" -h localhost -p 5432 -q
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo iniciar PostgreSQL. Verifica desde pgAdmin.
        pause
        exit /b 1
    )
)
echo OK - PostgreSQL en localhost:5432

echo.
echo [2/3] Verificando base de datos...
"%PGBIN%\psql.exe" -U postgres -h localhost -p 5432 -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='boletin360'" | findstr "1" >nul 2>&1
if %errorlevel% neq 0 (
    call scripts\setup-db.bat
) else (
    echo OK - Base de datos lista.
)

echo.
echo [3/3] Iniciando aplicacion...
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   Health:   http://localhost:3001/health
echo.
echo Presiona Ctrl+C para detener.
echo.

cmd /c "npm run dev:all"
