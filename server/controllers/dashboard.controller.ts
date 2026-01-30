import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getInitialData = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({ where: { deletedAt: null } });
        const students = await prisma.student.findMany({ where: { deletedAt: null } });
        const teachers = await prisma.teacher.findMany();
        const materias = await prisma.materia.findMany();
        const grados = await prisma.grado.findMany();
        const secciones = await prisma.seccion.findMany();
        const anosEscolares = await prisma.anosEscolares.findMany();
        const calificaciones = await prisma.calificacion.findMany();

        const userId = req.user?.id;
        // In Prisma, we might need to query the current User separately or filter from users array found above.
        // It's cleaner to query it:
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });

        // Format Grados (Frontend expects id_grado, nombre_grado)
        const formatGrados = grados.map(g => ({
            id_grado: g.id,
            nombre_grado: g.nombreGrado
        }));

        // Format Secciones (Frontend expects id_seccion, nombre_seccion)
        const formatSecciones = secciones.map(s => ({
            id_seccion: s.id,
            nombre_seccion: s.nombreSeccion
        }));

        // Format Materias (Frontend expects snake_case)
        const formatMaterias = materias.map(m => ({
            id: m.id,
            nombre_materia: m.nombreMateria,
            id_docente: m.idDocente,
            id_grado: m.idGrado,
            id_seccion: m.idSeccion
        }));

        // Format Teachers (Frontend matches mostly, check status enum case?)
        // Frontend uses 'Activo'/'Inactivo'. DB uses same.

        const formatStudents = students.map(s => ({
            ...s,
            id: s.id,
            nacionalidad: s.nacionalidad,
            cedula: s.cedula,
            nombres: s.nombres,
            apellidos: s.apellidos,
            email: s.email,
            genero: s.genero,
            id_grado: s.idGrado,
            id_seccion: s.idSeccion,
            status: s.status,
            fecha_nacimiento: s.fechaNacimiento ? s.fechaNacimiento.toISOString().split('T')[0] : null
        }));

        // Note: Calificaciones now use normalized Evaluation table
        // Frontend will need to fetch evaluations separately or we aggregate here
        const formatCalificaciones = calificaciones.map(c => ({
            id: c.studentId,
            id_materia: c.materiaId,
            id_año_escolar: c.anoEscolarId,
            // Removed lapso1/2/3 - frontend should query evaluations endpoint
            lapso1: [], // Empty arrays for backward compat
            lapso2: [],
            lapso3: []
        }));

        const formatUsers = users.map(u => ({
            ...u,
            teacherId: u.teacherId
        }));

        // Safe current user
        let safeCurrentUser = null;
        if (currentUser) {
            const { password, ...rest } = currentUser;
            safeCurrentUser = { ...rest, teacherId: currentUser.teacherId };
        }

        res.json({
            currentUser: safeCurrentUser,
            users: formatUsers,
            students: formatStudents,
            teachers,
            materias: formatMaterias,
            grados: formatGrados,
            secciones: formatSecciones,
            añosEscolares: anosEscolares,
            calificaciones: formatCalificaciones,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos iniciales' });
    }
};
