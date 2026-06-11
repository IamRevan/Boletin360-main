import { Request, Response } from 'express';
import { prisma } from '../db';
import { TeacherSchema } from '../schemas';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../logger';

export const createTeacher = async (req: Request, res: Response) => {
    try {
        const validation = TeacherSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues });
        }
        const { nacionalidad, cedula, nombres, apellidos, email, status } = validation.data;

        const teacher = await prisma.teacher.create({
            data: { nacionalidad, cedula, nombres, apellidos, email, status: status as 'ACTIVO' | 'INACTIVO' }
        });
        res.json(teacher);
    } catch (err) {
        logger.error({ err }, 'Error creating teacher');
        res.status(500).json({ error: 'Error al crear el docente' });
    }
};

export const updateTeacher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nacionalidad, cedula, nombres, apellidos, email, status } = req.body;

        const teacher = await prisma.teacher.update({
            where: { id: Number(id) },
            data: { nacionalidad, cedula, nombres, apellidos, email, status }
        });
        res.json(teacher);
    } catch (err) {
        logger.error({ err }, 'Error updating teacher');
        res.status(500).json({ error: 'Error al actualizar el docente' });
    }
};

export const deleteTeacher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.teacher.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() }
        });
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, 'Error deleting teacher');
        res.status(500).json({ error: 'Error al eliminar el docente' });
    }
};

export const getTeacherClasses = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.teacherId;
        if (!teacherId) return res.status(403).json({ error: 'No tiene perfil de docente' });

        const materias = await prisma.materia.findMany({
            where: { idDocente: teacherId, deletedAt: null },
            include: { grado: true, seccion: true }
        });

        const result = await Promise.all(materias.map(async (m) => {
            const studentCount = await prisma.student.count({
                where: {
                    idGrado: m.idGrado ?? undefined,
                    idSeccion: m.idSeccion ?? undefined,
                    deletedAt: null
                }
            });
            return {
                id: m.id,
                nombre_materia: m.nombreMateria,
                nombre_grado: m.grado?.nombreGrado ?? '',
                nombre_seccion: m.seccion?.nombreSeccion ?? '',
                student_count: studentCount
            };
        }));

        res.json(result);
    } catch (err) {
        logger.error({ err }, 'Error getting teacher classes');
        res.status(500).json({ error: 'Error al obtener clases' });
    }
};

export const getTeacherClassStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { materiaId } = req.params;
        const teacherId = req.user?.teacherId;

        if (!teacherId) return res.status(403).json({ error: 'No tiene perfil de docente' });

        const materia = await prisma.materia.findUnique({
            where: { id: Number(materiaId) },
            include: { grado: true, seccion: true }
        });

        if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
        if (materia.idDocente !== teacherId) return res.status(403).json({ error: 'No tiene permisos para esta materia' });

        const anoEscolarActivo = await prisma.anosEscolares.findFirst({
            where: { deletedAt: null },
            orderBy: { id: 'desc' }
        });

        if (!anoEscolarActivo) return res.status(404).json({ error: 'No hay año escolar activo' });

        const students = await prisma.student.findMany({
            where: {
                idGrado: materia.idGrado ?? undefined,
                idSeccion: materia.idSeccion ?? undefined,
                deletedAt: null
            },
            include: {
                calificaciones: {
                    where: { anoEscolarId: anoEscolarActivo.id, materiaId: materia.id },
                    include: { evaluations: true }
                }
            },
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
        });

        const result = students.map(s => {
            const cal = s.calificaciones[0];
            return {
                id: s.id,
                nombres: s.nombres,
                apellidos: s.apellidos,
                cedula: s.cedula,
                isLocked: cal?.isLocked ?? false,
                lapso1: cal?.evaluations?.filter(e => e.lapso === 1).map(e => ({
                    id: e.id,
                    descripcion: e.descripcion,
                    nota: Number(e.nota),
                    ponderacion: Number(e.ponderacion)
                })) ?? [],
                lapso2: cal?.evaluations?.filter(e => e.lapso === 2).map(e => ({
                    id: e.id,
                    descripcion: e.descripcion,
                    nota: Number(e.nota),
                    ponderacion: Number(e.ponderacion)
                })) ?? [],
                lapso3: cal?.evaluations?.filter(e => e.lapso === 3).map(e => ({
                    id: e.id,
                    descripcion: e.descripcion,
                    nota: Number(e.nota),
                    ponderacion: Number(e.ponderacion)
                })) ?? []
            };
        });

        res.json({ students: result, anoEscolarId: anoEscolarActivo.id });
    } catch (err) {
        logger.error({ err }, 'Error getting class students');
        res.status(500).json({ error: 'Error al obtener estudiantes' });
    }
};
