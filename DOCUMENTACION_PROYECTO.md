# Documentación del Proyecto Boletín 360

## Descripción General
Boletín 360 es una aplicación web integral para la gestión escolar. Permite administrar estudiantes, docentes, materias, secciones, años escolares y calificaciones. El sistema está diseñado con una arquitectura moderna separando el Frontend y el Backend, garantizando escalabilidad y seguridad.

## Tecnologías Utilizadas (Stack Tecnológico)

El proyecto utiliza una pila de tecnologías robusta y moderna, preparada para producción mediante contenedores:

### Frontend
-   **Framework**: [Next.js](https://nextjs.org/) (React 19)
-   **Lenguaje**: TypeScript
-   **Estilos**: Tailwind CSS 4
-   **Iconos**: Componentes SVG personalizados
-   **HTTP Client**: Axios

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Base de Datos**: PostgreSQL 15
-   **ORM**: [Prisma](https://www.prisma.io/) (Esquema definido, disponible para migración) / Controlador nativo `pg`
-   **Autenticación**: JWT (JSON Web Tokens) + Bcrypt
-   **Validación**: Zod
-   **Auditoría**: Sistema de logging de acciones críticas

### Infraestructura y Despliegue
-   **Containerización**: Docker & Docker Compose
-   **Servidor Web / Proxy**: Nginx (Alpine)
-   **Gestor de Procesos**: PM2 (para entornos sin Docker)

## Características Principales

### 1. Autenticación y RBAC (Control de Acceso Basado en Roles)
-   **Roles**: Administrador, Director, Control de Estudios, Docente.
-   **Seguridad**: Rutas protegidas por middleware de verificación de JWT y Roles.

### 2. Gestión Académica
-   **Estudiantes**: CRUD completo con Soft Delete.
-   **Docentes**: Gestión de planta profesoral.
-   **Materias/Grados/Secciones/Años**: Configuración flexible del entorno escolar.

### 3. Sistema de Calificaciones (Notas)
-   **Carga de Notas**: Por lapsos (1°, 2°, 3°).
-   **Bloqueo de Notas**: Funcionalidad para que 'Control de Estudios' bloquee la edición después de una fecha límite.
-   **Validación**: Rango estricto de 0-20 puntos.

### 4. Reportes Avanzados
-   **Boletín Individual**: Generación de PDF optimizado para impresión (A4), con diseño oficial, firmas y formato de celdas adaptable.
-   **Actas de Evaluación**: Reporte grupal por Sección/Materia exportable a **Excel (.xlsx)**.

## Estructura del Proyecto

```
Boletin360/
├── app/                  # Frontend (Next.js App Router)
│   ├── (dashboard)/      # Rutas autenticadas
│   └── components/       # Componentes UI (Reports, Forms, UI)
├── server/               # Backend (Express API)
│   ├── prisma/           # Esquema de Prisma ORM
│   ├── index.ts          # Entrypoint
│   └── db.ts             # Conexión DB
├── nginx/                # Configuración de Nginx
├── docker-compose.yml    # Orquestación de contenedores
└── start-app.ps1         # Script de inicio rápido (Windows)
```

## Tutorial de Instalación y Ejecución

### Opción A: Ejecución Automática con Docker (Recomendado)
*Requiere Docker Desktop instalado.*

1.  Ejecute el script de inicio en PowerShell:
    ```powershell
    ./start-app.ps1
    ```
    O manualmente:
    ```bash
    docker-compose up --build -d
    ```
2.  Acceda a la aplicación en: `http://localhost`

### Opción B: Ejecución Manual con Node.js

**Requisitos**: Node.js v18+, PostgreSQL corriendo localmente.

#### 1. Backend
1.  Ir a `server/`.
2.  `npm install`.
3.  Crear `.env`:
    ```env
    DATABASE_URL=postgresql://postgres:password@localhost:5432/boletin360
    JWT_SECRET=secreto
    PORT=3001
    ```
4.  `npm run dev` (o use `pm2 start ecosystem.config.js`).

#### 2. Frontend
1.  Ir a la raíz.
2.  `npm install`.
3.  `npm run dev`.
4.  Acceder a `http://localhost:3000`.

## Usuario por Defecto
-   **Email**: `admin@boletin360.com`
-   **Contraseña**: `password`
