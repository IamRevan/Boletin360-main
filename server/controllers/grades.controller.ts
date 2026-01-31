import { Request, Response } from 'express';
import { prisma } from '../db';
import { GradeSyncSchema, } from '../schemas';
import { AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';

// Define UserRole enum locally until Prisma client is regenerated
enum UserRole {
    ADMIN = 'ADMIN',
    DIRECTOR = 'DIRECTOR',
    CONTROL_ESTUDIOS = 'CONTROL_ESTUDIOS',
    DOCENTE = 'DOCENTE'
}

export const syncGrades = async (req: AuthRequest, res: Response) => {
    const validation = GradeSyncSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { studentId, materiaId, añoId, lapso1, lapso2, lapso3 } = validation.data;
    const userRole = req.user?.role;

    // Find existing Calificacion or Create it
    let calificacion = await prisma.calificacion.findUnique({
        where: {
            studentId_materiaId_anoEscolarId: {
                studentId,
                materiaId,
                anoEscolarId: añoId
            }
        }
    });

    if (calificacion) {
        // Check lock status
        if (calificacion.isLocked && ![UserRole.ADMIN, UserRole.CONTROL_ESTUDIOS, UserRole.DIRECTOR].includes(userRole as any)) {
            return res.status(403).json({ error: 'Calificaciones bloqueadas/aprobadas. No se pueden editar.' });
        }
    } else {
        // Create new container
        calificacion = await prisma.calificacion.create({
            data: {
                studentId,
                materiaId,
                anoEscolarId: añoId,
                isLocked: false
            }
        });
    }

    const cid = calificacion.id;

    // Helper to process evaluations (Sync: Delete old for lapso, insert new)
    const processLapso = async (lapsoNum: number, items: any[]) => {
        if (!items) return;
        // Transactional replacement for safety
        await prisma.$transaction([
            prisma.evaluation.deleteMany({
                where: { calificacionId: cid, lapso: lapsoNum }
            }),
            prisma.evaluation.createMany({
                data: items.map(item => ({
                    calificacionId: cid,
                    lapso: lapsoNum,
                    descripcion: item.nombre,
                    nota: item.nota,
                    ponderacion: item.ponderacion
                }))
            })
        ]);
    };

    // Execute sequentially or parallel (Parallel is fine here)
    await Promise.all([
        processLapso(1, lapso1),
        processLapso(2, lapso2),
        processLapso(3, lapso3)
    ]);

    // Emit Socket Event
    try {
        const { getIO } = require('../socket');
        getIO().emit('data_updated', { type: 'GRADE', studentId, materiaId });
    } catch (e) { }

    res.json({ success: true });
};

export const setLockStatus = async (req: Request, res: Response) => {
    const { studentId, materiaId, añoId, isLocked } = req.body;
    await prisma.calificacion.update({
        where: {
            studentId_materiaId_anoEscolarId: { studentId, materiaId, anoEscolarId: añoId }
        },
        data: { isLocked }
    });
    res.json({ success: true, message: `Calificaciones ${isLocked ? 'bloqueadas' : 'desbloqueadas'}` });
};

export const getBoletin = async (req: Request, res: Response) => {
    const { studentId, anoEscolarId } = req.query;
    if (!studentId || !anoEscolarId) return res.status(400).json({ error: 'Faltan parámetros' });

    const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
    const anoEscolar = await prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } });

    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    // Query Aggregated Grades
    const boletin = await prisma.$queryRaw`
        SELECT 
            m.id as materia_id,
            m.nombre_materia,
            c.is_locked,
            
            (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 1) as lapso1,
            (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 2) as lapso2,
            (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 3) as lapso3,

            g.nombre_grado,
            s.nombre_seccion,
            t.nombres as docente_nombres, t.apellidos as docente_apellidos
        FROM calificaciones c
        JOIN materias m ON c.materia_id = m.id
        JOIN grados g ON m.id_grado = g.id_grado
        LEFT JOIN secciones s ON m.id_seccion = s.id_seccion
        LEFT JOIN teachers t ON m.id_docente = t.id
        WHERE c.student_id = ${Number(studentId)} AND c.ano_escolar_id = ${Number(anoEscolarId)}
    `;

    res.json({
        student: {
            ...student,
            fecha_nacimiento: student.fechaNacimiento ? student.fechaNacimiento.toISOString().split('T')[0] : null
        },
        anoEscolar,
        boletin
    });
};

export const getActa = async (req: Request, res: Response) => {
    const { anoEscolarId, gradoId, seccionId, studentId } = req.query;

    if (!anoEscolarId) return res.status(400).json({ error: 'Faltan parámetros' });

    try {
        let result: any[] = [];
        let fetchedGradoId = gradoId;
        let fetchedSeccionId = seccionId;

        if (studentId) {
            const studentData = await prisma.student.findUnique({
                where: { id: Number(studentId) },
                include: { grado: true, seccion: true }
            });

            if (!studentData) return res.status(404).json({ error: 'Estudiante no encontrado' });

            fetchedGradoId = studentData.idGrado as any;
            fetchedSeccionId = studentData.idSeccion as any;

            result = await prisma.$queryRaw`
                SELECT 
                    st.id as student_id, st.nombres, st.apellidos, st.cedula,
                    m.id as materia_id, m.nombre_materia,
                    c.is_locked,
                    (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 1) as lapso1,
                    (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 2) as lapso2,
                    (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 3) as lapso3
                FROM students st
                LEFT JOIN calificaciones c ON st.id = c.student_id AND c.ano_escolar_id = ${Number(anoEscolarId)}
                LEFT JOIN materias m ON c.materia_id = m.id
                WHERE st.id = ${Number(studentId)}
            `;

        } else {
            if (!gradoId || !seccionId) return res.status(400).json({ error: 'Falta Grado/Seccion o StudentId' });
            result = await prisma.$queryRaw`
                SELECT 
                    st.id as student_id, st.nombres, st.apellidos, st.cedula,
                    m.id as materia_id, m.nombre_materia,
                    c.is_locked,
                    (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 1) as lapso1,
                    (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 2) as lapso2,
                    (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 3) as lapso3
                FROM students st
                JOIN calificaciones c ON st.id = c.student_id
                JOIN materias m ON c.materia_id = m.id
                WHERE c.ano_escolar_id = ${Number(anoEscolarId)} AND st.id_grado = ${Number(gradoId)} AND st.id_seccion = ${Number(seccionId)}
                ORDER BY st.apellidos, st.nombres, m.nombre_materia
            `;
        }

        const studentsMap = new Map();
        result.forEach(row => {
            if (!studentsMap.has(row.student_id)) {
                studentsMap.set(row.student_id, {
                    student_id: row.student_id,
                    nombres: row.nombres,
                    apellidos: row.apellidos,
                    cedula: row.cedula,
                    materias: []
                });
            }
            if (row.materia_id) {
                studentsMap.get(row.student_id).materias.push({
                    materia_id: row.materia_id,
                    nombre_materia: row.nombre_materia,
                    lapso1: row.lapso1, // Now a single number (averaged/summed)
                    lapso2: row.lapso2,
                    lapso3: row.lapso3,
                    is_locked: row.is_locked
                });
            }
        });

        const grado = await prisma.grado.findUnique({ where: { id: Number(fetchedGradoId) } });
        const seccion = await prisma.seccion.findUnique({ where: { id: Number(fetchedSeccionId) } });
        const ano = await prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } });

        res.json({
            grado,
            seccion,
            anoEscolar: ano,
            acta: Array.from(studentsMap.values())
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al generar acta/constancia' });
    }
};

export const exportXlsx = async (req: Request, res: Response) => {
    const { anoEscolarId, gradoId, seccionId } = req.query;
    if (!anoEscolarId || !gradoId || !seccionId) return res.status(400).json({ error: 'Faltan parámetros' });

    try {
        const result: any[] = await prisma.$queryRaw`
            SELECT 
                st.id as student_id, st.nombres, st.apellidos, st.cedula,
                m.id as materia_id, m.nombre_materia,
                (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 1) as lapso1,
                (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 2) as lapso2,
                (SELECT COALESCE(SUM(e.nota * e.ponderacion / 100), 0) FROM evaluations e WHERE e.calificacion_id = c.id AND e.lapso = 3) as lapso3
            FROM students st
            JOIN calificaciones c ON st.id = c.student_id
            JOIN materias m ON c.materia_id = m.id
            WHERE c.ano_escolar_id = ${Number(anoEscolarId)} AND st.id_grado = ${Number(gradoId)} AND st.id_seccion = ${Number(seccionId)}
            ORDER BY st.apellidos, st.nombres, m.nombre_materia
        `;

        const grado = await prisma.grado.findUnique({ where: { id: Number(gradoId) } });
        const seccion = await prisma.seccion.findUnique({ where: { id: Number(seccionId) } });
        const ano = await prisma.anosEscolares.findUnique({ where: { id: Number(anoEscolarId) } });

        if (!grado || !seccion || !ano) return res.status(404).json({ error: 'Datos no encontrados' });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Acta de Evaluación');

        worksheet.addRow(['REPÚBLICA BOLIVARIANA DE VENEZUELA']);
        worksheet.addRow(['MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN']);
        worksheet.addRow(['U.E.N "PEDRO EMILIO COLL"']);
        worksheet.addRow([`AÑO ESCOLAR: ${ano.nombre}`]);
        worksheet.addRow([`GRADO: ${grado.nombreGrado}  SECCIÓN: "${seccion.nombreSeccion}"`]);
        worksheet.addRow([]);

        const materiasMap = new Map();
        result.forEach(r => materiasMap.set(r.materia_id, r.nombre_materia));
        const materiasIds = Array.from(materiasMap.keys()).sort();

        const headerRow = ['Cédula', 'Estudiante'];
        materiasIds.forEach(mid => {
            headerRow.push(materiasMap.get(mid));
        });
        worksheet.addRow(headerRow);

        const studentsLink = new Map();
        result.forEach(r => {
            if (!studentsLink.has(r.student_id)) {
                studentsLink.set(r.student_id, {
                    cedula: r.cedula,
                    nombre: `${r.apellidos}, ${r.nombres}`,
                    materias: {}
                });
            }
            // Calculated values directly from SQL
            const final = ((r.lapso1 || 0) + (r.lapso2 || 0) + (r.lapso3 || 0)) / 3;
            studentsLink.get(r.student_id).materias[r.materia_id] = final.toFixed(1);
        });

        studentsLink.forEach((st) => {
            const row = [st.cedula, st.nombre];
            materiasIds.forEach(mid => {
                row.push(st.materias[mid] || '-');
            });
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=acta.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al exportar excel' });
    }
};
