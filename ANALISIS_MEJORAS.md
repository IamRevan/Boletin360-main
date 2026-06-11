# Análisis de Mejoras - Boletín 360

## 🔴 Crítico — Arquitectura / Deuda Técnica

| Problema | Impacto | Propuesta |
|----------|---------|-----------|
| `as any` generalizado en Prisma queries | Oculta errores de tipo, dificulta migraciones futuras | Tipar correctamente los campos `Decimal`, `DateTime`, `deletedAt` con helpers de Prisma |
| Consultas SQL raw (`$queryRaw`) en `getBoletin`, `getActa`, `exportXlsx` | No portables, riesgo de inyección aunque con parámetros, difíciles de mantener | Migrar a consultas Prisma tipadas con `groupBy` y `aggregate` |
| Modelo de Evaluaciones normalizado | `evaluations` separadas de `calificaciones` obliga a subconsultas complejas | Evaluar si conviene desnormalizar (JSONB con notas por lapso) o crear vistas materializadas |
| Sin migraciones automáticas en producción | `prisma migrate deploy` en startup puede fallar si hay conflictos | Separar migraciones del ciclo de vida del servidor |
| No hay tests | Cualquier cambio puede romper funcionalidad existente | Agregar tests de integración para los endpoints críticos (grades, reports, students) |

## 🟡 Medio — UX / Funcionalidades

| Problema | Propuesta |
|----------|-----------|
| No hay paginación en listas de estudiantes | Con 500+ estudiantes la UI se vuelve lenta. Agregar paginación server-side con `take`/`skip` |
| Búsqueda de estudiantes solo por nombre/cédula | Agregar filtros combinados: grado + sección + estatus + año escolar |
| No hay edición en línea (inline edit) en gradebook | Actualmente hay que abrir modal para editar nota. Mejorar con celda editable directa |
| No hay historial de notas por materia | El perfil del estudiante muestra el histórico, pero no hay vista comparativa lapso a lapso |
| No hay exportación PDF masiva | Solo se puede exportar boletín individual. Agregar exportación por lote (grado/sección completa) |
| Estadísticas del Dashboard son genéricas | Agregar: promedio general por grado, materias con mayor reprobación, tendencia por lapso |
| No hay recuperación de contraseña | No hay flujo de "olvidé mi contraseña". Depende del admin resetear manualmente |

## 🟢 Bajo — Pulido / Calidad de Vida

| Problema | Propuesta |
|----------|-----------|
| `alert()`/`confirm()` residual en algunos componentes | Ya se migró la mayoría. Revisar si queda alguno. |
| Sin skeleton loading en páginas de reportes | Agregar esqueletos mientras se genera el reporte |
| Sin feedback de "sin datos" en tablas vacías | Agregar mensajes descriptivos cuando no hay estudiantes/materias/evaluaciones |
| Sin atajos de teclado | Atajos para guardar notas (Ctrl+Enter), navegar entre celdas (Tab/Shift+Tab) |
| Sin logging estructurado en backend | Los `console.error` no son buscables. Usar `pino` o `winston` con niveles |
| Docker sin multi-stage build | La imagen actual incluye devDependencies en producción |

## 🔄 Reworks Recomendados

### 1. Gradebook (Hoja de Evaluación) — REWORK ALTO

**Estado actual:** Celda única con nota numérica, evaluación única "Acumulativa".

**Problema:** Un docente puede tener múltiples evaluaciones por lapso con diferentes ponderaciones.

**Propuesta:**
- Vista de matriz: filas = estudiantes, columnas = evaluaciones (definidas por el docente)
- Cada columna tiene su propia ponderación configurable
- Promedio ponderado automático por lapso
- Validación en tiempo real de suma de ponderaciones ≤ 100%

### 2. Gestión de Evaluaciones (AddEvaluationModal) — REWORK MEDIO

**Estado actual:** Modal simple que agrega una evaluación con descripción, nota y ponderación.

**Propuesta:**
- Definir plantillas de evaluación reutilizables por materia
- Permitir evaluación porcentual (30% de la nota final) vs puntual (0-20 pts)
- Vista previa del efecto en la nota final antes de guardar

### 3. Módulo de Asistencia — REWORK ALTO (NUEVA FUNCIONALIDAD)

**Estado actual:** No existe.

**Propuesta:**
- Registro de asistencia diaria por materia
- Vista semanal/mensual del porcentaje de asistencia
- Reporte de inasistencias para el boletín
- Umbral configurable de 75% (Ley Educativa Venezolana)

### 4. Perfil del Estudiante — REWORK MEDIO

**Estado actual:** Datos personales + histórico de calificaciones en crudo.

**Propuesta:**
- Timeline visual de la trayectoria académica
- Gráfico de evolución de notas por materia a través de los lapsos
- Sección de observaciones por período
- Documentos asociados (ficha de inscripción, constancias descargables)

### 5. Sistema de Roles y Permisos — REWORK BAJO

**Estado actual:** Roles fijos (ADMIN, DIRECTOR, CONTROL_ESTUDIOS, DOCENTE) con lógica esparcida en guards.

**Propuesta:**
- Tabla `permissions` con granularidad fina (ej: `grades:write`, `students:export`)
- Asignación de permisos por rol desde UI de administración
- Auditoría centralizada (ya hay `AuditLog` pero sin UI de consulta)

### 6. API Idempotencia y Cache — REWORK BAJO

**Estado actual:** Ya existe middleware de idempotencia pero no se usa activamente.

**Propuesta:**
- Cachear reportes (boletín/constancia) con TTL de 5 minutos
- Usar `IdempotencyKey` para el endpoint batch de calificaciones (evita duplicados en retry)

## 📊 Priorización Sugerida

```
FASE A (Próximo sprint)
  ├── Gradebook rework (matriz evaluaciones × ponderaciones)
  ├── Paginación server-side en estudiantes
  └── Migrar $queryRaw → Prisma tipado en reportes

FASE B (Sprint siguiente)
  ├── Módulo de Asistencia (base)
  ├── Perfil del estudiante mejorado (timeline + gráficos)
  └── Exportación PDF masiva por grado/sección

FASE C (Mantenimiento continuo)
  ├── Eliminar `as any` progresivamente
  ├── Tests de integración
  ├── Logging estructurado
  └── Atajos de teclado
```
