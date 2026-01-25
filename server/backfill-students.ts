import { prisma } from './db';

async function backfillStudents() {
    console.log('--- Iniciando Actualización de Estudiantes Existentes ---');
    try {
        const students = await prisma.student.findMany({
            where: {
                OR: [
                    { representante: null },
                    { representante: '' }
                ]
            }
        });

        console.log(`Encontrados ${students.length} estudiantes para actualizar.`);

        const ciudades = ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay'];
        const apellidosR = ['Pérez', 'González', 'Rodríguez', 'Hernández', 'García', 'Martínez'];
        const nombresR = ['María', 'José', 'Carmen', 'Luis', 'Ana', 'Carlos'];

        for (const student of students) {
            const randomCity = ciudades[Math.floor(Math.random() * ciudades.length)];
            const randomNombreR = nombresR[Math.floor(Math.random() * nombresR.length)];
            const randomApellidoR = apellidosR[Math.floor(Math.random() * apellidosR.length)];

            await prisma.student.update({
                where: { id: student.id },
                data: {
                    lugarNacimiento: student.lugarNacimiento || randomCity,
                    direccion: student.direccion || `Av. Principal de ${randomCity}, Casa #${Math.floor(Math.random() * 100)}`,
                    telefono: student.telefono || `0414-${Math.floor(Math.random() * 9000000) + 1000000}`,
                    representante: student.representante || `${randomNombreR} ${randomApellidoR}`,
                    cedulaR: student.cedulaR || `${Math.floor(Math.random() * 20000000) + 5000000}`,
                    telefonoR: student.telefonoR || `0412-${Math.floor(Math.random() * 9000000) + 1000000}`,
                    emailR: student.emailR || `representante.${student.id}@ejemplo.com`,
                    observaciones: student.observaciones || 'Registro actualizado con datos de prueba.'
                }
            });
            console.log(`> Estudiante actualizado: ${student.nombres} ${student.apellidos}`);
        }

        console.log('✅ Actualización completada con éxito.');

    } catch (e) {
        console.error('Error al actualizar estudiantes:', e);
    }
}

backfillStudents();
