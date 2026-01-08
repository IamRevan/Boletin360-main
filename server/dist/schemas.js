"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.TeacherSchema = exports.StudentSchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
// Esquema de validación para la creación de usuarios (Administradores/Docentes)
exports.CreateUserSchema = zod_1.z.object({
    nombres: zod_1.z.string().min(1, "Nombres son requeridos"),
    apellidos: zod_1.z.string().min(1, "Apellidos son requeridos"),
    email: zod_1.z.string().email("Dirección de correo inválida"),
    password: zod_1.z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: zod_1.z.enum(['Admin', 'Docente']),
    teacherId: zod_1.z.number().nullable().optional(), // ID opcional si el usuario es un docente
});
// Esquema para actualización de usuarios
exports.UpdateUserSchema = zod_1.z.object({
    nombres: zod_1.z.string().min(1, "Nombres son requeridos"),
    apellidos: zod_1.z.string().min(1, "Apellidos son requeridos"),
    email: zod_1.z.string().email("Dirección de correo inválida"),
    password: zod_1.z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(zod_1.z.literal('')), // Permite string vacío para no cambiar contraseña
    role: zod_1.z.enum(['Admin', 'Docente']),
    teacherId: zod_1.z.number().nullable().optional(),
});
// Esquema para datos de Estudiantes
exports.StudentSchema = zod_1.z.object({
    nacionalidad: zod_1.z.enum(['V', 'E']), // Venezolano o Extranjero
    cedula: zod_1.z.string().regex(/^\d+$/, "La cédula debe ser numérica"),
    nombres: zod_1.z.string().min(1),
    apellidos: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    genero: zod_1.z.enum(['M', 'F']),
    fecha_nacimiento: zod_1.z.string().or(zod_1.z.date()), // Acepta fecha string (ISO) o objeto Date
    id_grado: zod_1.z.number(),
    id_seccion: zod_1.z.number(),
    status: zod_1.z.string(), // e.g., 'Activo', 'Retirado'
});
// Esquema para datos de Docentes
exports.TeacherSchema = zod_1.z.object({
    nacionalidad: zod_1.z.enum(['V', 'E']),
    cedula: zod_1.z.string().regex(/^\d+$/, "La cédula debe ser numérica"),
    nombres: zod_1.z.string().min(1),
    apellidos: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    status: zod_1.z.string(),
});
// Esquema para inicio de sesión
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
