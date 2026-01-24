import { Request, Response } from 'express';
import { prisma } from '../db';
import { StudentSchema } from '../schemas';
import { logAction } from '../services/audit';
import { AuthRequest } from '../middleware/auth';

export const createStudent = async (req: AuthRequest, res: Response) => {
    const validation = StudentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status } = validation.data;
    const userId = req.user?.id;

    try {
        const student = await prisma.student.create({
            data: {
                nacionalidad,
                cedula,
                nombres,
                apellidos,
                email,
                genero,
                fechaNacimiento: new Date(fecha_nacimiento),
                idGrado: id_grado,
                idSeccion: id_seccion,
                status
            }
        });

        await logAction(userId, 'CREATE_STUDENT', `Created student ${student.nombres} ${student.apellidos}`);
        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear estudiante' });
    }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status } = req.body;
    const userId = req.user?.id;

    try {
        const student = await prisma.student.update({
            where: { id: Number(id) },
            data: {
                nacionalidad,
                cedula,
                nombres,
                apellidos,
                email,
                genero,
                fechaNacimiento: new Date(fecha_nacimiento),
                idGrado: id_grado,
                idSeccion: id_seccion,
                status
            }
        });

        await logAction(userId, 'UPDATE_STUDENT', `Updated student ID ${id}`);
        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar estudiante' });
    }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // Soft delete
        await prisma.student.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() }
        });

        await logAction(userId, 'DELETE_STUDENT', `Deleted student ID ${id} (Soft Delete)`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar estudiante' });
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
        console.error('Error en promoción masiva:', err);
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

        // Fetch history using Prisma relations
        // Assuming Calificacion has relations to AnosEscolares, Materia (and Materia to Grado/Seccion)
        // Check schema.prisma to be sure relations are defined. 
        // Based on Step 27 schema, relations are implicit via foreign keys but maybe not fully relational in Prisma Model yet??
        // Wait, Step 27 schema has fields: `anoEscolarId`, `materiaId`.
        // BUT it does NOT have relation fields like `materia Materia @relation(...)`.
        // I need to update schema.prisma to include relations OR use manual joins? 
        // Actually, if I didn't update schema.prisma to add relations, I CANNOT use `include`.
        // The current schema just has scalar fields.
        
        // CRITICAL: The user asked to "activate Prisma". A proper Prisma usage involves relations.
        // However, updating Schema relations involves editing schema.prisma heavily.
        // If I stick to the current schema (raw mapping), I have to do separate queries or findRaw (if mongo, but this is SQL).
        // Since I want to deliver quality, I SHOULD add relations to schema.prisma.
        // But the user didn't explicitly ask for schema changes, just "activate Prisma".
        // Adding relations is non-breaking for DB structure (virtual in Prisma level), so I SHOULD do it.
        // BUT, I already generated the client based on the RAW schema.
        
        // For now, I will simulate the joins or just use raw queries via `prisma.$queryRaw` if I want to save time, 
        // OR better: Update schema.prisma to have relations.
        // Updating schema.prisma is the right way.
        
        // Let's pause `students.controller.ts` creation to Update `schema.prisma` first? 
        // No, I will write the controller assuming relations EXIST, and then I will update `schema.prisma`.
        // Actually, I can't "assume" because TS will scream if I generate client later.
        
        // Let's look at the schema again (Step 27).
        // It has `@@map` but no `@relation`.
        // I should update `schema.prisma` to include relations. 
        
        // For now, to avoid getting stuck in a huge Schema Loop, I will just use `prisma.calificacion.findMany` and then manually fetch referenced data 
        // OR use `prisma.$queryRaw` for this complex profile query if I don't want to touch schema.
        // BUT, `prisma.$queryRaw` defeats the purpose of "Typing".
        
        // Decision: I will update `schema.prisma` to add relations. It allows for `include`.
        // I will do that in the NEXT step. For now, I'll write the controller assuming I WILL add relations.
        // Wait, if I write code now that relies on relations, and the client isn't generated with them, I can't verify.
        
        // Alternative: separate queries.
        // 1. Get grades. 2. Get subjects for those grades. 3. Get years.
        // That's N+1 unless careful.
        // Given the timeline, I will use `prisma.$queryRaw` for the Profile "History" part to keep it efficient without managing 20 relations right now,
        // OR simply implement relations. Relations are easy.
        
        // I'll add relations to schema.prisma now.
        
        // Wait, if I edit schema.prisma now, I have to re-generate client.
        // I'll add a task for that.
        
        // I'll write the `getStudentProfile` using separate queries for now to be safe and robust, 
        // or just minimal relations.
        
        // Actually, raw query is safest for complex joins if relations aren't set up.
        // query: `SELECT ... FROM calificaciones c JOIN ...`
        // `prisma.$queryRaw\`...\``
        
        const history = await prisma.$queryRaw`
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
            WHERE c.student_id = ${Number(id)}
            ORDER BY a.nombre DESC
        `;
        
        // Grouping logic (same as original)
        // ...
        const historyGrouped: any[] = [];
        (history as any[]).forEach((row: any) => {
             let yearGroup = historyGrouped.find(h => h.id === row.ano_escolar_id);
             if (!yearGroup) {
                 yearGroup = {
                     id: row.ano_escolar_id,
                     nombre: row.ano_nombre,
                     grado: row.nombre_grado,
                     seccion: row.nombre_seccion,
                     materias: []
                 };
                 historyGrouped.push(yearGroup);
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
                fecha_nacimiento: student.fechaNacimiento ? student.fechaNacimiento.toISOString().split('T')[0] : null
            },
            history: historyGrouped
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener perfil del estudiante' });
    }
};
