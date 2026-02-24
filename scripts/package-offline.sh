#!/bin/bash

# BOLETIN 360 - Offline Packaging Script
# Automates the process of building and saving Docker images for air-gapped deployment.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   BOLETIN 360 - EMPAQUETADO OFFLINE        ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: Archivo .env no encontrado en la raíz.${NC}"
    echo -e "Por favor, crea uno basado en .env.example o asegúrate de que exista."
    exit 1
fi

# 1. Building and Pulling
echo -e "${YELLOW}[1/3] Construyendo imágenes locales y descargando bases...${NC}"
docker compose build
docker pull postgres:15.8-alpine
docker pull nginx:1.25-alpine

# 2. Saving to TAR
EXPORT_FILE="boletin360-images-$(date +%F).tar"
echo -e "${YELLOW}[2/3] Guardando imágenes en $EXPORT_FILE...${NC}"

# Identify local image names (assuming they follow the project folder name prefix)
# We use explicit list to be safe.
docker save -o "$EXPORT_FILE" \
    boletin360-api:latest \
    boletin360-web:latest \
    postgres:15.8-alpine \
    nginx:1.25-alpine

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Imágenes guardadas correctamente en: $EXPORT_FILE${NC}"
else
    echo -e "${RED}✘ Error al guardar las imágenes.${NC}"
    exit 1
fi

# 3. Final steps
echo -e "${YELLOW}[3/3] Resumen de empaquetado:${NC}"
echo -e "----------------------------------------------"
echo -e "1. Archivo generado: ${GREEN}$EXPORT_FILE${NC}"
echo -e "2. Tamaño total: ${BLUE}$(du -h "$EXPORT_FILE" | cut -f1)${NC}"
echo -e "3. Próximo paso: Copia este archivo y la carpeta del proyecto a tu USB."
echo -e "----------------------------------------------"
echo -e "${GREEN}¡Empaquetado completado con éxito!${NC}"
