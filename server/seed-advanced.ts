import { prisma } from './db';

async function seedAdvanced() {
    console.log('--- Iniciando Seed Masivo (20+ Estudiantes) ---');

    try {
        // Asegurar Años, Grados y Materias existen
        // NOTA: Usamos los nombres en singular definidos en schema.prisma (grado, seccion, etc.)
        const grado1 = await prisma.grado.findFirst({ where: { nombreGrado: '1er Año' } });
        const seccionA = await prisma.seccion.findFirst({ where: { nombreSeccion: 'A' } });
        const anoCurrent = await prisma.anosEscolares.findFirst({ where: { nombre: '2024-2025' } });
        const anoPast = await prisma.anosEscolares.findFirst({ where: { nombre: '2023-2024' } });

        if (!grado1 || !seccionA || !anoCurrent || !anoPast) {
            console.error('Faltan datos base (Años, Grados o Secciones). Corra el seed básico primero.');
            return;
        }

        // Obtener materias usando la relación o query manual si la relación idGrado es nullable
        const materias = await prisma.materia.findMany({ where: { idGrado: grado1.id } });
        if (materias.length === 0) {
            console.error('No hay materias registradas para 1er Año.');
            return;
        }

        // Generar 20 estudiantes aleatorios
        const nombres = ['Luis', 'Maria', 'Jose', 'Ana', 'Carlos', 'Elena', 'Miguel', 'Sofia', 'David', 'Laura', 'Gabriel', 'Valentina', 'Samuel', 'Isabella', 'Andres', 'Camila', 'Daniel', 'Victoria', 'Diego', 'Lucia'];
        const apellidos = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Reyes', 'Morales', 'Cruz', 'Ortiz', 'Castillo', 'Chavez'];

        console.log(`Generando 20 estudiantes aleatorios...`);

        for (let i = 0; i < 20; i++) {
            const randN = nombres[Math.floor(Math.random() * nombres.length)];
            const randA = apellidos[Math.floor(Math.random() * apellidos.length)];
            // Cédula única basada en random + offset
            const cedula = (30000000 + Math.floor(Math.random() * 9000000) + i).toString();

            // Verificar existencia por cédula para no duplicar
            const existing = await prisma.student.findUnique({ where: { cedula } });
            if (existing) continue;

            console.log(`Creando estudiante ${i + 1}/20: ${randN} ${randA} (V-${cedula})`);

            const student = await prisma.student.create({
                data: {
                    nombres: randN,
                    apellidos: randA,
                    cedula: cedula,
                    genero: Math.random() > 0.5 ? 'M' : 'F',
                    nacionalidad: 'V',
                    email: `estudiante.${cedula}@boletin360.com`,
                    fechaNacimiento: new Date(2010 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1),
                    status: 'ACTIVO',
                    idGrado: grado1.id,
                    idSeccion: seccionA.id,
                    lugarNacimiento: 'Caracas',
                    direccion: `Dirección de prueba ${i}, Calle ${Math.floor(Math.random() * 10)}`,
                    telefono: `0412-${Math.floor(Math.random() * 9000000) + 1000000}`,
                    representante: `Rep. ${randN} ${randA}`,
                    cedulaR: (Number(cedula) - 20000000).toString(),
                    emailR: `rep.${cedula}@boletin360.com`,
                    telefonoR: '0414-0000000',
                    observaciones: 'Generado masivamente por script'
                }
            });

            // Note: Calificacion structure changed - now uses Evaluation table
            // Seed script needs updating to create Evaluations separately
            // Skipping grade creation for now - TODO: Update seed to use new schema
            console.log(`Skipping grade creation for student ${student.id} - seed needs schema update`);

            // TODO: Create Calificacion records and then Evaluation records
            // Example:
            // const cal = await prisma.calificacion.create({
            //   data: { studentId: student.id, materiaId: materia.id, anoEscolarId: anoPast.id }
            // });
            // await prisma.evaluation.create({
            //   data: { calificacionId: cal.id, lapso: 1, descripcion: 'Auto', nota: 15, ponderacion: 20 }
            // });
        }

        console.log('✅ Seed Masivo completado.');

    } catch (e) {
        console.error('Error en seed:', e);
    }
}

seedAdvanced();
