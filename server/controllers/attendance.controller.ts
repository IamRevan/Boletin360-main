import { Request, Response } from 'express';
import { prisma } from '../db';
import { logger } from '../logger';
import { AuthRequest } from '../middleware/auth';

export const getAttendanceByDate = async (req: AuthRequest, res: Response) => {
    try {
        const { gradoId, seccionId, fecha } = req.query;
        if (!gradoId || !seccionId || !fecha) {
            return res.status(400).json({ error: 'Faltan parámetros: gradoId, seccionId, fecha' });
        }

        const targetDate = new Date(fecha as string);
        targetDate.setHours(0, 0, 0, 0);

        const students = await prisma.student.findMany({
            where: {
                idGrado: Number(gradoId),
                idSeccion: Number(seccionId),
                deletedAt: null
            },
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
        });

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                studentId: { in: students.map(s => s.id) },
                fecha: {
                    gte: targetDate,
                    lt: new Date(targetDate.getTime() + 86400000)
                }
            }
        });

        const attendanceMap = new Map(attendanceRecords.map(a => [a.studentId, a]));

        const result = students.map(s => {
            const record = attendanceMap.get(s.id);
            return {
                id: s.id,
                nombres: s.nombres,
                apellidos: s.apellidos,
                cedula: s.cedula,
                status: record?.status ?? null,
                observacion: record?.observacion ?? null,
                attendanceId: record?.id ?? null
            };
        });

        res.json({ fecha: fecha as string, students: result });
    } catch (err) {
        logger.error({ err }, 'Error getting attendance by date');
        res.status(500).json({ error: 'Error al obtener asistencia' });
    }
};

export const saveAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { fecha, records } = req.body;
        if (!fecha || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'Faltan datos: fecha y records requeridos' });
        }

        const targetDate = new Date(fecha);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate.getTime() + 86400000);

        await prisma.$transaction(async (tx: any) => {
            for (const record of records) {
                const { studentId, status, observacion } = record;
                if (!studentId || !status) continue;

                const existing = await tx.attendance.findUnique({
                    where: {
                        studentId_fecha: { studentId, fecha: targetDate }
                    }
                });

                if (existing) {
                    await tx.attendance.update({
                        where: { id: existing.id },
                        data: { status, observacion: observacion || null }
                    });
                } else {
                    await tx.attendance.create({
                        data: {
                            studentId,
                            fecha: targetDate,
                            status,
                            observacion: observacion || null
                        }
                    });
                }
            }
        });

        res.json({ success: true, message: `Asistencia registrada para ${records.length} estudiantes.` });
    } catch (err) {
        logger.error({ err }, 'Error saving attendance');
        res.status(500).json({ error: 'Error al guardar asistencia' });
    }
};

export const getStudentAttendanceHistory = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const { desde, hasta } = req.query;

        const where: any = { studentId: Number(studentId) };
        if (desde || hasta) {
            where.fecha = {};
            if (desde) where.fecha.gte = new Date(desde as string);
            if (hasta) where.fecha.lte = new Date(hasta as string);
        }

        const records = await prisma.attendance.findMany({
            where,
            orderBy: { fecha: 'desc' }
        });

        const stats = {
            total: records.length,
            presente: records.filter(r => r.status === 'PRESENTE').length,
            ausente: records.filter(r => r.status === 'AUSENTE').length,
            tarde: records.filter(r => r.status === 'TARDE').length,
            justificado: records.filter(r => r.status === 'JUSTIFICADO').length
        };

        res.json({
            records: records.map(r => ({
                id: r.id,
                fecha: r.fecha.toISOString().split('T')[0],
                status: r.status,
                observacion: r.observacion
            })),
            stats
        });
    } catch (err) {
        logger.error({ err }, 'Error getting student attendance history');
        res.status(500).json({ error: 'Error al obtener historial de asistencia' });
    }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
    try {
        const { gradoId, seccionId } = req.query;
        if (!gradoId || !seccionId) {
            return res.status(400).json({ error: 'Faltan parámetros: gradoId, seccionId' });
        }

        const students = await prisma.student.findMany({
            where: {
                idGrado: Number(gradoId),
                idSeccion: Number(seccionId),
                deletedAt: null
            },
            select: { id: true, nombres: true, apellidos: true, cedula: true }
        });

        const records = await prisma.attendance.groupBy({
            by: ['studentId', 'status'],
            where: {
                studentId: { in: students.map(s => s.id) }
            },
            _count: true
        });

        const summaryMap = new Map<number, { PRESENTE: number; AUSENTE: number; TARDE: number; JUSTIFICADO: number }>();
        records.forEach(r => {
            if (!summaryMap.has(r.studentId)) {
                summaryMap.set(r.studentId, { PRESENTE: 0, AUSENTE: 0, TARDE: 0, JUSTIFICADO: 0 });
            }
            const entry = summaryMap.get(r.studentId)!;
            entry[r.status as keyof typeof entry] = r._count;
        });

        const result = students.map(s => {
            const stats = summaryMap.get(s.id) || { PRESENTE: 0, AUSENTE: 0, TARDE: 0, JUSTIFICADO: 0 };
            const total = stats.PRESENTE + stats.AUSENTE + stats.TARDE + stats.JUSTIFICADO;
            return {
                ...s,
                ...stats,
                total,
                porcentaje: total > 0 ? ((stats.PRESENTE + stats.JUSTIFICADO) / total * 100).toFixed(1) : '0.0'
            };
        });

        res.json(result);
    } catch (err) {
        logger.error({ err }, 'Error getting attendance summary');
        res.status(500).json({ error: 'Error al obtener resumen de asistencia' });
    }
};
