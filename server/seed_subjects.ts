import { query } from './db';

const SUBJECTS_COMMON = [
    'Castellano',
    'Inglés',
    'Matemática',
    'Educación Física',
    'Arte y Patrimonio',
    'Geografía, Historia y Ciudadanía',
    'Ciencias Naturales'
];

const SUBJECTS_DIVERSIFIED = [
    'Castellano',
    'Inglés',
    'Matemática',
    'Educación Física',
    'Física',
    'Química',
    'Biología',
    'Geografía, Historia y Ciudadanía',
    'Instrucción Premilitar' // Often included
];

const seedSubjects = async () => {
    try {
        console.log('Iniciando siembra de materias...');

        // Obtener grados
        const gradosRes = await query('SELECT * FROM grados');
        const grados = gradosRes.rows;

        for (const grado of grados) {
            console.log(`Procesando grado: ${grado.nombre_grado}`);
            const nombre = grado.nombre_grado.toLowerCase();

            let subjectsToInsert: string[] = [];

            if (nombre.includes('1er') || nombre.includes('2do') || nombre.includes('3er')) {
                subjectsToInsert = SUBJECTS_COMMON;
            } else if (nombre.includes('4to') || nombre.includes('5to')) {
                subjectsToInsert = SUBJECTS_DIVERSIFIED;
            }

            for (const subjectName of subjectsToInsert) {
                // Verificar si existe para no duplicar (simple check)
                const check = await query(
                    'SELECT id FROM materias WHERE nombre_materia = $1 AND id_grado = $2',
                    [subjectName, grado.id_grado]
                );

                if (check.rows.length === 0) {
                    await query(
                        'INSERT INTO materias (nombre_materia, id_grado) VALUES ($1, $2)',
                        [subjectName, grado.id_grado]
                    );
                    console.log(`  + Insertada: ${subjectName}`);
                } else {
                    console.log(`  . Ya existe: ${subjectName}`);
                }
            }
        }
        console.log('Siembra de materias finalizada.');
        process.exit(0);
    } catch (error) {
        console.error('Error sembrando materias:', error);
        process.exit(1);
    }
};

seedSubjects();
