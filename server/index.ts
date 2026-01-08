import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, query } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRole } from './middleware/auth';
import { logAction } from './services/audit';
import { LoginSchema, StudentSchema, TeacherSchema, CreateUserSchema, UpdateUserSchema } from './schemas';

// Clave secreta para JWT (Debe ser segura en producción)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Habilitar parsing de JSON en el body

// Inicializar Base de Datos
initDB();

// --- RUTAS DE LA API ---

// Datos Iniciales (Carga inicial del dashboard)
// Obtiene todos los datos necesarios para popular el estado de la aplicación
app.get('/api/initial-data', authenticateToken, async (req, res) => {
    try {
        const users = await query('SELECT * FROM users');
        const students = await query('SELECT * FROM students WHERE deleted_at IS NULL');
        const teachers = await query('SELECT * FROM teachers');
        const materias = await query('SELECT * FROM materias');
        const grados = await query('SELECT * FROM grados');
        const secciones = await query('SELECT * FROM secciones');
        const anosEscolares = await query('SELECT * FROM anos_escolares');
        const calificaciones = await query('SELECT * FROM calificaciones');

        // Fetch current user details
        const userId = (req as any).user.id;
        const currentUserResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
        const currentUser = currentUserResult.rows[0] ? { ...currentUserResult.rows[0], teacherId: currentUserResult.rows[0].teacher_id } : null;

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
            currentUser, // Include authenticated user
            users: formatUsers,
            students: formatStudents,
            teachers: teachers.rows,
            materias: materias.rows,
            grados: grados.rows,
            secciones: secciones.rows,
            añosEscolares: anosEscolares.rows,
            calificaciones: formatCalificaciones,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos iniciales' });
    }
});

// Login
// Login
// Endpoint de Inicio de Sesión
app.post('/api/login', async (req, res) => {
    // Validar datos de entrada con Zod
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { email, password } = validation.data;
    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Verificar contraseña con bcrypt
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                // Generar token JWT si la contraseña es válida
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
                res.json({ ...user, teacherId: user.teacher_id, token });
            } else {
                res.status(401).json({ error: 'Credenciales inválidas' });
            }
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el inicio de sesión' });
    }
});

// Generic CRUD helpers could be useful, but let's be explicit for now.

// Students
// Estudiantes
// Endpoint para crear un nuevo estudiante
app.post('/api/students', authenticateToken, async (req, res) => {
    // Validar datos con esquema Zod
    const validation = StudentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status } = validation.data;
    try {
        const result = await query(
            `INSERT INTO students (nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status]
        );
        const student = result.rows[0];
        // Registrar acción en auditoría
        await logAction((req as any).user.id, 'CREATE_STUDENT', `Created student ${student.nombres} ${student.apellidos}`);
        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear estudiante' });
    }
});

// Endpoint para actualizar un estudiante existente
app.put('/api/students/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status } = req.body;
    try {
        const result = await query(
            `UPDATE students SET nacionalidad=$1, cedula=$2, nombres=$3, apellidos=$4, email=$5, genero=$6, fecha_nacimiento=$7, id_grado=$8, id_seccion=$9, status=$10 WHERE id=$11 RETURNING *`,
            [nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status, id]
        );
        const student = result.rows[0];
        await logAction((req as any).user.id, 'UPDATE_STUDENT', `Updated student ID ${id}`);
        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar estudiante' });
    }
});

// Endpoint para eliminar (Soft Delete) un estudiante
app.delete('/api/students/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete: solo se actualiza deleted_at, no se borra la fila
        await query('UPDATE students SET deleted_at = NOW() WHERE id = $1', [id]);
        await logAction((req as any).user.id, 'DELETE_STUDENT', `Deleted student ID ${id} (Soft Delete)`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar estudiante' });
    }
});

// Docentes
// Endpoint para crear un nuevo docente
app.post('/api/teachers', authenticateToken, async (req, res) => {
    const validation = TeacherSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nacionalidad, cedula, nombres, apellidos, email, status } = validation.data;
    try {
        const result = await query(
            `INSERT INTO teachers (nacionalidad, cedula, nombres, apellidos, email, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [nacionalidad, cedula, nombres, apellidos, email, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear docente' });
    }
});

// Endpoint para actualizar un docente
app.put('/api/teachers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nacionalidad, cedula, nombres, apellidos, email, status } = req.body;
    try {
        const result = await query(
            `UPDATE teachers SET nacionalidad=$1, cedula=$2, nombres=$3, apellidos=$4, email=$5, status=$6 WHERE id=$7 RETURNING *`,
            [nacionalidad, cedula, nombres, apellidos, email, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar docente' });
    }
});

// Endpoint para eliminar un docente
app.delete('/api/teachers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM teachers WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar docente' });
    }
});

// Materias
// Endpoint para crear una nueva materia
app.post('/api/materias', authenticateToken, async (req, res) => {
    const { nombre_materia, id_docente, id_grado, id_seccion } = req.body;
    try {
        const result = await query(
            `INSERT INTO materias (nombre_materia, id_docente, id_grado, id_seccion) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nombre_materia, id_docente, id_grado, id_seccion]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear materia' });
    }
});

// Endpoint para actualizar una materia
app.put('/api/materias/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_materia, id_docente, id_grado, id_seccion } = req.body;
    try {
        const result = await query(
            `UPDATE materias SET nombre_materia=$1, id_docente=$2, id_grado=$3, id_seccion=$4 WHERE id=$5 RETURNING *`,
            [nombre_materia, id_docente, id_grado, id_seccion, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar materia' });
    }
});

// Endpoint para eliminar una materia
app.delete('/api/materias/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM materias WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar materia' });
    }
});

// Grados (Niveles educativos)
// Endpoint para crear un grado
app.post('/api/grados', async (req, res) => {
    const { nombre_grado } = req.body;
    try {
        const result = await query('INSERT INTO grados (nombre_grado) VALUES ($1) RETURNING *', [nombre_grado]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear grado' });
    }
});

// Endpoint para actualizar un grado
app.put('/api/grados/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_grado } = req.body;
    try {
        const result = await query('UPDATE grados SET nombre_grado=$1 WHERE id_grado=$2 RETURNING *', [nombre_grado, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar grado' });
    }
});

// Endpoint para eliminar un grado
app.delete('/api/grados/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM grados WHERE id_grado = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar grado' });
    }
});

// Secciones (Aulas)
// Endpoint para crear una sección
app.post('/api/secciones', async (req, res) => {
    const { nombre_seccion } = req.body;
    try {
        const result = await query('INSERT INTO secciones (nombre_seccion) VALUES ($1) RETURNING *', [nombre_seccion]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear sección' });
    }
});

// Endpoint para actualizar una sección
app.put('/api/secciones/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_seccion } = req.body;
    try {
        const result = await query('UPDATE secciones SET nombre_seccion=$1 WHERE id_seccion=$2 RETURNING *', [nombre_seccion, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar sección' });
    }
});

// Endpoint para eliminar una sección
app.delete('/api/secciones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM secciones WHERE id_seccion = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar sección' });
    }
});

// Años Escolares (Períodos académicos)
// Endpoint para crear un año escolar
app.post('/api/schoolyears', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { nombre } = req.body;
    try {
        const result = await query('INSERT INTO anos_escolares (nombre) VALUES ($1) RETURNING *', [nombre]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear año escolar' });
    }
});

// Endpoint para actualizar un año escolar
app.put('/api/schoolyears/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        const result = await query('UPDATE anos_escolares SET nombre=$1 WHERE id=$2 RETURNING *', [nombre, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar año escolar' });
    }
});

// Endpoint para eliminar un año escolar
app.delete('/api/schoolyears/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM anos_escolares WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar año escolar' });
    }
});

// Usuarios
// Endpoint para crear un usuario (Admin o Docente)
app.post('/api/users', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const validation = CreateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nombres, apellidos, email, password, role, teacherId } = validation.data;
    try {
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO users (nombres, apellidos, email, password, role, teacher_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [nombres, apellidos, email, hashedPassword, role, teacherId]
        );
        const user = result.rows[0];
        await logAction((req as any).user.id, 'CREATE_USER', `Created user ${user.email} with role ${user.role}`);
        res.json({ ...user, teacherId: user.teacher_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Endpoint para actualizar un usuario
app.put('/api/users/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { id } = req.params;
    const validation = UpdateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nombres, apellidos, email, password, role, teacherId } = validation.data;
    try {
        let hashedPassword = password;
        if (password) {
            // Si se proporciona nueva contraseña, hashearla
            hashedPassword = await bcrypt.hash(password, 10);
        } else {
            // Si no se proporciona, mantener la anterior
            const currentUser = await query('SELECT password FROM users WHERE id=$1', [id]);
            hashedPassword = currentUser.rows[0].password;
        }

        const result = await query(
            `UPDATE users SET nombres=$1, apellidos=$2, email=$3, password=$4, role=$5, teacher_id=$6 WHERE id=$7 RETURNING *`,
            [nombres, apellidos, email, hashedPassword, role, teacherId, id]
        );
        const user = result.rows[0];
        await logAction((req as any).user.id, 'UPDATE_USER', `Updated user ID ${id}`);
        res.json({ ...user, teacherId: user.teacher_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// Endpoint para eliminar un usuario
app.delete('/api/users/:id', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM users WHERE id = $1', [id]);
        await logAction((req as any).user.id, 'DELETE_USER', `Deleted user ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// Endpoint para resetear la contraseña de un usuario
app.post('/api/users/:id/reset-password', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password=$1 WHERE id=$2', [hashedPassword, id]);
        await logAction((req as any).user.id, 'RESET_PASSWORD', `Reset password for user ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al resetear contraseña' });
    }
});

// Calificaciones (Evaluaciones)
// Endpoint para sincronizar (Insertar o Actualizar) las calificaciones de un estudiante en una materia y año
// Recibe los arrays completos de notas para cada lapso
app.post('/api/calificaciones/sync', authenticateToken, async (req, res) => {
    const { studentId, materiaId, añoId, lapso1, lapso2, lapso3 } = req.body;
    try {
        // Verificar si ya existen registros para esa combinación
        const check = await query(
            'SELECT * FROM calificaciones WHERE student_id=$1 AND materia_id=$2 AND ano_escolar_id=$3',
            [studentId, materiaId, añoId]
        );

        if (check.rows.length > 0) {
            // Actualizar si existe
            await query(
                'UPDATE calificaciones SET lapso1=$1, lapso2=$2, lapso3=$3 WHERE student_id=$4 AND materia_id=$5 AND ano_escolar_id=$6',
                [JSON.stringify(lapso1), JSON.stringify(lapso2), JSON.stringify(lapso3), studentId, materiaId, añoId]
            );
        } else {
            // Insertar si no existe
            await query(
                'INSERT INTO calificaciones (student_id, materia_id, ano_escolar_id, lapso1, lapso2, lapso3) VALUES ($1, $2, $3, $4, $5, $6)',
                [studentId, materiaId, añoId, JSON.stringify(lapso1), JSON.stringify(lapso2), JSON.stringify(lapso3)]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al sincronizar calificaciones' });
    }
});


// --- REPORTES ---
// Endpoint para obtener el boletín de notas
app.get('/api/reports/boletin', authenticateToken, async (req, res) => {
    const { studentId, anoEscolarId } = req.query;

    if (!studentId || !anoEscolarId) {
        return res.status(400).json({ error: 'Faltan parámetros studentId o anoEscolarId' });
    }

    try {
        // 1. Datos del Estudiante
        const studentRes = await query('SELECT * FROM students WHERE id = $1', [studentId]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        const student = studentRes.rows[0];

        // 2. Año Escolar
        const anoRes = await query('SELECT * FROM anos_escolares WHERE id = $1', [anoEscolarId]);
        const anoEscolar = anoRes.rows[0];

        // 3. Calificaciones con detalles de Materia, Grado, Sección y Docente
        const gradesQuery = `
            SELECT 
                c.lapso1, c.lapso2, c.lapso3,
                m.nombre_materia,
                g.nombre_grado,
                s.nombre_seccion,
                t.nombres as docente_nombres, t.apellidos as docente_apellidos
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
            JOIN grados g ON m.id_grado = g.id_grado
            LEFT JOIN secciones s ON m.id_seccion = s.id_seccion
            LEFT JOIN teachers t ON m.id_docente = t.id
            WHERE c.student_id = $1 AND c.ano_escolar_id = $2
        `;
        const gradesRes = await query(gradesQuery, [studentId, anoEscolarId]);

        res.json({
            student: {
                ...student,
                fecha_nacimiento: student.fecha_nacimiento ? new Date(student.fecha_nacimiento).toISOString().split('T')[0] : null
            },
            anoEscolar,
            boletin: gradesRes.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al generar el boletín' });
    }
});

// --- PROMOCION ---
// Endpoint para promoción masiva de estudiantes
app.post('/api/students/promote', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
    const { studentIds, targetGradoId, targetSeccionId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetGradoId || !targetSeccionId) {
        return res.status(400).json({ error: 'Datos de promoción incompletos' });
    }

    try {
        await query('BEGIN');

        for (const id of studentIds) {
            await query(
                'UPDATE students SET id_grado = $1, id_seccion = $2 WHERE id = $3',
                [targetGradoId, targetSeccionId, id]
            );
        }

        await logAction(
            (req as any).user.id,
            'PROMOTE_STUDENTS',
            `Promoted ${studentIds.length} students to Grade ID ${targetGradoId}, Section ID ${targetSeccionId}`
        );

        await query('COMMIT');
        res.json({ success: true, message: `${studentIds.length} estudiantes promovidos con éxito.` });

    } catch (err) {
        await query('ROLLBACK');
        console.error('Error en promoción masiva:', err);
        res.status(500).json({ error: 'Error al promover estudiantes' });
    }
});

// --- PERFIL DE ESTUDIANTE ---
// Endpoint para obtener el perfil completo e historial de n estudiante
app.get('/api/students/:id/profile', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Datos básicos
        const studentRes = await query('SELECT * FROM students WHERE id = $1', [id]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        const student = studentRes.rows[0];

        // 2. Historial de Calificaciones (Agrupado por Año Escolar)
        // Obtenemos todas las calificaciones del estudiante
        const historyQuery = `
            SELECT 
                c.ano_escolar_id,
                a.nombre as ano_nombre,
                c.lapso1, c.lapso2, c.lapso3,
                m.nombre_materia,
                g.nombre_grado,
                s.nombre_seccion
            FROM calificaciones c
            JOIN anos_escolares a ON c.ano_escolar_id = a.id
            JOIN materias m ON c.materia_id = m.id
            JOIN grados g ON m.id_grado = g.id_grado
            LEFT JOIN secciones s ON m.id_seccion = s.id_seccion
            WHERE c.student_id = $1
            ORDER BY a.nombre DESC
        `;
        const historyRes = await query(historyQuery, [id]);

        // Agrupar por Año Escolar
        const history: any[] = [];
        historyRes.rows.forEach(row => {
            let yearGroup = history.find(h => h.id === row.ano_escolar_id);
            if (!yearGroup) {
                yearGroup = {
                    id: row.ano_escolar_id,
                    nombre: row.ano_nombre,
                    grado: row.nombre_grado, // Tomamos el grado de la primera materia encontrada (asumiendo consistencia)
                    seccion: row.nombre_seccion,
                    materias: []
                };
                history.push(yearGroup);
            }
            yearGroup.materias.push({
                nombre_materia: row.nombre_materia,
                lapso1: row.lapso1,
                lapso2: row.lapso2,
                lapso3: row.lapso3
            });
        });

        res.json({
            student: {
                ...student,
                fecha_nacimiento: student.fecha_nacimiento ? new Date(student.fecha_nacimiento).toISOString().split('T')[0] : null
            },
            history
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener perfil del estudiante' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
