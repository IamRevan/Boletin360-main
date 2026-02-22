import { z } from 'zod';

// Esquema de validación para la creación de usuarios (Administradores/Docentes)
export const CreateUserSchema = z.object({
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email("Dirección de correo inválida"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.enum(['ADMIN', 'DIRECTOR', 'CONTROL_ESTUDIOS', 'DOCENTE']),
    teacherId: z.number().nullable().optional(), // ID opcional si el usuario es un docente
});

// Esquema para actualización de usuarios
export const UpdateUserSchema = z.object({
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email("Dirección de correo inválida"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal('')), // Permite string vacío para no cambiar contraseña
    role: z.enum(['ADMIN', 'DIRECTOR', 'CONTROL_ESTUDIOS', 'DOCENTE']),
    teacherId: z.number().nullable().optional(),
});

// Esquema para datos de Estudiantes
export const StudentSchema = z.object({
    nacionalidad: z.enum(['V', 'E']),
    cedula: z.string().regex(/^\d+$/, "La cédula debe ser numérica"),
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    genero: z.enum(['M', 'F']),
    fechaNacimiento: z.string().or(z.date()).optional().nullable(),
    lugarNacimiento: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    representante: z.string().optional().nullable(),
    cedulaR: z.string().optional().nullable(),
    telefonoR: z.string().optional().nullable(),
    emailR: z.string().email().optional().or(z.literal('')).nullable(),
    observaciones: z.string().optional().nullable(),
    idGrado: z.number().nullable().optional(),
    idSeccion: z.number().nullable().optional(),
    status: z.enum(['ACTIVO', 'RETIRADO', 'GRADUADO', 'INACTIVO']).optional(),
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

// Evaluation Item Schema
const EvalItemSchema = z.object({
    descripcion: z.string(),
    nota: z.number().min(0).max(20),
    ponderacion: z.number().min(0).max(100)
});

// Grade Synchronization Schema
export const GradeSyncSchema = z.object({
    studentId: z.number(),
    materiaId: z.number(),
    anoEscolarId: z.number(),
    lapso1: z.array(EvalItemSchema),
    lapso2: z.array(EvalItemSchema),
    lapso3: z.array(EvalItemSchema)
});
