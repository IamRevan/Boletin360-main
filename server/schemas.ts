import { z } from 'zod';

// Esquema de validación para la creación de usuarios (Administradores/Docentes)
export const CreateUserSchema = z.object({
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email("Dirección de correo inválida"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.enum(['Admin', 'Director', 'Control de Estudios', 'Docente']),
    teacherId: z.number().nullable().optional(), // ID opcional si el usuario es un docente
});

// Esquema para actualización de usuarios
export const UpdateUserSchema = z.object({
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email("Dirección de correo inválida"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal('')), // Permite string vacío para no cambiar contraseña
    role: z.enum(['Admin', 'Director', 'Control de Estudios', 'Docente']),
    teacherId: z.number().nullable().optional(),
});

// Esquema para datos de Estudiantes
export const StudentSchema = z.object({
    nacionalidad: z.enum(['V', 'E']), // Venezolano o Extranjero
    cedula: z.string().regex(/^\d+$/, "La cédula debe ser numérica"),
    nombres: z.string().min(1),
    apellidos: z.string().min(1),
    email: z.string().email(),
    genero: z.enum(['M', 'F']),
    fecha_nacimiento: z.string().or(z.date()).optional().nullable(),
    lugar_nacimiento: z.string().optional(),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    nombre_representante: z.string().optional(),
    cedula_representante: z.string().optional(),
    telefono_representante: z.string().optional(),
    email_representante: z.string().email().optional().or(z.literal('')),
    observaciones: z.string().optional(),
    id_grado: z.number().nullable().optional(),
    id_seccion: z.number().nullable().optional(),
    status: z.string().optional(), // e.g., 'Activo', 'Retirado'
});

// Esquema para datos de Docentes
export const TeacherSchema = z.object({
    nacionalidad: z.enum(['V', 'E']),
    cedula: z.string().regex(/^\d+$/, "La cédula debe ser numérica"),
    nombres: z.string().min(1),
    apellidos: z.string().min(1),
    email: z.string().email(),
    status: z.string(),
});

// Esquema para inicio de sesión
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// Validación de Nota individual (0-20)
const GradeItemSchema = z.object({
    nombre: z.string(),
    nota: z.number().min(0, "La nota mínima es 0").max(20, "La nota máxima es 20"),
    ponderacion: z.number().min(0).max(100),
});

// Esquema para sincronización de calificaciones
export const GradeSyncSchema = z.object({
    studentId: z.number(),
    materiaId: z.number(),
    añoId: z.number(),
    lapso1: z.array(GradeItemSchema),
    lapso2: z.array(GradeItemSchema),
    lapso3: z.array(GradeItemSchema),
});
