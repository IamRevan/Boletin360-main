
// Enumeración para el estatus del estudiante
export enum StudentStatus {
  Activo = 'Activo',
  Inactivo = 'Inactivo',
  Egresado = 'Egresado',
}

// Interfaz para Grados (e.g., 1er Año, 2do Año)
export interface Grado {
  id_grado: number;
  nombre_grado: string;
}

// Interfaz para Secciones (e.g., A, B, C)
export interface Seccion {
  id_seccion: number;
  nombre_seccion: string;
}

// Interfaz principal de Estudiante
export interface Student {
  id: number;
  nacionalidad: 'V' | 'E'; // V: Venezolano, E: Extranjero
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  genero: 'F' | 'M';
  fecha_nacimiento: string | null;
  id_grado: number | null; // Relación con Grado
  id_seccion: number | null; // Relación con Sección
  status: StudentStatus;
}

// Enumeración para estatus del docente
export enum TeacherStatus {
  Activo = 'Activo',
  Inactivo = 'Inactivo',
}

// Interfaz de Docente
export interface Teacher {
  id: number;
  nacionalidad: 'V' | 'E';
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  status: TeacherStatus;
}

// Interfaz de Materia (Asignatura)
export interface Materia {
  id: number;
  nombre_materia: string;
  id_docente: number | null; // Docente asignado
  id_grado: number | null;
  id_seccion: number | null;
}

// Interfaz de Año Escolar (Período lectivo)
export interface AñoEscolar {
  id: number;
  nombre: string;
}

// Estructura de una evaluación individual
export interface Evaluacion {
  id: string; // Identificador único (uuid)
  descripcion: string; // Nombre del corte o actividad
  nota: number;
  ponderacion: number; // Porcentaje de valor (e.g., 20 para 20%)
}

// Estructura de Calificaciones para un Estudiante en una Materia y Año específico
export interface Calificacion {
  id: number; // Corresponde al studentId
  id_materia: number;
  id_año_escolar: number;
  lapso1: Evaluacion[]; // Lista de evaluaciones del 1er Lapso
  lapso2: Evaluacion[]; // Lista de evaluaciones del 2do Lapso
  lapso3: Evaluacion[]; // Lista de evaluaciones del 3er Lapso
}

// --- Tipos de Gestión de Usuarios y Seguridad ---

// Roles de Usuario
export enum UserRole {
  Admin = 'Admin',
  Teacher = 'Teacher', // Rol Docente (llamado 'Docente' en la DB pero mapeado aquí)
}

// Interfaz de Usuario del Sistema
export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  password?: string; // Opcional, solo para datos mock o edición
  role: UserRole;
  teacherId?: number | null; // Vinculación con el ID del Docente si aplica
}

// --- Gestión del Estado de la Aplicación ---

// Tipos de Modales disponibles en la aplicación
export enum ModalType {
  AddStudent = 'ADD_STUDENT',
  EditStudent = 'EDIT_STUDENT',
  AddTeacher = 'ADD_TEACHER',
  EditTeacher = 'EDIT_TEACHER',
  AddMateria = 'ADD_MATERIA',
  EditMateria = 'EDIT_MATERIA',
  AddGrado = 'ADD_GRADO',
  EditGrado = 'EDIT_GRADO',
  AddSeccion = 'ADD_SECCION',
  EditSeccion = 'EDIT_SECCION',
  AddSchoolYear = 'ADD_SCHOOL_YEAR',
  EditSchoolYear = 'EDIT_SCHOOL_YEAR',
  ResetPassword = 'RESET_PASSWORD',
  AddUser = 'ADD_USER',
  EditUser = 'EDIT_USER',
  AddEvaluation = 'ADD_EVALUATION',
}

// Estado del Gestor de Modales
export interface ModalState {
  isOpen: boolean; // Si el modal está visible
  modalType: ModalType | null; // Qué modal mostrar
  data: any | null; // Datos necesarios para el modal (e.g., estudiante a editar)
}

// Estado Global de la Aplicación
export interface AppState {
  currentUser: User | null; // Usuario logueado actual
  users: User[]; // Lista de usuarios (Solo Admin ve esto)
  students: Student[]; // Lista de estudiantes
  teachers: Teacher[]; // Lista de docentes
  materias: Materia[]; // Lista de materias
  añosEscolares: AñoEscolar[];
  grados: Grado[];
  secciones: Seccion[];
  calificaciones: Calificacion[];
  modalState: ModalState;
  isLoading?: boolean; // Indicador de carga de datos iniciales
}