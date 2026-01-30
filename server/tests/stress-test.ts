import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONCURRENT_USERS = 50;
const TEST_DURATION_MS = 10000;

async function runStressTest() {
    console.log('--- Starting Database Stress Test ---');
    console.log(`Simulating ${CONCURRENT_USERS} concurrent users writing grades...`);

    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;
    let deadlockCount = 0;

    // Use existing IDs or create temporary test data
    let studentId = 1;
    let materiaId = 1;
    let anoEscolarId = 1;

    try {
        console.log("Setting up test data...");
        // Ensure Grado
        const grado = await prisma.grado.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, nombreGrado: 'Stress Test Grade' }
        });
        // Ensure Seccion
        const seccion = await prisma.seccion.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, nombreSeccion: 'S' }
        });
        // Ensure Year
        const year = await prisma.anosEscolares.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, nombre: '2025-STRESS' }
        });
        // Ensure Student
        const student = await prisma.student.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                nacionalidad: 'V',
                cedula: 'STRESS-1',
                nombres: 'Stress',
                apellidos: 'Test',
                email: 'stress@test.com',
                genero: 'M',
                idGrado: grado.id,
                idSeccion: seccion.id,
                status: 'ACTIVO'
            }
        });
        // Ensure Materia
        const materia = await prisma.materia.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                nombreMateria: 'Stress Test Subject',
                idGrado: grado.id,
                idSeccion: seccion.id
            }
        });

        studentId = student.id;
        materiaId = materia.id;
        anoEscolarId = year.id;
        console.log(`Test data ready: Student ${studentId}, Subject ${materiaId}`);
    } catch (e: any) {
        console.error("Setup failed:", e.message);
        // Fallback to ID 1 and hope for the best
    }

    const tasks = Array.from({ length: CONCURRENT_USERS }).map(async (_, idx) => {
        while (Date.now() - startTime < TEST_DURATION_MS) {
            try {
                // Transactional Upsert
                await prisma.$transaction(async (tx) => {
                    let cal = await tx.calificacion.findUnique({
                        where: { studentId_materiaId_anoEscolarId: { studentId, materiaId, anoEscolarId } }
                    });

                    if (!cal) {
                        cal = await tx.calificacion.create({
                            data: { studentId, materiaId, anoEscolarId }
                        });
                    }

                    // Check lock
                    if (cal.isLocked) {
                        return;
                    }

                    // Random grade to simulate activity
                    const grade = Math.floor(Math.random() * 20);

                    await tx.evaluation.deleteMany({
                        where: { calificacionId: (cal as any).id, lapso: 1 }
                    });

                    await tx.evaluation.create({
                        data: {
                            calificacionId: (cal as any).id,
                            lapso: 1,
                            descripcion: `Stress Test ${idx}`,
                            nota: grade,
                            ponderacion: 20
                        }
                    });
                });

                successCount++;
            } catch (err: any) {
                failCount++;
                if (err.code === 'P2002') {
                    // Race condition on create handled
                } else if (err.code === 'P2034' || err.message?.includes('deadlock')) {
                    deadlockCount++;
                }
            }
            // Small delay to prevent complete DOS of local machine
            await new Promise(r => setTimeout(r, 50));
        }
    });

    await Promise.all(tasks);

    console.log('--- Stress Test Results ---');
    console.log(`Success Ops: ${successCount}`);
    console.log(`Failed Ops: ${failCount}`);
    console.log(`Deadlocks: ${deadlockCount}`);

    if (deadlockCount > 0) {
        console.error('FAILED: Deadlocks detected. Database locking needs review.');
        process.exit(1);
    } else {
        console.log('PASSED: No deadlocks detected under load.');
        process.exit(0);
    }
}

runStressTest()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
