"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middleware/auth");
const audit_1 = require("./services/audit");
const schemas_1 = require("./schemas");
// Clave secreta para JWT (Debe ser segura en producción)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares globales
app.use((0, cors_1.default)()); // Habilitar CORS
app.use(express_1.default.json()); // Habilitar parsing de JSON en el body
// Inicializar Base de Datos
(0, db_1.initDB)();
// --- RUTAS DE LA API ---
// Datos Iniciales (Carga inicial del dashboard)
// Obtiene todos los datos necesarios para popular el estado de la aplicación
app.get('/api/initial-data', async (req, res) => {
    try {
        const users = await (0, db_1.query)('SELECT * FROM users');
        const students = await (0, db_1.query)('SELECT * FROM students WHERE deleted_at IS NULL');
        const teachers = await (0, db_1.query)('SELECT * FROM teachers');
        const materias = await (0, db_1.query)('SELECT * FROM materias');
        const grados = await (0, db_1.query)('SELECT * FROM grados');
        const secciones = await (0, db_1.query)('SELECT * FROM secciones');
        const anosEscolares = await (0, db_1.query)('SELECT * FROM anos_escolares');
        const calificaciones = await (0, db_1.query)('SELECT * FROM calificaciones');
        // Formatear estudiantes para el frontend (fechas)
        const formatStudents = students.rows.map(s => ({
            ...s,
            fecha_nacimiento: s.fecha_nacimiento ? new Date(s.fecha_nacimiento).toISOString().split('T')[0] : null
        }));
        // Formatear calificaciones para coincidir con la estructura esperada por el frontend
        const formatCalificaciones = calificaciones.rows.map(c => ({
            id: c.student_id, // Frontend espera 'id' como studentId en algunos contextos
            id_materia: c.materia_id,
            id_año_escolar: c.ano_escolar_id,
            lapso1: c.lapso1,
            lapso2: c.lapso2,
            lapso3: c.lapso3
        }));
        // Formatear usuarios
        const formatUsers = users.rows.map(u => ({
            ...u,
            teacherId: u.teacher_id
        }));
        res.json({
            users: formatUsers,
            students: formatStudents,
            teachers: teachers.rows,
            materias: materias.rows,
            grados: grados.rows,
            secciones: secciones.rows,
            añosEscolares: anosEscolares.rows,
            calificaciones: formatCalificaciones,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos iniciales' });
    }
});
// Login
// Login
// Endpoint de Inicio de Sesión
app.post('/api/login', async (req, res) => {
    // Validar datos de entrada con Zod
    const validation = schemas_1.LoginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { email, password } = validation.data;
    try {
        const result = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Verificar contraseña con bcrypt
            const validPassword = await bcryptjs_1.default.compare(password, user.password);
            if (validPassword) {
                // Generar token JWT si la contraseña es válida
                const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
                res.json({ ...user, teacherId: user.teacher_id, token });
            }
            else {
                res.status(401).json({ error: 'Credenciales inválidas' });
            }
        }
        else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el inicio de sesión' });
    }
});
// Generic CRUD helpers could be useful, but let's be explicit for now.
// Students
// Estudiantes
// Endpoint para crear un nuevo estudiante
app.post('/api/students', auth_1.authenticateToken, async (req, res) => {
    // Validar datos con esquema Zod
    const validation = schemas_1.StudentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status } = validation.data;
    try {
        const result = await (0, db_1.query)(`INSERT INTO students (nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`, [nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status]);
        const student = result.rows[0];
        // Registrar acción en auditoría
        await (0, audit_1.logAction)(req.user.id, 'CREATE_STUDENT', `Created student ${student.nombres} ${student.apellidos}`);
        res.json(student);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear estudiante' });
    }
});
// Endpoint para actualizar un estudiante existente
app.put('/api/students/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status } = req.body;
    try {
        const result = await (0, db_1.query)(`UPDATE students SET nacionalidad=$1, cedula=$2, nombres=$3, apellidos=$4, email=$5, genero=$6, fecha_nacimiento=$7, id_grado=$8, id_seccion=$9, status=$10 WHERE id=$11 RETURNING *`, [nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status, id]);
        const student = result.rows[0];
        await (0, audit_1.logAction)(req.user.id, 'UPDATE_STUDENT', `Updated student ID ${id}`);
        res.json(student);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar estudiante' });
    }
});
// Endpoint para eliminar (Soft Delete) un estudiante
app.delete('/api/students/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete: solo se actualiza deleted_at, no se borra la fila
        await (0, db_1.query)('UPDATE students SET deleted_at = NOW() WHERE id = $1', [id]);
        await (0, audit_1.logAction)(req.user.id, 'DELETE_STUDENT', `Deleted student ID ${id} (Soft Delete)`);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar estudiante' });
    }
});
// Docentes
// Endpoint para crear un nuevo docente
app.post('/api/teachers', auth_1.authenticateToken, async (req, res) => {
    const validation = schemas_1.TeacherSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nacionalidad, cedula, nombres, apellidos, email, status } = validation.data;
    try {
        const result = await (0, db_1.query)(`INSERT INTO teachers (nacionalidad, cedula, nombres, apellidos, email, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [nacionalidad, cedula, nombres, apellidos, email, status]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear docente' });
    }
});
// Endpoint para actualizar un docente
app.put('/api/teachers/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nacionalidad, cedula, nombres, apellidos, email, status } = req.body;
    try {
        const result = await (0, db_1.query)(`UPDATE teachers SET nacionalidad=$1, cedula=$2, nombres=$3, apellidos=$4, email=$5, status=$6 WHERE id=$7 RETURNING *`, [nacionalidad, cedula, nombres, apellidos, email, status, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar docente' });
    }
});
// Endpoint para eliminar un docente
app.delete('/api/teachers/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await (0, db_1.query)('DELETE FROM teachers WHERE id = $1', [id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar docente' });
    }
});
// Materias
// Endpoint para crear una nueva materia
app.post('/api/materias', auth_1.authenticateToken, async (req, res) => {
    const { nombre_materia, id_docente, id_grado, id_seccion } = req.body;
    try {
        const result = await (0, db_1.query)(`INSERT INTO materias (nombre_materia, id_docente, id_grado, id_seccion) 
             VALUES ($1, $2, $3, $4) RETURNING *`, [nombre_materia, id_docente, id_grado, id_seccion]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear materia' });
    }
});
// Endpoint para actualizar una materia
app.put('/api/materias/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_materia, id_docente, id_grado, id_seccion } = req.body;
    try {
        const result = await (0, db_1.query)(`UPDATE materias SET nombre_materia=$1, id_docente=$2, id_grado=$3, id_seccion=$4 WHERE id=$5 RETURNING *`, [nombre_materia, id_docente, id_grado, id_seccion, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar materia' });
    }
});
// Endpoint para eliminar una materia
app.delete('/api/materias/:id', auth_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await (0, db_1.query)('DELETE FROM materias WHERE id = $1', [id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar materia' });
    }
});
// Grados (Niveles educativos)
// Endpoint para crear un grado
app.post('/api/grados', async (req, res) => {
    const { nombre_grado } = req.body;
    try {
        const result = await (0, db_1.query)('INSERT INTO grados (nombre_grado) VALUES ($1) RETURNING *', [nombre_grado]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear grado' });
    }
});
// Endpoint para actualizar un grado
app.put('/api/grados/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_grado } = req.body;
    try {
        const result = await (0, db_1.query)('UPDATE grados SET nombre_grado=$1 WHERE id_grado=$2 RETURNING *', [nombre_grado, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar grado' });
    }
});
// Endpoint para eliminar un grado
app.delete('/api/grados/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await (0, db_1.query)('DELETE FROM grados WHERE id_grado = $1', [id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar grado' });
    }
});
// Secciones (Aulas)
// Endpoint para crear una sección
app.post('/api/secciones', async (req, res) => {
    const { nombre_seccion } = req.body;
    try {
        const result = await (0, db_1.query)('INSERT INTO secciones (nombre_seccion) VALUES ($1) RETURNING *', [nombre_seccion]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear sección' });
    }
});
// Endpoint para actualizar una sección
app.put('/api/secciones/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_seccion } = req.body;
    try {
        const result = await (0, db_1.query)('UPDATE secciones SET nombre_seccion=$1 WHERE id_seccion=$2 RETURNING *', [nombre_seccion, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar sección' });
    }
});
// Endpoint para eliminar una sección
app.delete('/api/secciones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await (0, db_1.query)('DELETE FROM secciones WHERE id_seccion = $1', [id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar sección' });
    }
});
// Años Escolares (Períodos académicos)
// Endpoint para crear un año escolar
app.post('/api/schoolyears', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const { nombre } = req.body;
    try {
        const result = await (0, db_1.query)('INSERT INTO anos_escolares (nombre) VALUES ($1) RETURNING *', [nombre]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear año escolar' });
    }
});
// Endpoint para actualizar un año escolar
app.put('/api/schoolyears/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        const result = await (0, db_1.query)('UPDATE anos_escolares SET nombre=$1 WHERE id=$2 RETURNING *', [nombre, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar año escolar' });
    }
});
// Endpoint para eliminar un año escolar
app.delete('/api/schoolyears/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await (0, db_1.query)('DELETE FROM anos_escolares WHERE id = $1', [id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar año escolar' });
    }
});
// Usuarios
// Endpoint para crear un usuario (Admin o Docente)
app.post('/api/users', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const validation = schemas_1.CreateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nombres, apellidos, email, password, role, teacherId } = validation.data;
    try {
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const result = await (0, db_1.query)(`INSERT INTO users (nombres, apellidos, email, password, role, teacher_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [nombres, apellidos, email, hashedPassword, role, teacherId]);
        const user = result.rows[0];
        await (0, audit_1.logAction)(req.user.id, 'CREATE_USER', `Created user ${user.email} with role ${user.role}`);
        res.json({ ...user, teacherId: user.teacher_id });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});
// Endpoint para actualizar un usuario
app.put('/api/users/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    const validation = schemas_1.UpdateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nombres, apellidos, email, password, role, teacherId } = validation.data;
    try {
        let hashedPassword = password;
        if (password) {
            // Si se proporciona nueva contraseña, hashearla
            hashedPassword = await bcryptjs_1.default.hash(password, 10);
        }
        else {
            // Si no se proporciona, mantener la anterior
            const currentUser = await (0, db_1.query)('SELECT password FROM users WHERE id=$1', [id]);
            hashedPassword = currentUser.rows[0].password;
        }
        const result = await (0, db_1.query)(`UPDATE users SET nombres=$1, apellidos=$2, email=$3, password=$4, role=$5, teacher_id=$6 WHERE id=$7 RETURNING *`, [nombres, apellidos, email, hashedPassword, role, teacherId, id]);
        const user = result.rows[0];
        await (0, audit_1.logAction)(req.user.id, 'UPDATE_USER', `Updated user ID ${id}`);
        res.json({ ...user, teacherId: user.teacher_id });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});
// Endpoint para eliminar un usuario
app.delete('/api/users/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await (0, db_1.query)('DELETE FROM users WHERE id = $1', [id]);
        await (0, audit_1.logAction)(req.user.id, 'DELETE_USER', `Deleted user ID ${id}`);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});
// Endpoint para resetear la contraseña de un usuario
app.post('/api/users/:id/reset-password', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await (0, db_1.query)('UPDATE users SET password=$1 WHERE id=$2', [hashedPassword, id]);
        await (0, audit_1.logAction)(req.user.id, 'RESET_PASSWORD', `Reset password for user ID ${id}`);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al resetear contraseña' });
    }
});
// Calificaciones (Evaluaciones)
// Endpoint para sincronizar (Insertar o Actualizar) las calificaciones de un estudiante en una materia y año
// Recibe los arrays completos de notas para cada lapso
app.post('/api/calificaciones/sync', auth_1.authenticateToken, async (req, res) => {
    const { studentId, materiaId, añoId, lapso1, lapso2, lapso3 } = req.body;
    try {
        // Verificar si ya existen registros para esa combinación
        const check = await (0, db_1.query)('SELECT * FROM calificaciones WHERE student_id=$1 AND materia_id=$2 AND ano_escolar_id=$3', [studentId, materiaId, añoId]);
        if (check.rows.length > 0) {
            // Actualizar si existe
            await (0, db_1.query)('UPDATE calificaciones SET lapso1=$1, lapso2=$2, lapso3=$3 WHERE student_id=$4 AND materia_id=$5 AND ano_escolar_id=$6', [JSON.stringify(lapso1), JSON.stringify(lapso2), JSON.stringify(lapso3), studentId, materiaId, añoId]);
        }
        else {
            // Insertar si no existe
            await (0, db_1.query)('INSERT INTO calificaciones (student_id, materia_id, ano_escolar_id, lapso1, lapso2, lapso3) VALUES ($1, $2, $3, $4, $5, $6)', [studentId, materiaId, añoId, JSON.stringify(lapso1), JSON.stringify(lapso2), JSON.stringify(lapso3)]);
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al sincronizar calificaciones' });
    }
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
