# Script de Inicio Automático para Boletin360
Write-Host "Iniciando Boletin360 con Docker Compose..." -ForegroundColor Green

# Verificar si Docker está corriendo
if (-not (Get-Process docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker Desktop no parece estar ejecutándose. Por favor inícialo primero." -ForegroundColor Red
    exit 1
}

# Construir e iniciar contenedores
docker-compose up --build -d

if ($?) {
    Write-Host "¡Sistema iniciado correctamente!" -ForegroundColor Green
    Write-Host "Frontend disponible en: http://localhost" -ForegroundColor Cyan
    Write-Host "API disponible en: http://localhost/api" -ForegroundColor Cyan
    Write-Host "Base de Datos en puerto: 5432" -ForegroundColor Cyan
} else {
    Write-Host "Hubo un error al iniciar los contenedores." -ForegroundColor Red
}

Read-Host -Prompt "Presiona Enter para salir"
