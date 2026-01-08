import { z } from 'zod';

// Esquema de validación para la creación de usuarios (Administradores/Docentes)
export const CreateUserSchema = z.object({
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email("Dirección de correo inválida"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.enum(['Admin', 'Docente']),
    teacherId: z.number().nullable().optional(), // ID opcional si el usuario es un docente
});

// Esquema para actualización de usuarios
export const UpdateUserSchema = z.object({
    nombres: z.string().min(1, "Nombres son requeridos"),
    apellidos: z.string().min(1, "Apellidos son requeridos"),
    email: z.string().email("Dirección de correo inválida"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal('')), // Permite string vacío para no cambiar contraseña
    role: z.enum(['Admin', 'Docente']),
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
    fecha_nacimiento: z.string().or(z.date()), // Acepta fecha string (ISO) o objeto Date
    id_grado: z.number(),
    id_seccion: z.number(),
    status: z.string(), // e.g., 'Activo', 'Retirado'
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
