[DOCUMENTACION_PROYECTO.md](https://github.com/user-attachments/files/24502484/DOCUMENTACION_PROYECTO.md)
# Documentación del Proyecto Boletín 360

La app esta siendo elaborada por el equipo TecnoChiguire de la UNETI
Benjamin Dumont
Roiner Martinez 
Samuel Jimenez 

## Descripción General
Boletín 360 es una aplicación web integral para la gestión escolar. Permite administrar estudiantes, docentes, materias, secciones, años escolares y calificaciones. El sistema está diseñado con una arquitectura moderna separando el Frontend y el Backend, garantizando escalabilidad y seguridad.

## Tecnologías Utilizadas

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS (vía postcss)
- **Estado Global**: (Gestión de estado propia/React Context)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL
- **ORM/Driver**: `pg` (node-postgres)
- **Autenticación**: JWT (JSON Web Tokens) y Bcrypt para hashing de contraseñas
- **Validación**: Zod

## Características Principales

### 1. Autenticación y Seguridad
- **Login Seguro**: Implementación de JWT para sesiones seguras.
- **Roles de Usuario**: Soporte para roles (e.g., Administrador, Docente).
- **Protección de Rutas**: Middleware para verificar tokens y permisos en el backend.
- **Hashing de Contraseñas**: Uso de `bcrypt` para almacenar contraseñas de forma segura.

### 2. Gestión de Entudiantes (CRUD Completo)
- Registro completo con datos personales (Cédula, Nombres, Grado, Sección, etc.).
- **Soft Delete**: Los estudiantes eliminados no se borran físicamente, sino que se marcan como "eliminados" (auditable).
- Validación de datos estrictas con esquemas Zod.

### 3. Gestión Académica
- **Docentes**: Administración de la planta profesoral.
- **Materias**: Asignación de materias a docentes, grados y secciones.
- **Grados y Secciones**: Configuración flexible de la estructura escolar.
- **Años Escolares**: Gestión de períodos académicos.

### 4. Sistema de Calificaciones
- Registro de notas por lapsos (Lapso 1, 2 y 3).
- Vinculación de calificaciones con Estudiantes, Materias y Años Escolares.

### 5. Auditoría
- **Audit Logs**: Registro automático de acciones críticas (Creación, Edición, Eliminación) con detalles de quién y cuándo realizó la acción.

## Estructura del Proyecto

### `app/` & `components/` (Frontend)
Contiene la lógica de la interfaz de usuario.
- `(dashboard)/`: Rutas protegidas del panel principal.
- `login/`: Página de inicio de sesión.
- `components/`: Componentes reutilizables (Botones, Modales, Tablas).

### `server/` (Backend)
Contiene la lógica del servidor API.
- `index.ts`: Punto de entrada del servidor Express.
- `db.ts`: Configuración de conexión a PostgreSQL e inicialización de tablas.
- `middleware/`: Middlewares de autenticación (`auth.ts`).
- `schemas.ts`: Definiciones de esquemas de validación Zod.

## Tutorial de Ejecución

### Requisitos Previos
- Node.js instalado (v18+ recomendado).
- PostgreSQL instalado y ejecutándose.

### 1. Configuración de la Base de Datos
Cree una base de datos en PostgreSQL para el proyecto.
Asegúrese de tener la cadena de conexión (Connection String), por ejemplo:
`postgresql://usuario:password@localhost:5432/boletin360`

### 2. Configuración del Backend
1.  Navegue a la carpeta `server`:
    ```bash
    cd Boletin360-main/Boletin360-main/server
    ```
2.  Instale las dependencias:
    ```bash
    npm install
    ```
3.  Cree un archivo `.env` en la carpeta `server` con las siguientes variables:
    ```env
    DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/nombre_tu_db
    JWT_SECRET=tu_clave_secreta_super_segura
    PORT=3001
    ```
4.  Inicie el servidor de desarrollo:
    ```bash
    npm run dev
    ```
    *El servidor se iniciará en el puerto 3001 e intentará crear las tablas automáticamente si no existen.*

### 3. Configuración del Frontend
1.  Abra una nueva terminal y navegue a la raíz del proyecto (donde está el `package.json` principal):
    ```bash
    cd Boletin360-main/Boletin360-main
    ```
2.  Instale las dependencias:
    ```bash
    npm install
    ```
3.  Inicie el servidor de desarrollo de Next.js:
    ```bash
    npm run dev
    ```
4.  Abra su navegador en `http://localhost:3000`.

## Usuario Administrador por Defecto
Al iniciar el backend por primera vez, si no hay usuarios, se creará uno por defecto:
- **Email**: `admin@boletin360.com`
- **Contraseña**: `password`

**¡Importante!**: Cambie esta contraseña inmediatamente después del primer inicio de sesión.
