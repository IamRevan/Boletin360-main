# Script de Inicio Automático para Boletin360
# TIP: Si el script no corre por políticas de Windows, ejecuta:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Clear-Host
Write-Host "==============================================" -ForegroundColor Gray
Write-Host "       BOLETIN 360 - SISTEMA GESTION          " -ForegroundColor Cyan -NoNewline
Write-Host " [DOCKER]" -ForegroundColor White
Write-Host "==============================================" -ForegroundColor Gray

# 1. Verificar si Docker está instalado y respondiendo
Write-Host "[1/3] Verificando Docker Engine..." -ForegroundColor Yellow
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker no está respondiendo." -ForegroundColor Red
    Write-Host "Asegúrate de que Docker Desktop esté ABIERTO y el ícono de la ballena esté en verde." -ForegroundColor White
    Read-Host -Prompt "Presiona Enter para salir"
    exit 1
}
Write-Host "✔ Docker está listo." -ForegroundColor Green

# 2. Detectar comando de Compose (Moderno vs Antiguo)
$composeCmd = "docker compose"
docker compose version >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    docker-compose version >$null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $composeCmd = "docker-compose"
    } else {
        Write-Host "ERROR: No se encontró 'docker compose' ni 'docker-compose'." -ForegroundColor Red
        Write-Host "Por favor instala Docker Desktop correctamente." -ForegroundColor White
        Read-Host -Prompt "Presiona Enter para salir"
        exit 1
    }
}

# 3. Iniciar Contenedores
Write-Host "[2/3] Levantando servicios con $($composeCmd)..." -ForegroundColor Yellow
Invoke-Expression "$composeCmd up --build -d"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✔ Contenedores iniciados correctamente." -ForegroundColor Green
    
    Write-Host "`n[3/3] Resumen de Acceso:" -ForegroundColor Yellow
    Write-Host "----------------------------------------------" -ForegroundColor Gray
    Write-Host "  🌐 Frontend: " -NoNewline; Write-Host "http://localhost" -ForegroundColor Cyan
    Write-Host "  🔌 API:      " -NoNewline; Write-Host "http://localhost/api" -ForegroundColor Cyan
    Write-Host "  🗄️ Database: " -NoNewline; Write-Host "Puerto 5432" -ForegroundColor Cyan
    Write-Host "----------------------------------------------" -ForegroundColor Gray
    Write-Host "`n¡Proyecto listo para usar!" -ForegroundColor Green
} else {
    Write-Host "`nERROR: Hubo un problema al iniciar los contenedores." -ForegroundColor Red
    Write-Host "Revisa los mensajes de arriba para más detalles." -ForegroundColor White
}

Write-Host "`n"
Read-Host -Prompt "Presiona Enter para cerrar esta ventana"
