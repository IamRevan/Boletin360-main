import { Request, Response } from 'express';
import { prisma } from '../db';
import { GradeSyncSchema, } from '../schemas';
import { AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import { logger } from '../logger';

// Define UserRole enum locally until Prisma client is regenerated
enum UserRole {
    ADMIN = 'ADMIN',
    DIRECTOR = 'DIRECTOR',
    CONTROL_ESTUDIOS = 'CONTROL_ESTUDIOS',
    DOCENTE = 'DOCENTE'
}

export const syncGrades = async (req: AuthRequest, res: Response) => {
    try {
        const validation = GradeSyncSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues });
        }
        const { studentId, materiaId, anoEscolarId, lapso1, lapso2, lapso3 } = validation.data;
        const userRole = req.user?.role;
        const teacherId = req.user?.teacherId;

        if (userRole === UserRole.DOCENTE) {
            const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
            if (!materia || materia.idDocente !== teacherId) {
                return res.status(403).json({ error: 'No tienes permisos para modificar las calificaciones de esta materia.' });
            }
        }

        let calificacion = await prisma.calificacion.findUnique({
            where: {
                studentId_materiaId_anoEscolarId: {
                    studentId,
                    materiaId,
                    anoEscolarId
                }
            }
        });

        if (calificacion) {
                    if (calificacion.isLocked && ![UserRole.ADMIN, UserRole.CONTROL_ESTUDIOS, UserRole.DIRECTOR].includes(userRole as UserRole)) {
                return res.status(403).json({ error: 'Calificaciones bloqueadas/aprobadas. No se pueden editar.' });
            }
        } else {
            calificacion = await prisma.calificacion.create({
                data: { studentId, materiaId, anoEscolarId, isLocked: false }
            });
        }

        const cid = calificacion.id;

        const lapsos = [[1, lapso1] as const, [2, lapso2] as const, [3, lapso3] as const];
        for (const [lapsoNum, items] of lapsos) {
            if (!items || items.length === 0) continue;
            const totalWeight = items.reduce((sum, item) => sum + Number(item.ponderacion), 0);
            if (totalWeight > 100) {
                return res.status(400).json({ error: `La suma de ponderaciones del lapso ${lapsoNum} es ${totalWeight}%. No puede exceder 100%.` });
            }
        }

        await Promise.all(
            lapsos.map(async ([lapsoNum, items]) => {
                if (!items || items.length === 0) return;
                await prisma.$transaction(async (tx: any) => {
                    await tx.evaluation.deleteMany({
                        where: { calificacionId: cid, lapso: lapsoNum }
                    });
                    await tx.evaluation.createMany({
                        data: items.map((item: any) => ({
                            calificacionId: cid,
                            lapso: lapsoNum,
                            descripcion: item.descripcion,
                            nota: item.nota,
                            ponderacion: item.ponderacion
                        }))
                    });
                });
            })
        );

        try {
            const { getIO } = require('../socket');
            getIO().emit('data_updated', { type: 'GRADE', studentId, materiaId });
        } catch (e) { }

        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, 'Error syncing grade');
        res.status(500).json({ error: 'Error al sincronizar la calificación' });
    }
};

export const syncBatchGrades = async (req: AuthRequest, res: Response) => {
    try {
        const { materiaId, anoEscolarId, lapso, evaluations, studentIds } = req.body;
        const userRole = req.user?.role;
        const teacherId = req.user?.teacherId;

        if (!materiaId || !anoEscolarId || !lapso || !evaluations?.length || !studentIds?.length) {
            return res.status(400).json({ error: 'Datos incompletos para sincronización masiva.' });
        }

        if (userRole === UserRole.DOCENTE) {
            const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
            if (!materia || materia.idDocente !== teacherId) {
                return res.status(403).json({ error: 'No tienes permisos para modificar las calificaciones de esta materia.' });
            }
        }

        await prisma.$transaction(async (tx) => {
            for (const studentId of studentIds) {
                let calificacion = await tx.calificacion.findUnique({
                    where: {
                        studentId_materiaId_anoEscolarId: { studentId, materiaId, anoEscolarId }
                    }
                });

                if (calificacion) {
            if (calificacion.isLocked && ![UserRole.ADMIN, UserRole.CONTROL_ESTUDIOS, UserRole.DIRECTOR].includes(userRole as UserRole)) {
                        continue;
                    }

                    const existingEval = await tx.evaluation.findMany({
                        where: { calificacionId: calificacion.id, lapso }
                    });
                    const existingWeight = existingEval.reduce((s, e) => s + Number(e.ponderacion), 0);
                    const newWeight = evaluations.reduce((s: number, e: any) => s + Number(e.ponderacion), 0);
                    if (existingWeight + newWeight > 100) {
                        throw new Error(`La suma de ponderaciones del lapso ${lapso} excede 100%. Peso actual: ${existingWeight}%, nuevo: ${newWeight}%.`);
                    }

                    for (const ev of evaluations) {
                        const exists = existingEval.some(e => e.descripcion === ev.descripcion);
                        if (!exists) {
                            await tx.evaluation.create({
                                data: {
                                    calificacionId: calificacion.id,
                                    lapso,
                                    descripcion: ev.descripcion,
                                    nota: 0,
                                    ponderacion: ev.ponderacion
                                }
                            });
                        }
                    }
                } else {
                    calificacion = await tx.calificacion.create({
                        data: { studentId, materiaId, anoEscolarId, isLocked: false }
                    });

                    for (const ev of evaluations) {
                        await tx.evaluation.create({
                            data: {
                                calificacionId: calificacion.id,
                                lapso,
                                descripcion: ev.descripcion,
                                nota: 0,
                                ponderacion: ev.ponderacion
                            }
                        });
                    }
                }
            }
        });

        try {
            const { getIO } = require('../socket');
            getIO().emit('data_updated', { type: 'GRADE', materiaId });
        } catch (e) { }

        res.json({ success: true, message: `Evaluaciones creadas para ${studentIds.length} estudiantes.` });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al sincronizar evaluaciones';
        logger.error({ err }, 'Error syncing batch grades');
        res.status(500).json({ error: message });
    }
};

export const setLockStatus = async (req: Request, res: Response) => {
    try {
        const { studentId, materiaId, anoEscolarId, isLocked } = req.body;
        await prisma.calificacion.update({
            where: {
                studentId_materiaId_anoEscolarId: { studentId, materiaId, anoEscolarId }
            },
            data: { isLocked }
        });
        res.json({ success: true, message: `Calificaciones ${isLocked ? 'bloqueadas' : 'desbloqueadas'}` });
    } catch (err) {
        logger.error({ err }, 'Error setting lock status');
        res.status(500).json({ error: 'Error al cambiar el estado de bloqueo' });
    }
};

export const getBoletin = async (req: Request, res: Response) => {
    try {
        const { studentId, anoEscolarId } = req.query;
        if (!studentId || !anoEscolarId) return res.status(400).json({ error: 'Faltan parámetros' });

        const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
        const anoEscolar = await prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } });

        if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

        const materias = await prisma.materia.findMany({
            where: {
                idGrado: student.idGrado ?? undefined,
                idSeccion: student.idSeccion ?? undefined,
                deletedAt: null
            },
            include: {
                grado: true,
                seccion: true,
                docente: true,
                calificaciones: {
                    where: { studentId: Number(studentId), anoEscolarId: Number(anoEscolarId) },
                    include: { evaluations: true }
                }
            }
        });

        const boletin = materias.map(m => {
            const cal = m.calificaciones[0];
            const evals = cal?.evaluations ?? [];
            return {
                materiaId: m.id,
                nombreMateria: m.nombreMateria,
                isLocked: cal?.isLocked ?? false,
                lapso1: calcWeightedSum(evals, 1),
                lapso2: calcWeightedSum(evals, 2),
                lapso3: calcWeightedSum(evals, 3),
                nombreGrado: m.grado?.nombreGrado ?? '',
                nombreSeccion: m.seccion?.nombreSeccion ?? '',
                docenteNombres: m.docente?.nombres ?? '',
                docenteApellidos: m.docente?.apellidos ?? ''
            };
        });

        res.json({
            student: {
                ...student,
                fechaNacimiento: student.fechaNacimiento ? student.fechaNacimiento.toISOString().split('T')[0] : null
            },
            anoEscolar,
            boletin
        });
    } catch (err) {
        logger.error({ err }, 'Error fetching boletin');
        res.status(500).json({ error: 'Error al generar el boletín' });
    }
};

const calcWeightedSum = (evaluations: { lapso: number; nota: import('@prisma/client/runtime/library').Decimal; ponderacion: import('@prisma/client/runtime/library').Decimal }[], lapso: number): number => {
    return evaluations
        .filter(e => e.lapso === lapso)
        .reduce((sum, e) => sum + Number(e.nota) * Number(e.ponderacion) / 100, 0);
};

export const getActa = async (req: Request, res: Response) => {
    const { anoEscolarId, gradoId, seccionId, studentId } = req.query;

    if (!anoEscolarId) return res.status(400).json({ error: 'Faltan parámetros' });

    try {
        let fetchedGradoId: number | null = gradoId ? Number(gradoId) : null;
        let fetchedSeccionId: number | null = seccionId ? Number(seccionId) : null;

        if (studentId) {
            const studentData = await prisma.student.findUnique({
                where: { id: Number(studentId) },
                include: { grado: true, seccion: true }
            });

            if (!studentData) return res.status(404).json({ error: 'Estudiante no encontrado' });

            fetchedGradoId = studentData.idGrado;
            fetchedSeccionId = studentData.idSeccion;

            const [studentWithGrades] = await Promise.all([
                prisma.student.findMany({
                    where: { id: Number(studentId) },
                    include: {
                        calificaciones: {
                            where: { anoEscolarId: Number(anoEscolarId) },
                            include: {
                                materia: true,
                                evaluations: true
                            }
                        }
                    }
                })
            ]);

            const student = studentWithGrades[0];
            const actaEntry = {
                studentId: student.id,
                nombres: student.nombres,
                apellidos: student.apellidos,
                cedula: student.cedula,
                materias: student.calificaciones.map(c => ({
                    materiaId: c.materiaId,
                    nombreMateria: c.materia.nombreMateria,
                    lapso1: calcWeightedSum(c.evaluations, 1),
                    lapso2: calcWeightedSum(c.evaluations, 2),
                    lapso3: calcWeightedSum(c.evaluations, 3),
                    isLocked: c.isLocked
                }))
            };

            const grado = fetchedGradoId ? await prisma.grado.findUnique({ where: { id: fetchedGradoId } }) : null;
            const seccion = fetchedSeccionId ? await prisma.seccion.findUnique({ where: { id: fetchedSeccionId } }) : null;
            const ano = await prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } });

            return res.json({
                grado,
                seccion,
                anoEscolar: ano,
                acta: [actaEntry]
            });
        }

        if (!gradoId || !seccionId) return res.status(400).json({ error: 'Falta Grado/Seccion o StudentId' });

        const students = await prisma.student.findMany({
            where: {
                idGrado: Number(gradoId),
                idSeccion: Number(seccionId),
                deletedAt: null
            },
            include: {
                calificaciones: {
                    where: { anoEscolarId: Number(anoEscolarId) },
                    include: {
                        materia: true,
                        evaluations: true
                    }
                }
            },
            orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
        });

        const materias = await prisma.materia.findMany({
            where: {
                idGrado: Number(gradoId),
                idSeccion: Number(seccionId),
                deletedAt: null
            }
        });

        const acta = students.map(st => {
            const studentMaterias = materias.map(m => {
                const cal = st.calificaciones.find(c => c.materiaId === m.id);
                const evals = cal?.evaluations ?? [];
                return {
                    materiaId: m.id,
                    nombreMateria: m.nombreMateria,
                    lapso1: calcWeightedSum(evals, 1),
                    lapso2: calcWeightedSum(evals, 2),
                    lapso3: calcWeightedSum(evals, 3),
                    isLocked: cal?.isLocked ?? false
                };
            });

            return {
                studentId: st.id,
                nombres: st.nombres,
                apellidos: st.apellidos,
                cedula: st.cedula,
                materias: studentMaterias
            };
        });

        const [grado, seccion, ano] = await Promise.all([
            prisma.grado.findUnique({ where: { id: Number(gradoId) } }),
            prisma.seccion.findUnique({ where: { id: Number(seccionId) } }),
            prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } })
        ]);

        res.json({ grado, seccion, anoEscolar: ano, acta });
    } catch (err) {
        logger.error({ err }, 'Error');
        res.status(500).json({ error: 'Error al generar acta/constancia' });
    }
};

export const exportXlsx = async (req: Request, res: Response) => {
    const { anoEscolarId, gradoId, seccionId } = req.query;
    if (!anoEscolarId || !gradoId || !seccionId) return res.status(400).json({ error: 'Faltan parámetros' });

    try {
        const [grado, seccion, ano, students, materias] = await Promise.all([
            prisma.grado.findUnique({ where: { id: Number(gradoId) } }),
            prisma.seccion.findUnique({ where: { id: Number(seccionId) } }),
            prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } }),
            prisma.student.findMany({
                where: {
                    idGrado: Number(gradoId),
                    idSeccion: Number(seccionId),
                    deletedAt: null
                },
                include: {
                    calificaciones: {
                        where: { anoEscolarId: Number(anoEscolarId) },
                        include: { evaluations: true }
                    }
                },
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }]
            }),
            prisma.materia.findMany({
                where: {
                    idGrado: Number(gradoId),
                    idSeccion: Number(seccionId),
                    deletedAt: null
                }
            })
        ]);

        if (!grado || !seccion || !ano) {
            return res.status(404).json({ error: 'Datos no encontrados' });
        }

        const filename = `acta_${grado.nombreGrado}_${seccion.nombreSeccion}.xlsx`
            .replace(/\s+/g, '_')
            .replace(/"/g, '');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const options = { stream: res, useStyles: true, useSharedStrings: true };
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
        const worksheet = workbook.addWorksheet('Acta de Evaluación');

        worksheet.addRow(['REPÚBLICA BOLIVARIANA DE VENEZUELA']).commit();
        worksheet.addRow(['MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN']).commit();
        worksheet.addRow(['U.E.N "PEDRO EMILIO COLL"']).commit();
        worksheet.addRow([`AÑO ESCOLAR: ${ano.nombre}`]).commit();
        worksheet.addRow([`GRADO: ${grado.nombreGrado}  SECCIÓN: "${seccion.nombreSeccion}"`]).commit();
        worksheet.addRow([]).commit();

        const materiasMap = new Map<number, string>();
        materias.forEach(m => materiasMap.set(m.id, m.nombreMateria));
        const materiasIds = Array.from(materiasMap.keys()).sort();

        const headerRow = ['Cédula', 'Estudiante'];
        materiasIds.forEach(mid => headerRow.push(materiasMap.get(mid)!));
        worksheet.addRow(headerRow).commit();

        students.forEach(st => {
            const row = [st.cedula, `${st.apellidos}, ${st.nombres}`];
            materiasIds.forEach(mid => {
                const cal = st.calificaciones.find(c => c.materiaId === mid);
                const evals = cal?.evaluations ?? [];
                const lapso1 = evals.filter(e => e.lapso === 1).reduce((s, e) => s + Number(e.nota) * Number(e.ponderacion) / 100, 0);
                const lapso2 = evals.filter(e => e.lapso === 2).reduce((s, e) => s + Number(e.nota) * Number(e.ponderacion) / 100, 0);
                const lapso3 = evals.filter(e => e.lapso === 3).reduce((s, e) => s + Number(e.nota) * Number(e.ponderacion) / 100, 0);
                const final = (lapso1 + lapso2 + lapso3) / 3;
                row.push(final > 0 ? final.toFixed(1) : '-');
            });
            worksheet.addRow(row).commit();
        });

        await workbook.commit();

    } catch (err) {
        logger.error({ err }, 'Error exporting XLSX');
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error al exportar excel' });
        }
    }
};
