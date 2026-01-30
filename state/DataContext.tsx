'use client';

import React, { createContext, useReducer, useContext, Dispatch, useEffect, useState, useRef } from 'react';
import { AppState, User, UserRole, Student, Teacher, Materia, AñoEscolar, Calificacion, Grado, Seccion, Evaluacion, ModalType } from '../types';
import { Action, ActionType } from './actions';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

// We exclude currentUser from DataState as it is in AuthContext
type DataState = Omit<AppState, 'currentUser'>;

const initialDataState: DataState = {
    users: [],
    students: [],
    teachers: [],
    materias: [],
    añosEscolares: [],
    grados: [],
    secciones: [],
    calificaciones: [],
    announcements: [],
    notifications: [],
    modalState: {
        isOpen: false,
        modalType: null,
        data: null,
    },
};

const dataReducer = (state: DataState, action: Action): DataState => {
    switch (action.type) {
        // Handle data scoping on login (triggered alongside Auth Login)
        case ActionType.LOGIN_SUCCESS: {
            const userPayload = action.payload;
            const fullData = { ...state };

            if (userPayload.role === UserRole.DOCENTE) {
                const teacherProfile = fullData.teachers.find(t => t.id === userPayload.teacherId);

                if (teacherProfile) {
                    const teacherMaterias = fullData.materias.filter(m => m.id_docente === teacherProfile.id);
                    const teacherMateriaIds = new Set(teacherMaterias.map(m => m.id));
                    const teacherClasses = new Set(teacherMaterias.map(m => `${m.id_grado}-${m.id_seccion}`));
                    const teacherStudents = fullData.students.filter(s => teacherClasses.has(`${s.id_grado}-${s.id_seccion}`));
                    const teacherStudentIds = new Set(teacherStudents.map(s => s.id));

                    return {
                        ...state,
                        materias: teacherMaterias,
                        students: teacherStudents,
                        calificaciones: fullData.calificaciones.filter(c =>
                            teacherStudentIds.has(c.id) && teacherMateriaIds.has(c.id_materia)
                        ),
                    };
                }
            }
            return state;
        }

        // Modals
        case ActionType.OPEN_MODAL:
            return {
                ...state,
                modalState: {
                    isOpen: true,
                    modalType: action.payload.modal,
                    data: action.payload.data || null,
                },
            };
        case ActionType.CLOSE_MODAL:
            return { ...state, modalState: initialDataState.modalState };

        // Users Data Management
        case ActionType.UPDATE_CURRENT_USER_PROFILE: {
            const { userId, updates } = action.payload;
            const newUsers = state.users.map(u => u.id === userId ? { ...u, ...updates } : u);
            return { ...state, users: newUsers };
        }
        case ActionType.SAVE_USER: {
            const userData = action.payload;
            let updatedUsers;
            if ('id' in userData && state.users.some(u => u.id === userData.id)) {
                updatedUsers = state.users.map(u => u.id === (userData as User).id ? { ...u, ...userData } : u);
            } else {
                if ('id' in userData) {
                    updatedUsers = [userData, ...state.users];
                } else {
                    const newId = Math.max(...state.users.map(u => u.id), 0) + 1;
                    updatedUsers = [{ ...userData, id: newId } as User, ...state.users];
                }
            }
            return { ...state, users: updatedUsers, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_USER: {
            return { ...state, users: state.users.filter(u => u.id !== action.payload) };
        }

        // Students
        case ActionType.SAVE_STUDENT: {
            const studentData = action.payload;
            let updatedStudents;
            if ('id' in studentData && state.students.some(s => s.id === studentData.id)) {
                updatedStudents = state.students.map(s => s.id === (studentData as Student).id ? studentData : s);
            } else {
                if ('id' in studentData) {
                    updatedStudents = [studentData, ...state.students];
                } else {
                    const newId = Math.max(...state.students.map(s => s.id), 0) + 1;
                    updatedStudents = [{ ...studentData, id: newId } as Student, ...state.students];
                }
            }
            return { ...state, students: updatedStudents, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_STUDENT: {
            return { ...state, students: state.students.filter(s => s.id !== action.payload) };
        }

        // Teachers (Docentes)
        case ActionType.SAVE_TEACHER: {
            const teacherData = action.payload;
            let updatedTeachers;
            if ('id' in teacherData && state.teachers.some(t => t.id === teacherData.id)) {
                updatedTeachers = state.teachers.map(t => t.id === (teacherData as Teacher).id ? teacherData : t);
            } else {
                if ('id' in teacherData) {
                    updatedTeachers = [teacherData, ...state.teachers];
                } else {
                    const newId = Math.max(...state.teachers.map(t => t.id), 0) + 1;
                    updatedTeachers = [{ ...teacherData, id: newId } as Teacher, ...state.teachers];
                }
            }
            return { ...state, teachers: updatedTeachers, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_TEACHER: {
            return { ...state, teachers: state.teachers.filter(t => t.id !== action.payload) };
        }

        // Materias
        case ActionType.SAVE_MATERIA: {
            const materiaData = action.payload;
            let updatedMaterias;
            if ('id' in materiaData && state.materias.some(m => m.id === materiaData.id)) {
                updatedMaterias = state.materias.map(m => m.id === (materiaData as Materia).id ? materiaData : m);
            } else {
                if ('id' in materiaData) {
                    updatedMaterias = [materiaData, ...state.materias];
                } else {
                    const newId = Math.max(...state.materias.map(m => m.id), 0) + 1;
                    updatedMaterias = [{ ...materiaData, id: newId } as Materia, ...state.materias];
                }
            }
            return { ...state, materias: updatedMaterias, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_MATERIA: {
            return { ...state, materias: state.materias.filter(m => m.id !== action.payload) };
        }

        // School Years
        case ActionType.SAVE_SCHOOL_YEAR: {
            const syData = action.payload;
            let updatedSYs;
            if ('id' in syData && state.añosEscolares.some(sy => sy.id === syData.id)) {
                updatedSYs = state.añosEscolares.map(sy => sy.id === (syData as AñoEscolar).id ? syData : sy);
            } else {
                if ('id' in syData) {
                    updatedSYs = [syData, ...state.añosEscolares];
                } else {
                    const newId = Math.max(...state.añosEscolares.map(sy => sy.id), 0) + 1;
                    updatedSYs = [{ ...syData, id: newId } as AñoEscolar, ...state.añosEscolares];
                }
            }
            return { ...state, añosEscolares: updatedSYs, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_SCHOOL_YEAR: {
            return { ...state, añosEscolares: state.añosEscolares.filter(sy => sy.id !== action.payload) };
        }

        // Grados
        case ActionType.SAVE_GRADO: {
            const gradoData = action.payload;
            let updatedGrados;
            if ('id_grado' in gradoData && state.grados.some(g => g.id_grado === gradoData.id_grado)) {
                updatedGrados = state.grados.map(g => g.id_grado === (gradoData as Grado).id_grado ? gradoData : g);
            } else {
                if ('id_grado' in gradoData) {
                    updatedGrados = [gradoData, ...state.grados];
                } else {
                    const newId = Math.max(...state.grados.map(g => g.id_grado), 0) + 1;
                    updatedGrados = [{ ...gradoData, id_grado: newId } as Grado, ...state.grados];
                }
            }
            return { ...state, grados: updatedGrados, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_GRADO: {
            return { ...state, grados: state.grados.filter(g => g.id_grado !== action.payload) };
        }

        // Secciones
        case ActionType.SAVE_SECCION: {
            const seccionData = action.payload;
            let updatedSecciones;
            if ('id_seccion' in seccionData && state.secciones.some(s => s.id_seccion === seccionData.id_seccion)) {
                updatedSecciones = state.secciones.map(s => s.id_seccion === (seccionData as Seccion).id_seccion ? seccionData : s);
            } else {
                if ('id_seccion' in seccionData) {
                    updatedSecciones = [seccionData, ...state.secciones];
                } else {
                    const newId = Math.max(...state.secciones.map(s => s.id_seccion), 0) + 1;
                    updatedSecciones = [{ ...seccionData, id_seccion: newId } as Seccion, ...state.secciones];
                }
            }
            return { ...state, secciones: updatedSecciones, modalState: initialDataState.modalState };
        }
        case ActionType.DELETE_SECCION: {
            return { ...state, secciones: state.secciones.filter(s => s.id_seccion !== action.payload) };
        }

        // Calificaciones
        case ActionType.ADD_EVALUATIONS: {
            const { studentIds, materiaId, añoId, lapso, evaluations } = action.payload;
            const lapsoKey = `lapso${lapso}` as const;
            let newCalificaciones = [...state.calificaciones];

            evaluations.forEach(({ descripcion, ponderacion }: any) => {
                studentIds.forEach((studentId: number) => {
                    const calificacionIndex = newCalificaciones.findIndex(c => c.id === studentId && c.id_materia === materiaId && c.id_año_escolar === añoId);
                    const newEvaluation: Evaluacion = {
                        id: `uuid-${studentId}-${descripcion}-${Date.now()}-${Math.random()}`,
                        descripcion,
                        ponderacion,
                        nota: 0,
                    };
                    if (calificacionIndex > -1) {
                        const updatedCalificacion = { ...newCalificaciones[calificacionIndex] };
                        if (!updatedCalificacion[lapsoKey].some(e => e.descripcion === descripcion)) {
                            updatedCalificacion[lapsoKey] = [...updatedCalificacion[lapsoKey], newEvaluation];
                            newCalificaciones[calificacionIndex] = updatedCalificacion;
                            api.syncGrades({
                                studentId, materiaId, añoId,
                                lapso1: updatedCalificacion.lapso1,
                                lapso2: updatedCalificacion.lapso2,
                                lapso3: updatedCalificacion.lapso3
                            }).catch(console.error);
                        }
                    } else {
                        const newCalificacion: Calificacion = {
                            id: studentId, id_materia: materiaId, id_año_escolar: añoId,
                            lapso1: [], lapso2: [], lapso3: [],
                        };
                        newCalificacion[lapsoKey].push(newEvaluation);
                        newCalificaciones.push(newCalificacion);
                        api.syncGrades({
                            studentId, materiaId, añoId,
                            lapso1: newCalificacion.lapso1,
                            lapso2: newCalificacion.lapso2,
                            lapso3: newCalificacion.lapso3
                        }).catch(console.error);
                    }
                });
            });
            return { ...state, calificaciones: newCalificaciones, modalState: initialDataState.modalState };
        }
        case ActionType.UPDATE_EVALUATION_GRADE: {
            const { studentId, materiaId, añoId, lapso, evaluationId, newNota } = action.payload;
            const lapsoKey = `lapso${lapso}` as const;
            const newCalificaciones = state.calificaciones.map(cal => {
                if (cal.id === studentId && cal.id_materia === materiaId && cal.id_año_escolar === añoId) {
                    const updatedLapso = cal[lapsoKey].map(ev =>
                        ev.id === evaluationId ? { ...ev, nota: newNota } : ev
                    );
                    const updatedCal = { ...cal, [lapsoKey]: updatedLapso };
                    api.syncGrades({
                        studentId, materiaId, añoId,
                        lapso1: updatedCal.lapso1,
                        lapso2: updatedCal.lapso2,
                        lapso3: updatedCal.lapso3
                    }).catch(console.error);
                    return updatedCal;
                }
                return cal;
            });
            return { ...state, calificaciones: newCalificaciones };
        }
        case ActionType.UPSERT_GRADE: {
            const { studentId, materiaId, añoId, lapso, description, ponderacion, newNota } = action.payload;
            const lapsoKey = `lapso${lapso}` as const;

            let studentExistsInGrades = false;

            let newCalificaciones = state.calificaciones.map(cal => {
                if (cal.id === studentId && cal.id_materia === materiaId && cal.id_año_escolar === añoId) {
                    studentExistsInGrades = true;
                    // Check if evaluation exists
                    const existingEvalIndex = cal[lapsoKey].findIndex(ev => ev.descripcion === description);

                    let updatedLapso;
                    if (existingEvalIndex >= 0) {
                        // Update
                        updatedLapso = [...cal[lapsoKey]];
                        updatedLapso[existingEvalIndex] = { ...updatedLapso[existingEvalIndex], nota: newNota };
                    } else {
                        // Insert
                        const newEval: Evaluacion = {
                            id: `uuid-${studentId}-${description}-${Date.now()}-${Math.random()}`,
                            descripcion: description,
                            ponderacion,
                            nota: newNota
                        };
                        updatedLapso = [...cal[lapsoKey], newEval];
                    }

                    const updatedCal = { ...cal, [lapsoKey]: updatedLapso };
                    api.syncGrades({
                        studentId, materiaId, añoId,
                        lapso1: updatedCal.lapso1,
                        lapso2: updatedCal.lapso2,
                        lapso3: updatedCal.lapso3
                    }).catch(console.error);
                    return updatedCal;
                }
                return cal;
            });

            // If student has NO grades record yet for this class, we must create the Calificacion object entirely
            if (!studentExistsInGrades) {
                const newEval: Evaluacion = {
                    id: `uuid-${studentId}-${description}-${Date.now()}-${Math.random()}`,
                    descripcion: description,
                    ponderacion,
                    nota: newNota
                };
                const newCal: Calificacion = {
                    id: studentId,
                    id_materia: materiaId,
                    id_año_escolar: añoId,
                    lapso1: [],
                    lapso2: [],
                    lapso3: []
                };
                // Set the correct lapso
                newCal[lapsoKey] = [newEval];
                newCalificaciones = [...newCalificaciones, newCal];

                api.syncGrades({
                    studentId, materiaId, añoId,
                    lapso1: newCal.lapso1,
                    lapso2: newCal.lapso2,
                    lapso3: newCal.lapso3
                }).catch(console.error);
            }

            return { ...state, calificaciones: newCalificaciones };
        }
        case ActionType.DELETE_EVALUATION_COLUMN: {
            const { materiaId, añoId, lapso, description } = action.payload;
            const lapsoKey = `lapso${lapso}` as const;
            const newCalificaciones = state.calificaciones.map(cal => {
                if (cal.id_materia === materiaId && cal.id_año_escolar === añoId) {
                    const updatedLapso = cal[lapsoKey].filter(ev => ev.descripcion !== description);
                    const updatedCal = { ...cal, [lapsoKey]: updatedLapso };
                    api.syncGrades({
                        studentId: cal.id, materiaId, añoId,
                        lapso1: updatedCal.lapso1,
                        lapso2: updatedCal.lapso2,
                        lapso3: updatedCal.lapso3
                    }).catch(console.error);
                    return updatedCal;
                }
                return cal;
            });
            return { ...state, calificaciones: newCalificaciones };
        }

        // Notifications & Announcements
        case ActionType.MARK_NOTIFICATION_READ: {
            const id = action.payload;
            const newNotifications = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
            api.markNotificationRead(id).catch(console.error);
            return { ...state, notifications: newNotifications };
        }
        case ActionType.MARK_ALL_NOTIFICATIONS_READ: {
            const userId = action.payload;
            const newNotifications = state.notifications.map(n => ({ ...n, isRead: true }));
            if (userId) {
                api.markAllNotificationsRead(userId).catch(console.error);
            }
            return { ...state, notifications: newNotifications };
        }
        case ActionType.SAVE_ANNOUNCEMENT: {
            // For optimistic UI update when creating
            const newAnnouncement = action.payload;
            return { ...state, announcements: [newAnnouncement, ...state.announcements] };
        }
        case ActionType.DELETE_ANNOUNCEMENT: {
            const id = action.payload;
            const newAnnouncements = state.announcements.filter(a => a.id !== id);
            api.deleteAnnouncement(id).catch(console.error);
            return { ...state, announcements: newAnnouncements };
        }

        // Initial Data
        case ActionType.SET_INITIAL_DATA: {
            const data: AppState = action.payload;
            const { currentUser, ...rest } = data;
            return { ...state, ...rest };
        }

        default:
            return state;
    }
};

const DataStateContext = createContext<DataState>(initialDataState);
const DataDispatchContext = createContext<Dispatch<Action>>(() => null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(dataReducer, initialDataState);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth(); // Fix for 401 error: Use auth context

    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        const fetchData = async () => {
            // Block fetching if no user logged in
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const [initialDataRes, announcementsRes, notificationsRes] = await Promise.all([
                    api.getInitialData(),
                    api.getAnnouncements(),
                    api.getNotifications(currentUser.id)
                ]);

                dispatch({
                    type: ActionType.SET_INITIAL_DATA,
                    payload: {
                        ...initialDataRes.data,
                        announcements: announcementsRes.data,
                        notifications: notificationsRes.data
                    }
                });
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Polling logic
        const intervalId = setInterval(async () => {
            if (!currentUser) return;
            try {
                const [initialDataRes, announcementsRes, notificationsRes] = await Promise.all([
                    api.getInitialData(),
                    api.getAnnouncements(),
                    api.getNotifications(currentUser.id)
                ]);

                const newData = {
                    ...initialDataRes.data,
                    announcements: announcementsRes.data,
                    notifications: notificationsRes.data
                };

                const currentState = stateRef.current; // Access latest state via ref

                // Simple check to avoid unnecessary re-renders
                const hasChanges =
                    JSON.stringify(newData.students) !== JSON.stringify(currentState.students) ||
                    JSON.stringify(newData.calificaciones) !== JSON.stringify(currentState.calificaciones) ||
                    JSON.stringify(newData.materias) !== JSON.stringify(currentState.materias) ||
                    JSON.stringify(newData.announcements) !== JSON.stringify(currentState.announcements) ||
                    JSON.stringify(newData.notifications) !== JSON.stringify(currentState.notifications);

                if (hasChanges) {
                    // Only dispatch if something meaningful changed
                    dispatch({ type: ActionType.SET_INITIAL_DATA, payload: newData });
                }
            } catch (error) {
                console.error("Silent poll failed", error);
            }
        }, 10000); // 10 seconds

        return () => clearInterval(intervalId);
    }, [currentUser]); // Retry fetching if user logs in

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-moon-dark text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-moon-purple rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-moon-nav rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <DataStateContext.Provider value={state}>
            <DataDispatchContext.Provider value={dispatch}>
                {children}
            </DataDispatchContext.Provider>
        </DataStateContext.Provider>
    );
};

export const useData = () => useContext(DataStateContext);
export const useDataDispatch = () => useContext(DataDispatchContext);
