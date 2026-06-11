import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../logger';

export const getInitialData = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({ where: { deletedAt: null } });
        const students = await prisma.student.findMany({ where: { deletedAt: null } });
        const teachers = await prisma.teacher.findMany();
        const materias = await prisma.materia.findMany();
        const grados = await prisma.grado.findMany();
        const secciones = await prisma.seccion.findMany();
        const anosEscolares = await prisma.anosEscolares.findMany();
        const calificaciones = await prisma.calificacion.findMany({
            include: { evaluations: true }
        });

        const userId = req.user?.id;
        // In Prisma, we might need to query the current User separately or filter from users array found above.
        // It's cleaner to query it:
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });

        // Format Grados (Alignment with unified naming)
        const formatGrados = grados.map(g => ({
            id: g.id,
            nombreGrado: g.nombreGrado,
            anoEscolarId: g.anoEscolarId
        }));

        // Format Secciones
        const formatSecciones = secciones.map(s => ({
            id: s.id,
            nombreSeccion: s.nombreSeccion,
            idGrado: s.idGrado
        }));

        // Format Materias
        const formatMaterias = materias.map(m => ({
            id: m.id,
            nombreMateria: m.nombreMateria,
            idDocente: m.idDocente,
            idGrado: m.idGrado,
            idSeccion: m.idSeccion
        }));

        const formatStudents = students.map(s => ({
            ...s,
            // id is already native from Prisma as 'id'
            // idGrado, idSeccion are already native from Prisma as 'idGrado', 'idSeccion'
            // fechaNacimiento is already native
            fechaNacimiento: s.fechaNacimiento ? s.fechaNacimiento.toISOString().split('T')[0] : null
        }));

        // Calificaciones
        const formatCalificaciones = calificaciones.map(c => ({
            id: c.id,
            studentId: c.studentId,
            materiaId: c.materiaId,
            anoEscolarId: c.anoEscolarId,
            isLocked: c.isLocked,
            lapso1: c.evaluations
                .filter(e => e.lapso === 1)
                .map(e => ({
                    id: String(e.id),
                    descripcion: e.descripcion,
                    nota: Number(e.nota),
                    ponderacion: Number(e.ponderacion)
                })),
            lapso2: c.evaluations
                .filter(e => e.lapso === 2)
                .map(e => ({
                    id: String(e.id),
                    descripcion: e.descripcion,
                    nota: Number(e.nota),
                    ponderacion: Number(e.ponderacion)
                })),
            lapso3: c.evaluations
                .filter(e => e.lapso === 3)
                .map(e => ({
                    id: String(e.id),
                    descripcion: e.descripcion,
                    nota: Number(e.nota),
                    ponderacion: Number(e.ponderacion)
                }))
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
        logger.error({ err }, 'Error');
        res.status(500).json({ error: 'Error al obtener datos iniciales' });
    }
};
