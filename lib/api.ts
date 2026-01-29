import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Configuración de instancia Axios
const axiosInstance = axios.create({
    baseURL: API_URL,
});

// Interceptor para agregar token de autenticación a las peticiones
axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Objeto API principal con todos los endpoints del sistema
export const api = {
    // Obtener datos iniciales de la aplicación
    getInitialData: () => axiosInstance.get('/initial-data'),

    // Métodos genéricos
    get: (url: string, config?: any) => axiosInstance.get(url, config),
    post: (url: string, data?: any, config?: any) => axiosInstance.post(url, data, config),

    // Autenticación
    login: async (credentials: any) => {
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
    createStudent: (data: any) => axiosInstance.post('/students', data),
    updateStudent: (id: number, data: any) => axiosInstance.put(`/students/${id}`, data),
    deleteStudent: (id: number) => axiosInstance.delete(`/students/${id}`),

    // Gestión de Docentes
    createTeacher: (data: any) => axiosInstance.post('/teachers', data),
    updateTeacher: (id: number, data: any) => axiosInstance.put(`/teachers/${id}`, data),
    deleteTeacher: (id: number) => axiosInstance.delete(`/teachers/${id}`),

    // Gestión de Materias
    createMateria: (data: any) => axiosInstance.post('/materias', data),
    updateMateria: (id: number, data: any) => axiosInstance.put(`/materias/${id}`, data),
    deleteMateria: (id: number) => axiosInstance.delete(`/materias/${id}`),

    // Gestión de Grados
    createGrado: (data: any) => axiosInstance.post('/grados', data),
    updateGrado: (id: number, data: any) => axiosInstance.put(`/grados/${id}`, data),
    deleteGrado: (id: number) => axiosInstance.delete(`/grados/${id}`),

    // Gestión de Secciones
    createSeccion: (data: any) => axiosInstance.post('/secciones', data),
    updateSeccion: (id: number, data: any) => axiosInstance.put(`/secciones/${id}`, data),
    deleteSeccion: (id: number) => axiosInstance.delete(`/secciones/${id}`),

    // Gestión de Años Escolares
    createSchoolYear: (data: any) => axiosInstance.post('/schoolyears', data),
    updateSchoolYear: (id: number, data: any) => axiosInstance.put(`/schoolyears/${id}`, data),
    deleteSchoolYear: (id: number) => axiosInstance.delete(`/schoolyears/${id}`),

    // Gestión de Usuarios (Admin)
    createUser: (data: any) => axiosInstance.post('/users', data),
    updateUser: (id: number, data: any) => axiosInstance.put(`/users/${id}`, data),
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
    syncGrades: (data: any) => axiosInstance.post('/calificaciones/sync', data),
};
