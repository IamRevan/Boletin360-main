# Guía de Despliegue en Servidor Ubuntu Sin Conexión (Air-gapped)

Este documento detalla los pasos necesarios para instalar y ejecutar el sistema **Boletin360** en un servidor Ubuntu limpio (instalación desde cero) que cuenta con conexión a internet muy limitada o nula. 

Dado que el servidor no tiene internet, no podemos ejecutar comandos como `apt install` o `npm install` directamente. La estrategia será **empaquetar todo mediante Docker en una máquina con internet**, transferirlo mediante una memoria USB, y levantarlo en el servidor objetivo.

---

## FASE 1: Preparación (En una computadora CON internet)

En esta fase, prepararemos todos los archivos, dependencias e imágenes de contenedores necesarios para llevarlos al servidor offline.

### 1. Descargar paquetes de instalación de Docker
En un equipo con Ubuntu/Debian que sí tenga internet, descarga los paquetes `.deb` necesarios para instalar Docker offline:
```bash
mkdir docker-offline-debs
cd docker-offline-debs
apt-get download containerd.io docker-ce docker-ce-cli docker-buildx-plugin docker-compose-plugin
cd ..
```

### 2. Construir y guardar las imágenes de Docker de la aplicación
En la computadora con internet, colócate en la carpeta raíz del proyecto `Boletin360-main` y construye las imágenes:
```bash
# Construir las imágenes de la base de datos, API, Frontend y Nginx
sudo docker-compose build

# Descargar las imágenes base de Nginx y PostgreSQL
sudo docker pull postgres:15.8-alpine
sudo docker pull nginx:1.25-alpine

# Guardar TODAS las imágenes en un archivo comprimido .tar
sudo docker save -o boletin360-images.tar boletin360-main-api boletin360-main-web postgres:15.8-alpine nginx:1.25-alpine
```

### 3. Transferir al pendrive (USB)
Copia a tu memoria USB los siguientes elementos:
1. La carpeta `docker-offline-debs/` (con los instaladores de Docker).
2. El archivo de imágenes `boletin360-images.tar`.
3. Todo el código fuente del proyecto (la carpeta `Boletin360-main`, asegurándote de incluir el archivo `docker-compose.yml` y las carpetas de scripts).

---

## FASE 2: Instalación (En el servidor Ubuntu SIN internet)

En esta fase, conectamos nuestra memoria USB al servidor destino de la escuela.

### 1. Montar la memoria USB y copiar los archivos
Conecta la USB y copia los archivos al servidor:
```bash
# Crear directorio de instalación
sudo mkdir -p /opt/boletin360
# Supongamos que la USB se montó en /media/usb
sudo cp -r /media/usb/Boletin360-main /opt/boletin360/
sudo cp -r /media/usb/docker-offline-debs /opt/boletin360/
sudo cp /media/usb/boletin360-images.tar /opt/boletin360/
```

### 2. Instalar Docker Offline
Instala los paquetes de Docker usando `dpkg`:
```bash
cd /opt/boletin360/docker-offline-debs
sudo dpkg -i *.deb
```
*(Nota: Si hay errores de dependencias genéricas faltantes como iptables, deberás descargarlas en la Fase 1 de la misma forma).*

Activa el servicio de Docker:
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 3. Cargar las Imágenes de Docker
Carga el archivo `.tar` que contiene las imágenes de la aplicación pre-compiladas:
```bash
cd /opt/boletin360
sudo docker load -i boletin360-images.tar
```
Verifica que las imágenes cargaron correctamente: `sudo docker images`

---

## FASE 3: Ejecución y Mantenimiento

### 1. Levantar el Sistema
Una vez que las imágenes están cargadas y el código fuente está en `/opt/boletin360/Boletin360-main`, simplemente levanta el sistema con Docker Compose:
```bash
cd /opt/boletin360/Boletin360-main
sudo docker compose up -d
```
Docker Compose creará la red interna, montará los volúmenes para persistir la base de datos, e iniciará PostgreSQL, el API (ejecutando automáticamente `prisma migrate deploy`), el Frontend y el Gateway de Nginx.

### 2. Configurar Backups Automáticos
El sistema incluye un script `scripts/setup-backup-cron.sh` para programar copias de seguridad de la base de datos.
```bash
cd /opt/boletin360/Boletin360-main/scripts
sudo chmod +x backup-db.sh setup-backup-cron.sh
sudo ./setup-backup-cron.sh
```
Esto creará un trabajo `cron` que diariamente a las 02:00 AM hará un respaldo comprimido de la base de datos dentro de `/var/backups/boletin360`.

### 3. Rotación de Logs del Sistema
Para evitar que el disco se llene con logs históricos a lo largo de los meses, configura la herramienta de rotación nativa de Linux:
```bash
sudo chmod +x setup-logrotate.sh
sudo ./setup-logrotate.sh
```

---

## FASE 4: Verificación
Desde cualquier computadora conectada a la red LAN de la escuela (ej. un cable conectado al mismo switch del servidor), abre el navegador e ingresa la IP local del servidor:
`http://192.168.1.X/` (Reemplaza con la IP real del servidor).

El sistema Nginx interceptará la petición, la pasará al Next.js, y el sistema funcionará aisladamente sin requerir ninguna descarga externa.

**¡El sistema Boletin360 está listo y en producción!**
