
// Student Status Enum (Strict values from Prisma)
export enum StudentStatus {
  ACTIVO = 'ACTIVO',
  RETIRADO = 'RETIRADO',
  GRADUADO = 'GRADUADO',
  INACTIVO = 'INACTIVO'
}

// Interfaz para Grados (e.g., 1er Año, 2do Año)
export interface Grado {
  id: number;
  nombreGrado: string;
  anoEscolarId: number;
}

// Interfaz para Secciones (e.g., A, B, C)
export interface Seccion {
  id: number;
  nombreSeccion: string;
  idGrado: number; // Linked class
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
  fechaNacimiento: string | null;
  idGrado: number | null; // Relación con Grado
  idSeccion: number | null; // Relación con Sección
  status: StudentStatus;
  lugarNacimiento?: string;
  direccion?: string;
  telefono?: string;
  representante?: string;
  cedulaR?: string;
  telefonoR?: string;
  emailR?: string;
  observaciones?: string;
}

// Teacher Status Enum (Strict values from Prisma)
export enum TeacherStatus {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO'
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
  nombreMateria: string;
  idDocente: number | null; // Docente asignado
  idGrado: number | null;
  idSeccion: number | null;
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
  id: number; // Unique PK
  studentId: number;
  materiaId: number;
  anoEscolarId: number;
  isLocked: boolean;
  lapso1: Evaluacion[]; // Lista de evaluaciones del 1er Lapso
  lapso2: Evaluacion[]; // Lista de evaluaciones del 2do Lapso
  lapso3: Evaluacion[]; // Lista de evaluaciones del 3er Lapso
}

// User Roles Enum (Strict values from Prisma)
export enum UserRole {
  DIRECTOR = 'DIRECTOR',
  CONTROL_ESTUDIOS = 'CONTROL_ESTUDIOS',
  DOCENTE = 'DOCENTE',
  ADMIN = 'ADMIN'
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

// ... (interfaces)

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string; // ISO Date
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string; // ISO Date
}

// ...

export enum ModalType {
  AddStudent = 'ADD_STUDENT',
  EditStudent = 'EDIT_STUDENT',
  AddTeacher = 'ADD_TEACHER',
  EditTeacher = 'EDIT_TEACHER',
  AddMateria = 'ADD_MATERIA',
  EditMateria = 'EDIT_MATERIA',
  AddGrado = 'ADD_GRADO',
  EditGrado = 'EDIT_GRADO',
  BatchAddGrado = 'BATCH_ADD_GRADO',
  AddSeccion = 'ADD_SECCION',
  EditSeccion = 'EDIT_SECCION',
  BatchAddSeccion = 'BATCH_ADD_SECCION',
  AddSchoolYear = 'ADD_SCHOOL_YEAR',
  EditSchoolYear = 'EDIT_SCHOOL_YEAR',
  ResetPassword = 'RESET_PASSWORD',
  AddUser = 'ADD_USER',
  EditUser = 'EDIT_USER',
  AddEvaluation = 'ADD_EVALUATION',
  CreateAnnouncement = 'CREATE_ANNOUNCEMENT',
}

export interface ModalState {
  isOpen: boolean;
  modalType: ModalType | null;
  data: any | null;
}

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
  announcements: Announcement[]; // Global announcements
  notifications: Notification[]; // User notifications
  modalState: ModalState;
  isLoading?: boolean; // Indicador de carga de datos iniciales
}