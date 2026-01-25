import { prisma } from './db';

async function verifyHistory() {
    console.log('--- Verificación de Historial Académico ---');

    try {
        // 1. Crear un estudiante en 1er Año (2023-2024)
        console.log('1. Creando estudiante de prueba...');
        const newStudent = await prisma.student.create({
            data: {
                nacionalidad: 'V',
                cedula: 'TEST-' + Date.now(),
                nombres: 'Estudiante',
                apellidos: 'Prueba Historia',
                email: 'test-history@demo.com',
                genero: 'M',
                idGrado: 1, // 1er Año
                idSeccion: 1 // A
            }
        });
        console.log(`   Estudiante creado: ID ${newStudent.id}`);

        // 2. Agregar notas en 2023-2024 (ID 1)
        console.log('2. Agregando notas del Año 1...');
        const materiaMatematicaId = 1; // Suponiendo ID 1, ajustar si es necesario
        // Verificar existencias
        const ano1 = await prisma.anosEscolares.findFirst({ where: { nombre: '2023-2024' } });
        if (!ano1) throw new Error('Año 2023-2024 no encontrado');

        await prisma.calificacion.create({
            data: {
                studentId: newStudent.id,
                materiaId: materiaMatematicaId,
                anoEscolarId: ano1.id,
                lapso1: [{ nombre: 'Examen 1', nota: 18, ponderacion: 20 }]
            }
        });
        console.log('   Notas del Año 1 agregadas.');

        // 3. Promover estudiante a 2do Año
        console.log('3. Promoviendo estudiante a 2do Año...');
        await prisma.student.update({
            where: { id: newStudent.id },
            data: { idGrado: 2 } // 2do Año
        });
        console.log('   Estudiante promovido.');

        // 4. Agregar notas en 2024-2025 (Año 2)
        console.log('4. Agregando notas del Año 2...');
        const ano2 = await prisma.anosEscolares.findFirst({ where: { nombre: '2024-2025' } });
        if (!ano2) throw new Error('Año 2024-2025 no encontrado');

        await prisma.calificacion.create({
            data: {
                studentId: newStudent.id,
                materiaId: materiaMatematicaId, // Misma materia pero nuevo año
                anoEscolarId: ano2.id,
                lapso1: [{ nombre: 'Examen Año 2', nota: 20, ponderacion: 20 }]
            }
        });
        console.log('   Notas del Año 2 agregadas.');

        // 5. Verificar consulta de historial
        console.log('5. Verificando historial completo...');
        const history = await prisma.calificacion.findMany({
            where: { studentId: newStudent.id }
        });

        // Since we didn't add relations to schema.prisma yet (or did we? No, avoiding deep schema edits), 
        // we check raw IDs.
        console.log('   Registros de calificaciones encontrados:', history.length);

        const hasYear1 = history.some(h => h.anoEscolarId === ano1.id);
        const hasYear2 = history.some(h => h.anoEscolarId === ano2.id);

        if (hasYear1 && hasYear2) {
            console.log('✅ ÉXITO: Se mantienen las notas de ambos años escolares.');
        } else {
            console.error('❌ FALLO: Faltan registros de algún año.', { hasYear1, hasYear2 });
        }

        // Cleanup
        await prisma.calificacion.deleteMany({ where: { studentId: newStudent.id } });
        await prisma.student.delete({ where: { id: newStudent.id } });
        console.log('   Datos de prueba limpiados.');

    } catch (e) {
        console.error('Error en verificación:', e);
    }
}

verifyHistory();
