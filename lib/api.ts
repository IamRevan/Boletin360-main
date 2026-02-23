import axios from 'axios';
import { z } from 'zod';
import {
    LoginSchema,
    StudentSchema,
    TeacherSchema,
    GradeSyncSchema,
    CreateUserSchema,
    UpdateUserSchema
} from '../server/schemas'; // Imporing shared schemas

// Infer types from Zod Schemas
export type LoginData = z.infer<typeof LoginSchema>;
export type StudentData = z.infer<typeof StudentSchema>;
export type TeacherData = z.infer<typeof TeacherSchema>;
export type GradeSyncData = z.infer<typeof GradeSyncSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;


const API_URL = 'http://localhost:3001/api';

// Configuración de instancia Axios
const axiosInstance = axios.create({
    baseURL: API_URL,
});

// --- Resilience Logic ---

interface QueuedRequest {
    id: string; // Idempotency key
    url: string;
    method: string;
    data: any;
    timestamp: number;
}

const getOfflineQueue = (): QueuedRequest[] => {
    if (typeof window === 'undefined') return [];
    const queue = localStorage.getItem('offline_queue');
    return queue ? JSON.parse(queue) : [];
};

const saveOfflineQueue = (queue: QueuedRequest[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('offline_queue', JSON.stringify(queue));
};

const addToQueue = (config: any) => {
    const queue = getOfflineQueue();
    // Only queue mutations
    if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const idempotencyKey = config.headers['Idempotency-Key'] || Math.random().toString(36).substring(7);

        // Avoid duplicates in the queue
        if (queue.some(r => r.id === idempotencyKey)) return;

        queue.push({
            id: idempotencyKey,
            url: config.url || '',
            method: config.method || 'post',
            data: config.data,
            timestamp: Date.now()
        });
        saveOfflineQueue(queue);
        console.log(`[RESILIENCE] Request queued for offline sync: ${config.url}`);
    }
};

// Interceptor para agregar token de autenticación e Idempotency-Key
axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add Idempotency-Key to non-GET requests if not present
        if (config.method && ['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
            if (!config.headers['Idempotency-Key']) {
                config.headers['Idempotency-Key'] = Math.random().toString(36).substring(7);
            }
        }
    }
    return config;
});

// Interceptor para logs de respuesta y errores, y manejo de offline
axiosInstance.interceptors.response.use(
    (response) => {
        // If a request from the queue succeeds, we should ideally remove it here, 
        // but the manual flush is cleaner for now.
        return response;
    },
    (error) => {
        const timestamp = new Date().toISOString();
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message;

        console.error(`[API ERROR] ${timestamp} | ${method} ${url} | Status: ${status} | Message: ${message}`);

        // Detect network errors or server downtime (503/504)
        const isNetworkError = !error.response || [0, 502, 503, 504].includes(error.response.status);

        if (isNetworkError && error.config) {
            addToQueue(error.config);
        }

        if (error.response?.data?.issues) {
            console.error('Validation Issues:', error.response.data.issues);
        }

        return Promise.reject(error);
    }
);

// Sync Logic
export const flushOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`[RESILIENCE] Attempting to flush ${queue.length} queued requests...`);
    const remaining: QueuedRequest[] = [];

    for (const req of queue) {
        try {
            await axiosInstance({
                url: req.url,
                method: req.method,
                data: req.data,
                headers: { 'Idempotency-Key': req.id }
            });
            console.log(`[RESILIENCE] Successfully synced: ${req.url}`);
        } catch (err: any) {
            // Keep in queue if it's still a network error
            const isNetworkError = !err.response || [0, 502, 503, 504].includes(err.response.status);
            if (isNetworkError) {
                remaining.push(req);
            } else {
                console.error(`[RESILIENCE] Failed to sync ${req.url} with non-retryable error:`, err.message);
                // For logic errors (400, 401, etc.), we might want to discard or notify user
            }
        }
    }

    saveOfflineQueue(remaining);
};

// Auto-flush when coming back online
if (typeof window !== 'undefined') {
    window.addEventListener('online', flushOfflineQueue);
    // Also try on startup
    setTimeout(flushOfflineQueue, 2000);
}

// Objeto API principal con todos los endpoints del sistema
export const api = {
    // Obtener datos iniciales de la aplicación
    getInitialData: () => axiosInstance.get('/initial-data'),

    // Métodos genéricos
    get: (url: string, config?: any) => axiosInstance.get(url, config),
    post: (url: string, data?: any, config?: any) => axiosInstance.post(url, data, config),

    // Autenticación
    login: async (credentials: LoginData) => {
        const response = await axiosInstance.post('/login', credentials);
        if (response.data.token && typeof window !== 'undefined') {
            localStorage.setItem('token', response.data.token);
        }
        return response;
    },
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    },

    // Gestión de Estudiantes
    createStudent: (data: StudentData) => axiosInstance.post('/students', data),
    updateStudent: (id: number, data: StudentData) => axiosInstance.put(`/students/${id}`, data),
    deleteStudent: (id: number) => axiosInstance.delete(`/students/${id}`),

    // Gestión de Docentes
    createTeacher: (data: TeacherData) => axiosInstance.post('/teachers', data),
    updateTeacher: (id: number, data: TeacherData) => axiosInstance.put(`/teachers/${id}`, data),
    deleteTeacher: (id: number) => axiosInstance.delete(`/teachers/${id}`),

    // Gestión de Materias
    createMateria: (data: any) => axiosInstance.post('/materias', data), // Placeholder for MateriaSchema
    updateMateria: (id: number, data: any) => axiosInstance.put(`/materias/${id}`, data),
    deleteMateria: (id: number) => axiosInstance.delete(`/materias/${id}`),

    // Gestión de Grados
    createGrado: (data: any) => axiosInstance.post('/grados', data),
    createBatchGrados: (data: any) => axiosInstance.post('/grados/batch', data),
    updateGrado: (id: number, data: any) => axiosInstance.put(`/grados/${id}`, data),
    deleteGrado: (id: number) => axiosInstance.delete(`/grados/${id}`),

    // Gestión de Secciones
    createSeccion: (data: any) => axiosInstance.post('/secciones', data),
    createBatchSecciones: (data: any) => axiosInstance.post('/secciones/batch', data),
    updateSeccion: (id: number, data: any) => axiosInstance.put(`/secciones/${id}`, data),
    deleteSeccion: (id: number) => axiosInstance.delete(`/secciones/${id}`),

    // Gestión de Años Escolares
    createSchoolYear: (data: any) => axiosInstance.post('/schoolyears', data),
    updateSchoolYear: (id: number, data: any) => axiosInstance.put(`/schoolyears/${id}`, data),
    deleteSchoolYear: (id: number) => axiosInstance.delete(`/schoolyears/${id}`),

    // Gestión de Usuarios (Admin)
    createUser: (data: CreateUserData) => axiosInstance.post('/users', data),
    updateUser: (id: number, data: UpdateUserData) => axiosInstance.put(`/users/${id}`, data),
    deleteUser: (id: number) => axiosInstance.delete(`/users/${id}`),
    resetPassword: (id: number, newPassword: string) => axiosInstance.post(`/users/${id}/reset-password`, { newPassword }),

    // Announcements
    getAnnouncements: () => axiosInstance.get('/announcements'),
    createAnnouncement: (data: any) => axiosInstance.post('/announcements', data),
    deleteAnnouncement: (id: number) => axiosInstance.delete(`/announcements/${id}`),

    // Notifications
    getNotifications: (userId: number) => axiosInstance.get(`/notifications?userId=${userId}`),
    markNotificationRead: (id: number) => axiosInstance.put(`/notifications/${id}/read`),
    markAllNotificationsRead: (userId: number) => axiosInstance.put('/notifications/read-all', { userId }),
    deleteNotification: (id: number) => axiosInstance.delete(`/notifications/${id}`),

    // Gestión de Calificaciones
    syncGrades: (data: GradeSyncData) => axiosInstance.post('/calificaciones/sync', data),
};
