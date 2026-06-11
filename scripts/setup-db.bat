@echo off
chcp 65001 >nul
setlocal

set PGBIN=C:\Program Files\PostgreSQL\18\bin
set PGPASSWORD=123
set PGUSER=postgres
set PGHOST=localhost
set PGPORT=5432
set DBNAME=boletin360

echo [1/3] Probando conexion a PostgreSQL...
"%PGBIN%\pg_isready.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER%
if %errorlevel% neq 0 (
    echo ERROR: No se pudo conectar a PostgreSQL en %PGHOST%:%PGPORT%
    echo Asegurate de que el servicio postgresql-x64-18 este corriendo.
    exit /b 1
)
echo OK - PostgreSQL conectado.

echo.
echo [2/3] Creando base de datos '%DBNAME%' si no existe...
"%PGBIN%\psql.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='%DBNAME%'" | findstr "1" >nul 2>&1
if %errorlevel% neq 0 (
    "%PGBIN%\psql.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d postgres -c "CREATE DATABASE %DBNAME%;"
    echo OK - Base de datos creada.
) else (
    echo OK - Base de datos ya existe.
)

echo.
echo [3/3] Aplicando migraciones Prisma...
cd /d "%~dp0..\server"
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo WARN: migrate deploy fallo, intentando db push...
    call npx prisma db push --accept-data-loss
)

echo.
echo === Setup completado ===
echo Ahora puedes ejecutar: npm run dev:all
echo (desde la carpeta raiz del proyecto)
