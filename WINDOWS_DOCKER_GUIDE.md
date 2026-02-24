# 🐳 Guía de Docker para Windows (Boletín 360)

Esta guía te ayudará a configurar todo desde cero en Windows para que puedas ejecutar el proyecto **Boletín 360** sin complicaciones.

---

## 1. Preparación del Sistema

Antes de instalar Docker, Windows necesita tener activada la tecnología de virtualización.

### Paso A: Activar Virtualización en BIOS
1. Reinicia tu computadora.
2. Presiona repetidamente la tecla de acceso al BIOS (comúnmente `F2`, `F10`, `Del` o `F12`) antes de que Windows cargue.
3. Busca una opción llamada **Intel Virtualization Technology**, **VT-x**, **AMD-V**, o **SVM Mode** y cámbiala a **Enabled**.
4. Guarda los cambios y reinicia.

### Paso B: Activar características de Windows
1. Haz clic en el menú Inicio y busca: **"Activar o desactivar las características de Windows"**.
2. Asegúrate de que las siguientes opciones estén marcadas:
   - [x] **Subsistema de Windows para Linux**
   - [x] **Plataforma de máquina virtual**
3. Haz clic en Aceptar y **reinicia tu computadora** si se te solicita.

---

## 2. Instalación de Docker Desktop

1. Descarga el instalador oficial: [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/).
2. Ejecuta el instalador.
3. Durante la instalación, asegúrate de que la opción **"Use WSL 2 instead of Hyper-V (recommended)"** esté marcada.
4. Al finalizar, cierra sesión en Windows (o reinicia) para aplicar los cambios de grupo de usuario.

---

## 3. Configuración de VS Code

Para trabajar cómodamente, te recomendamos instalar estas extensiones en VS Code:
- **Docker** (de Microsoft)
- **WSL** (de Microsoft)
- **Prettier** (para mantener el código limpio)

---

## 4. Cómo ejecutar el proyecto

Una vez que Docker Desktop esté abierto y funcionando (el ícono de la ballena en la barra de tareas debe estar verde):

1. Abre el proyecto en **VS Code**.
2. Abre una terminal de **PowerShell** dentro de VS Code (`Ctrl + ñ`).
3. Ejecuta el siguiente comando para iniciar todo automáticamente:
   ```powershell
   ./start-app.ps1
   ```

### 💡 Si tienes problemas con el script:
Si Windows te da un error de "política de ejecución", corre este comando primero en PowerShell:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Y luego intenta ejecutar `./start-app.ps1` otra vez.

---

## 5. Solución de Problemas Comunes

### ❌ Docker no inicia o da error de WSL 2
Abre una terminal (PowerShell) y ejecuta:
```powershell
wsl --update
```
Esto actualizará el núcleo de Linux que Docker necesita para funcionar.

### ❌ Error de "Line Endings" (CRLF vs LF)
Si ves errores extraños al iniciar los contenedores (como `\r command not found`), VS Code puede estar guardando los archivos con formato de Windows en vez de Linux.
- Mira en la esquina inferior derecha de VS Code. Si dice **CRLF**, haz clic y cámbialo a **LF**.
- Hemos incluido un archivo `.gitattributes` en el proyecto para intentar prevenir esto automáticamente.

### ❌ Mi puerto 80 está ocupado
Si el sistema dice que el puerto 80 está en uso, cierra aplicaciones como Skype o IIS que podrían estar usándolo.

---

## 📂 Acceso a la App
- **Web**: [http://localhost](http://localhost)
- **API**: [http://localhost/api](http://localhost/api)
- **Usuario**: `admin@boletin360.com`
- **Clave**: `password`
