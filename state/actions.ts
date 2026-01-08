import { Student, Teacher, Materia, AñoEscolar, Grado, Seccion, User, Evaluacion, Calificacion, ModalType } from '../types';

// Tipos de acciones para el reducer global
export enum ActionType {
  // Autenticación
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGOUT = 'LOGOUT',

  // Gestión de Modales
  OPEN_MODAL = 'OPEN_MODAL',
  CLOSE_MODAL = 'CLOSE_MODAL',

  // Usuarios
  UPDATE_CURRENT_USER_PROFILE = 'UPDATE_CURRENT_USER_PROFILE',
  SAVE_USER = 'SAVE_USER',
  DELETE_USER = 'DELETE_USER',

  // Estudiantes
  SAVE_STUDENT = 'SAVE_STUDENT',
  DELETE_STUDENT = 'DELETE_STUDENT',

  // Docentes
  SAVE_TEACHER = 'SAVE_TEACHER',
  DELETE_TEACHER = 'DELETE_TEACHER',

  // Materias
  SAVE_MATERIA = 'SAVE_MATERIA',
  DELETE_MATERIA = 'DELETE_MATERIA',

  // Años Escolares
  SAVE_SCHOOL_YEAR = 'SAVE_SCHOOL_YEAR',
  DELETE_SCHOOL_YEAR = 'DELETE_SCHOOL_YEAR',

  // Grados
  SAVE_GRADO = 'SAVE_GRADO',
  DELETE_GRADO = 'DELETE_GRADO',

  // Secciones
  SAVE_SECCION = 'SAVE_SECCION',
  DELETE_SECCION = 'DELETE_SECCION',

  // Calificaciones
  ADD_EVALUATIONS = 'ADD_EVALUATIONS',
  UPDATE_EVALUATION_GRADE = 'UPDATE_EVALUATION_GRADE',
  DELETE_EVALUATION_COLUMN = 'DELETE_EVALUATION_COLUMN',

  // Datos Iniciales
  SET_INITIAL_DATA = 'SET_INITIAL_DATA',
}

// Payloads de las acciones
export type Action =
  | { type: ActionType.LOGIN_SUCCESS; payload: User }
  | { type: ActionType.LOGOUT }
  | { type: ActionType.OPEN_MODAL; payload: { modal: ModalType; data?: any } }
  | { type: ActionType.CLOSE_MODAL }
  | { type: ActionType.UPDATE_CURRENT_USER_PROFILE; payload: { userId: number; updates: Partial<User> & { oldPassword?: string; newPassword?: string; } } }
  | { type: ActionType.SAVE_USER; payload: Omit<User, 'id'> | User }
  | { type: ActionType.DELETE_USER; payload: number }
  | { type: ActionType.SAVE_STUDENT; payload: Omit<Student, 'id'> | Student }
  | { type: ActionType.DELETE_STUDENT; payload: number }
  | { type: ActionType.SAVE_TEACHER; payload: Omit<Teacher, 'id'> | Teacher }
  | { type: ActionType.DELETE_TEACHER; payload: number }
  | { type: ActionType.SAVE_MATERIA; payload: Omit<Materia, 'id'> | Materia }
  | { type: ActionType.DELETE_MATERIA; payload: number }
  | { type: ActionType.SAVE_SCHOOL_YEAR; payload: Omit<AñoEscolar, 'id'> | AñoEscolar }
  | { type: ActionType.DELETE_SCHOOL_YEAR; payload: number }
  | { type: ActionType.SAVE_GRADO; payload: Omit<Grado, 'id_grado'> | Grado }
  | { type: ActionType.DELETE_GRADO; payload: number }
  | { type: ActionType.SAVE_SECCION; payload: Omit<Seccion, 'id_seccion'> | Seccion }
  | { type: ActionType.DELETE_SECCION; payload: number }
  | { type: ActionType.ADD_EVALUATIONS; payload: { studentIds: number[]; materiaId: number; añoId: number; lapso: 1 | 2 | 3; evaluations: { descripcion: string; ponderacion: number }[] } }
  | { type: ActionType.UPDATE_EVALUATION_GRADE; payload: { studentId: number; materiaId: number; añoId: number; lapso: 1 | 2 | 3; evaluationId: string; newNota: number; } }
  | { type: ActionType.DELETE_EVALUATION_COLUMN; payload: { materiaId: number; añoId: number; lapso: 1 | 2 | 3; description: string; } }
  | { type: ActionType.SET_INITIAL_DATA; payload: any }; // Using any for simplicity