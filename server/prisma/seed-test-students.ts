import { prisma } from '../db';

const firstNames = ['Carlos', 'Maria', 'Jose', 'Ana', 'Luis', 'Diana', 'Pedro', 'Sofia', 'Miguel', 'Laura',
    'Andres', 'Valentina', 'Diego', 'Camila', 'Jorge', 'Isabella', 'Ricardo', 'Gabriela', 'Fernando', 'Paula'];

const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Hernandez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
    'Flores', 'Rivera', 'Morales', 'Castillo', 'Reyes', 'Ortiz', 'Gutierrez', 'Chavez', 'Romero', 'Moreno'];

async function main() {
    console.log('Sembrando estudiantes de prueba...');

    const grados = await prisma.grado.findMany({ where: { deletedAt: null } });
    const secciones = await prisma.seccion.findMany({ where: { deletedAt: null } });

    if (grados.length === 0 || secciones.length === 0) {
        console.error('Primero ejecuta el seed principal para crear grados y secciones.');
        process.exit(1);
    }

    let createdCount = 0;

    for (let i = 0; i < 20; i++) {
        const cedula = String(30000000 + i);
        const existing = await prisma.student.findUnique({ where: { cedula } });
        if (existing) {
            console.log(`  Estudiante con cédula ${cedula} ya existe, saltando.`);
            continue;
        }

        const grado = grados[i % grados.length];
        const seccionesGrado = secciones.filter(s => s.idGrado === grado.id || s.idGrado === null);
        const seccion = seccionesGrado.length > 0 ? seccionesGrado[i % seccionesGrado.length] : secciones[i % secciones.length];

        const genero = i % 2 === 0 ? 'M' : 'F';
        const nacionalidad = i < 18 ? 'V' : 'E';

        await prisma.student.create({
            data: {
                nacionalidad,
                cedula,
                nombres: firstNames[i],
                apellidos: lastNames[i],
                genero,
                idGrado: grado.id,
                idSeccion: seccion.id,
                status: 'ACTIVO',
                email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@correo.com`,
                fechaNacimiento: new Date(2005 + (i % 5), i % 12, (i % 28) + 1),
                lugarNacimiento: 'Caracas',
                direccion: `Calle ${i + 1}, Casa N° ${100 + i}`,
                telefono: `0412-${String(1000000 + i).slice(1)}`,
                representante: `Representante de ${firstNames[i]}`,
                cedulaR: String(10000000 + i),
                telefonoR: `0416-${String(2000000 + i).slice(1)}`,
            }
        });

        console.log(`  Creado: ${firstNames[i]} ${lastNames[i]} (C.I: ${nacionalidad}-${cedula}) -> ${grado.nombreGrado} - Sección ${seccion.nombreSeccion}`);
        createdCount++;
    }

    console.log(`\n✅ ${createdCount} estudiantes de prueba creados exitosamente.`);

    const total = await prisma.student.count({ where: { deletedAt: null } });
    console.log(`Total de estudiantes activos: ${total}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
