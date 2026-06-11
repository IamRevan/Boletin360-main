import { Request, Response } from 'express';
import { prisma } from '../db';
import { StudentSchema } from '../schemas';
import { logAction } from '../services/audit';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../logger';

export const getStudentsList = async (req: AuthRequest, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
        const search = (req.query.search as string) || '';
        const gradoId = req.query.gradoId ? parseInt(req.query.gradoId as string) : undefined;
        const seccionId = req.query.seccionId ? parseInt(req.query.seccionId as string) : undefined;

        const where: any = { deletedAt: null };
        if (gradoId) where.idGrado = gradoId;
        if (seccionId) where.idSeccion = seccionId;
        if (search) {
            const terms = search.split(' ').filter(Boolean);
            where.AND = terms.map(term => ({
                OR: [
                    { nombres: { contains: term, mode: 'insensitive' } },
                    { apellidos: { contains: term, mode: 'insensitive' } },
                    { cedula: { contains: term, mode: 'insensitive' } }
                ]
            }));
        }

        const [total, students] = await Promise.all([
            prisma.student.count({ where }),
            prisma.student.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
            })
        ]);

        res.json({
            students: students.map(s => ({
                ...s,
                fechaNacimiento: s.fechaNacimiento ? s.fechaNacimiento.toISOString().split('T')[0] : null
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (err) {
        logger.error({ err }, 'Error listing students');
        res.status(500).json({ error: 'Error al listar estudiantes' });
    }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
    try {
        const validation = StudentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues });
        }
        const userId = req.user?.id;

        const student = await prisma.student.create({
            data: {
                ...validation.data,
                fechaNacimiento: validation.data.fechaNacimiento ? new Date(validation.data.fechaNacimiento) : null,
            }
        });

        await logAction(userId, 'CREATE_STUDENT', `Created student ${student.nombres} ${student.apellidos}`);

        const { getIO } = require('../socket');
        getIO().emit('data_updated', { type: 'STUDENT', id: student.id });

        res.json(student);
    } catch (err) {
        logger.error({ err }, 'Error creating student');
        res.status(500).json({ error: 'Error al crear el estudiante' });
    }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validation = StudentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues });
        }
        const userId = req.user?.id;

        const student = await prisma.student.update({
            where: { id: Number(id) },
            data: {
                ...validation.data,
                fechaNacimiento: validation.data.fechaNacimiento ? new Date(validation.data.fechaNacimiento) : null,
            }
        });

        await logAction(userId, 'UPDATE_STUDENT', `Updated student ID ${id}`);

        const { getIO } = require('../socket');
        getIO().emit('data_updated', { type: 'STUDENT', id: student.id });

        res.json(student);
    } catch (err) {
        logger.error({ err }, 'Error updating student');
        res.status(500).json({ error: 'Error al actualizar el estudiante' });
    }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        await prisma.student.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() }
        });

        await logAction(userId, 'DELETE_STUDENT', `Deleted student ID ${id} (Soft Delete)`);

        const { getIO } = require('../socket');
        getIO().emit('data_updated', { type: 'STUDENT', id: Number(id) });

        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, 'Error deleting student');
        res.status(500).json({ error: 'Error al eliminar el estudiante' });
    }
};

export const promoteStudents = async (req: AuthRequest, res: Response) => {
    const { studentIds, targetGradoId, targetSeccionId } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetGradoId || !targetSeccionId) {
        return res.status(400).json({ error: 'Datos de promoción incompletos' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            for (const id of studentIds) {
                await tx.student.update({
                    where: { id: Number(id) },
                    data: {
                        idGrado: targetGradoId,
                        idSeccion: targetSeccionId
                    }
                });
            }

            await logAction(userId, 'PROMOTE_STUDENTS', `Promoted ${studentIds.length} students to Grade ID ${targetGradoId}, Section ID ${targetSeccionId}`);
        });

        res.json({ success: true, message: `${studentIds.length} estudiantes promovidos con éxito.` });
    } catch (err) {
        logger.error({ err }, 'Error en promoción masiva');
        res.status(500).json({ error: 'Error al promover estudiantes' });
    }
};

export const getStudentProfile = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const student = await prisma.student.findUnique({
            where: { id: Number(id) }
        });

        if (!student) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        const calificaciones = await prisma.calificacion.findMany({
            where: { studentId: Number(id) },
            include: {
                materia: {
                    include: {
                        grado: true,
                        seccion: true
                    }
                },
                anoEscolar: true,
                evaluations: true
            }
        });

        const evalToObj = (e: { id: number; descripcion: string; nota: import('@prisma/client/runtime/library').Decimal; ponderacion: import('@prisma/client/runtime/library').Decimal }) => ({
            id: String(e.id),
            descripcion: e.descripcion,
            nota: Number(e.nota),
            ponderacion: Number(e.ponderacion)
        });

        const historyGrouped: any[] = [];
        calificaciones.forEach(c => {
            let yearGroup = historyGrouped.find(h => h.id === c.anoEscolarId);
            if (!yearGroup) {
                yearGroup = {
                    id: c.anoEscolarId,
                    nombre: c.anoEscolar.nombre,
                    nombreGrado: c.materia.grado?.nombreGrado || '',
                    nombreSeccion: c.materia.seccion?.nombreSeccion || '',
                    materias: []
                };
                historyGrouped.push(yearGroup);
            }
            yearGroup.materias.push({
                nombreMateria: c.materia.nombreMateria,
                lapso1: c.evaluations.filter(e => e.lapso === 1).map(evalToObj),
                lapso2: c.evaluations.filter(e => e.lapso === 2).map(evalToObj),
                lapso3: c.evaluations.filter(e => e.lapso === 3).map(evalToObj)
            });
        });

        res.json({
            student: {
                ...student,
                fechaNacimiento: student.fechaNacimiento ? student.fechaNacimiento.toISOString().split('T')[0] : null
            },
            history: historyGrouped
        });

    } catch (err) {
        logger.error({ err }, 'Error');
        res.status(500).json({ error: 'Error al obtener perfil del estudiante' });
    }
};
