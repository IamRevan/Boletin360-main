# Contexto de Desarrollo e Integración para IA - Proyecto Boletín 360

Este documento contiene un análisis exhaustivo y técnico de toda la base de código del proyecto **Boletín 360** (desarrollado por el equipo *TecnoChiguire* de la *UNETI*). Su propósito es servir como el contexto de entrada definitivo para que cualquier Inteligencia Artificial o programador comprenda la arquitectura general, el modelo de datos, la lógica del sistema, los bugs críticos existentes y las mejoras prioritarias de programación.

---

## 1. Arquitectura General y Stack Tecnológico

El proyecto está diseñado bajo una arquitectura de tres capas, desacoplando completamente el Frontend del Backend, lo que permite escalabilidad, seguridad e instalación en entornos desconectados (Air-gapped).

### 1.1. Frontend
*   **Framework**: [Next.js](https://nextjs.org/) (Versión 16.0.7 en modo App Router) sobre React 19.2.0.
*   **Mapeo de Estilos**: Tailwind CSS v4 para diseño fluido y componentes modernos.
*   **Lenguaje**: TypeScript 5.
*   **Gestión del Estado**: Contextos y Reducers de React nativos en `/state`, expuestos a través de un facade hook unificado (`useAppState` y `useAppDispatch`).
*   **Cliente HTTP**: Axios con interceptores personalizados para manejo de resiliencia y reintentos automáticos.
*   **Sincronización en tiempo real**: Cliente Socket.io (`socket.io-client`).
*   **Capacidad de Aplicación Web Progresiva (PWA)**: Configurada con `@ducanh2912/next-pwa` para ofrecer acceso offline básico y caching.

### 1.2. Backend
*   **Entorno de ejecución**: Node.js v20+.
*   **Framework**: Express.js v5.2.1.
*   **ORM (Object-Relational Mapping)**: Prisma v5.22.0.
*   **Base de datos**: PostgreSQL 15.8 (desplegada en contenedor).
*   **Autenticación**: JSON Web Tokens (JWT) + encriptación de contraseñas con BcryptJS.
*   **Validación de Datos**: Esquemas Zod para la verificación en tiempo de ejecución.
*   **Servicio de Logging**: Pino Logger para diagnóstico estructurado.

### 1.3. DevOps e Infraestructura
*   **Contenedores**: Docker y Docker Compose para empaquetado de producción.
*   **Servidor Web y Puerta de Enlace**: Servidor Nginx que actúa como proxy reverso para balancear y enrutar las peticiones al puerto `3000` (Next.js) y `/api` al puerto `3001` (Express).
*   **Scripting de arranque**: Scripts en PowerShell (`start-app.ps1`) para Windows y bash (`package-offline.sh`) para compilar imágenes offline y empaquetar en USB para despliegue sin internet en escuelas.
*   **Resguardos**: Tareas programadas (`cron`) diarias para backups físicos de la base de datos y rotación automática de logs (`logrotate`).

---

## 2. Estructura de Directorios Clave

```
Boletin360-main/
├── app/                        # Frontend (Next.js App Router)
│   ├── (dashboard)/            # Rutas protegidas (audit, courses, grades, students, etc.)
│   ├── login/                  # Página y lógica de login
│   ├── globals.css             # Estilos globales y tokens CSS con Tailwind 4
│   ├── layout.tsx              # Layout raíz e inyección de metadatos/fuentes
│   └── providers.tsx           # Envoltura de proveedores globales
├── components/                 # Componentes UI reutilizables
│   ├── ui/                     # Esqueletos, diálogos de confirmación, avatares
│   ├── reports/                # Reportes imprimibles (Resumen, Constancia)
│   ├── ExcelImportModal.tsx    # Modal de importación masiva de estudiantes
│   ├── GradesTable.tsx         # Tabla interactiva para carga de notas
│   └── ModalManager.tsx        # Administrador reactivo de modales globales
├── lib/                        # Clientes compartidos del frontend
│   ├── api.ts                  # Instancia Axios con lógica de offline/idempotencia
│   └── pdfGenerator.ts         # Utilidades de exportación a PDF (html2canvas + jsPDF)
├── server/                     # Backend (Express API)
│   ├── config.ts               # Validación de variables de entorno con Zod
│   ├── db.ts                   # Conexión Prisma con middlewares de Soft Delete
│   ├── index.ts                # Inicialización de Express y Socket.io
│   ├── schemas.ts              # Esquemas de validación Zod compartidos
│   ├── socket.ts               # Servidor de WebSockets (Socket.io)
│   ├── controllers/            # Controladores de lógica de negocio (auth, grades, students, academic)
│   ├── middleware/             # Filtros de Express (rate limiting, auth JWT, idempotency, validate)
│   ├── prisma/                 # Esquema Prisma y script de sembrado (seed.ts)
│   └── routes/                 # Enrutadores Express mapeados por entidad
└── nginx/                      # Configuración de Nginx proxy
```

---

## 3. Modelo de Datos Detallado (Prisma Schema)

La base de datos utiliza PostgreSQL. Las relaciones clave y propiedades del esquema (`server/prisma/schema.prisma`) son:

*   **User**: Representa a los usuarios del sistema. Roles disponibles: `DIRECTOR`, `CONTROL_ESTUDIOS`, `DOCENTE`, `ADMIN`. Mapea la relación opcional de 1-a-1 con la tabla `Teacher` mediante `teacherId`. Soporta borrado lógico (`deletedAt`).
*   **Teacher**: Representa el personal docente. Posee una relación de 1-a-muchos con materias (`Materia[]`) y usuarios (`User[]`).
*   **Student**: Información de los estudiantes. Mapea relaciones hacia `Grado` e `Seccion` usando restricciones `Restrict` (no se pueden borrar grados o secciones que tengan estudiantes). Soporta borrado lógico.
*   **Materia**: Materias escolares. Relaciona a un `Teacher` (docente asignado), un `Grado` y una `Seccion`.
*   **Grado** y **Seccion**: Estructura de cursos escolares (e.g., 1er Año, Sección "A"). Relacionados jerárquicamente.
*   **AnosEscolares**: Períodos escolares lectivos (e.g., 2024-2025).
*   **Calificacion**: Contenedor principal de notas. Mapea un estudiante, una materia y un año escolar. Posee una restricción única compuesta `@@unique([studentId, materiaId, anoEscolarId])` para evitar duplicación física y una bandera `isLocked` para congelar la edición de notas de un estudiante. Relacionado 1-a-muchos con la tabla `Evaluation`.
*   **Evaluation**: Filas de calificaciones de las actividades. Atributos: `lapso` (1, 2, 3), `descripcion`, `nota` (Decimal 5,2) y `ponderacion` (Decimal 5,2). Relación de cascada física con `Calificacion`.
*   **IdempotencyKey**: Clave para evitar duplicidades en peticiones de sincronización en red inestable.

---

## 4. Características de Resiliencia y Offline Sync

Una de las características más avanzadas del sistema es su capacidad de tolerar caídas de red y reanudar operaciones de forma transparente:

1.  **Axios Interceptor (`lib/api.ts`)**: Cada petición que realiza un cambio de estado (`POST`, `PUT`, `DELETE`) genera un `Idempotency-Key` en las cabeceras. Si se detecta un error de red o de servidor (código 0, 502, 503, 504), la petición se almacena en el `offline_queue` en el `localStorage` del navegador.
2.  **Idempotency Middleware (`server/middleware/idempotency.ts`)**: El backend intercepta estas peticiones y revisa si la clave de idempotencia ya está en la tabla `idempotency_keys`. Si existe, devuelve de inmediato la respuesta JSON cacheada anteriormente, evitando insertar o duplicar registros en la base de datos.
3.  **Auto-Sincronización**: Al retornar la conexión a internet (evento `window.addEventListener('online')`), el frontend vacía la cola (`flushOfflineQueue`) secuencialmente de forma automática.

---

## 5. ERRORES CRÍTICOS E INCONSISTENCIAS IDENTIFICADAS (¡Para Corregir!)

Esta sección detalla los fallos lógicos detectados que la IA debe conocer y priorizar para corregir a la hora de escribir código:

### Bug 1: Pérdida total de calificaciones al recargar el navegador (Fallo en `getInitialData`)
*   **Archivo afectado**: `server/controllers/dashboard.controller.ts` (Línea 14 y 53-62).
*   **Descripción**: Cuando el cliente solicita la carga inicial del estado mediante `/api/initial-data`, el backend consulta las calificaciones usando:
    ```typescript
    const calificaciones = await prisma.calificacion.findMany();
    ```
    Y luego mapea el resultado al frontend de la siguiente manera:
    ```typescript
    const formatCalificaciones = calificaciones.map(c => ({
        ...
        lapso1: [], // Las evaluaciones se mapean como arreglos vacíos
        lapso2: [],
        lapso3: []
    }));
    ```
    Dado que las evaluaciones individuales de los lapsos están almacenadas en otra tabla (`Evaluation`) y aquí son forzadas a `[]`, todas las notas y actividades de la base de datos se borran del estado en el cliente cada vez que el usuario recarga la página.
*   **Solución**: Se debe incluir la relación en la consulta de Prisma y formatear el arreglo dividiendo las evaluaciones de acuerdo al campo `lapso` correspondiente (1, 2 o 3):
    ```typescript
    const calificaciones = await prisma.calificacion.findMany({
        include: { evaluations: true }
    });
    // Formatear agrupando por lapso
    ```

### Bug 2: Consulta SQL rota y fallo de tipo en el perfil del estudiante (`getStudentProfile`)
*   **Archivo afectado**: `server/controllers/students.controller.ts` (Línea 109-229).
*   **Descripción**: El controlador que sirve la ruta `/api/students/:id/profile` realiza una consulta SQL cruda (`prisma.$queryRaw`) que intenta seleccionar `c.lapso1`, `c.lapso2`, y `c.lapso3` de la tabla `calificaciones`. Estas columnas no existen en la base de datos física, ya que las notas se guardan en la tabla `evaluations`. Esta consulta fallará inmediatamente y arrojará un error `500` en producción.
*   **Inconsistencia**: Además, el frontend (`app/(dashboard)/students/[id]/page.tsx` - línea 38) asume que `materia.lapso1` es un arreglo de objetos de evaluaciones sobre el cual calcula la media, mientras que la consulta RAW asume que son campos escalares o números directamente (o falla).

### Bug 3: Inundación de peticiones de red al crear columnas de evaluación (Incompatibilidad de Planificación)
*   **Archivo afectado**: `state/DataContext.tsx` (Línea 219-263).
*   **Descripción**: Cuando un docente crea una nueva columna de evaluación para una materia, la acción `ADD_EVALUATIONS` itera sobre el arreglo de `studentIds` (que puede ser de 30 o 40 alumnos) y realiza **un post individual** al servidor mediante `api.syncGrades` por cada estudiante en un bucle:
    ```typescript
    studentIds.forEach((studentId: number) => {
        ...
        api.syncGrades({ studentId, materiaId, ... });
    });
    ```
    Esto causa una inundación masiva de peticiones http simultáneas en el navegador, genera bloqueos en las transacciones de base de datos del servidor y deteriora drásticamente la experiencia del usuario y el rendimiento del servidor.
*   **Solución**: Se requiere implementar un endpoint grupal en el servidor (e.g. `/api/calificaciones/sync-batch`) para crear/actualizar evaluaciones para toda una sección en una sola llamada de red y una sola transacción SQL.

### Bug 4: Falta de Validación de Ponderación Acumulada
*   **Archivo afectado**: `components/AddEvaluationModal.tsx` y `server/controllers/grades.controller.ts`.
*   **Descripción**: No existe verificación alguna que impida que un profesor registre evaluaciones cuya suma de ponderación supere el 100% en un lapso específico. El sistema permite registrar tantas evaluaciones como se desee (e.g. tres exámenes de 40%, sumando 120%), lo que rompe la matemática interna del cálculo de notas cuando se promedia el lapso.

### Bug 5: Error de Sincronización en Docker Compose al Arrancar (Database Ready)
*   **Archivo afectado**: `docker-compose.yml`.
*   **Descripción**: La sección `depends_on` del servicio `api` está configurada únicamente con la dependencia básica de `db`. Si el motor de Postgres tarda unos segundos más de lo habitual en arrancar, el script de inicio del API (`npx prisma migrate deploy`) fallará al no poder conectar con el puerto `5432`, lo que provocará que el contenedor backend falle y se reinicie en un bucle.
*   **Solución**: Añadir una política de reinicio robusta o utilizar `healthcheck` dentro de la base de datos de Docker Compose, configurando el API para arrancar cuando la base de datos esté lista (`service_healthy`).

---

## 6. Recomendaciones y Plan de Mejoras Técnicas

Para mejorar la calidad de código a largo plazo, cualquier desarrollador o IA debería tener en cuenta estas directrices:

### 6.1. Refactorización del Modelo de Evaluaciones (Normalización)
El diseño actual almacena de manera redundante la descripción y ponderación de las evaluaciones en cada fila de estudiante. Esto significa que si hay 35 estudiantes, se almacena 35 veces la descripción "Examen 1" con su respectivo peso.
*   **Propuesta**: Crear un modelo intermedio `MateriaEvaluation` (e.g. `id`, `materiaId`, `anoEscolarId`, `lapso`, `descripcion`, `ponderacion`) y ligar las notas individuales (`Evaluation` o `CalificacionDetail`) a esta definición mediante una clave foránea. Esto simplificará la adición, eliminación y edición de las estructuras de evaluación en una sola consulta.

### 6.2. Uso de Extensiones de Prisma (`$extends`)
El archivo `server/db.ts` utiliza middlewares de Prisma (`prismaClient.$use`), los cuales han sido declarados obsoletos (deprecated) por el equipo de Prisma.
*   **Propuesta**: Migrar la lógica de eliminación lógica (Soft Delete) a extensiones cliente de Prisma usando `prismaClient.$extends` para asegurar compatibilidad con versiones futuras del framework.

### 6.3. Optimización de la Generación de PDFs
La herramienta actual en `lib/pdfGenerator.ts` utiliza `html2canvas` para tomar capturas de pantalla del DOM y renderizarlas en un PDF. Esto ocasiona:
1.  **Pérdida de Calidad**: El texto se rasteriza y se ve borroso al hacer zoom.
2.  **Problemas de Salto de Página**: Las celdas de las tablas se cortan horizontalmente por la mitad si el contenido excede una página.
*   **Propuesta**: Generar los boletines y reportes directamente mediante APIs vectoriales de jsPDF (`doc.text`, `doc.rect`), utilizar la librería `@react-pdf/renderer` para construir el PDF de forma estructurada en el frontend, o delegar la generación al backend a través de Puppeteer y plantillas HTML limpias.

### 6.4. Mecanismo de Sesión Extendida (Refresh Tokens)
El token JWT expira de forma fija en 15 minutos (`{ expiresIn: '15m' }`) en el login. Dado que el sistema no posee un flujo de Refresh Tokens, el usuario es desconectado abruptamente a los 15 minutos en mitad de su labor. Se sugiere implementar Refresh Tokens almacenados en cookies HTTP-only o extender el plazo de expiración del Access Token a un tiempo prudencial de jornada laboral (e.g., 8 horas) considerando que es una intranet de uso local cerrado.

---

Este documento recopila la verdad de la estructura del proyecto y su lógica operativa actual. Al programar, asegúrate de corregir los bugs identificados en la **Sección 5** antes de añadir nuevas funcionalidades para mantener el software robusto y libre de regresiones.
