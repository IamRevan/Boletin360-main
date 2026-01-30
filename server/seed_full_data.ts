import { query } from './db';
import bcrypt from 'bcryptjs';

const SUBJECTS_COMMON = [
    'Castellano', 'Inglés', 'Matemática', 'Educación Física',
    'Arte y Patrimonio', 'Geografía, Historia y Ciudadanía', 'Ciencias Naturales'
];

const SUBJECTS_DIVERSIFIED = [
    'Castellano', 'Inglés', 'Matemática', 'Educación Física',
    'Física', 'Química', 'Biología',
    'Geografía, Historia y Ciudadanía', 'Instrucción Premilitar'
];

const seedFullData = async () => {
    try {
        console.log('Iniciando siembra completa de datos...');

        // 1. Asegurar Años Escolares
        console.log('- Verificando Años Escolares...');
        const yearRes = await query("SELECT id FROM anos_escolares WHERE nombre = '2023-2024'");
        let currentYearId = yearRes.rows[0]?.id;
        if (!currentYearId) {
            const insertYear = await query("INSERT INTO anos_escolares(nombre) VALUES('2023-2024') RETURNING id");
            currentYearId = insertYear.rows[0].id;
        }

        // 2. Obtener Grados y Secciones
        const grados = (await query('SELECT * FROM grados')).rows;
        const secciones = (await query('SELECT * FROM secciones')).rows;

        // 3. Crear Materias para CADA Sección
        console.log('- Asignando materias a secciones...');
        for (const grado of grados) {
            const nombreGrado = grado.nombre_grado.toLowerCase();
            let subjectsList = (nombreGrado.includes('4to') || nombreGrado.includes('5to')) ? SUBJECTS_DIVERSIFIED : SUBJECTS_COMMON;

            for (const seccion of secciones) {
                for (const subjName of subjectsList) {
                    // Verificar si existe la materia para este grado Y sección
                    const check = await query(
                        'SELECT id FROM materias WHERE nombre_materia = $1 AND id_grado = $2 AND id_seccion = $3',
                        [subjName, grado.id_grado, seccion.id_seccion]
                    );

                    if (check.rows.length === 0) {
                        await query(
                            'INSERT INTO materias (nombre_materia, id_grado, id_seccion) VALUES ($1, $2, $3)',
                            [subjName, grado.id_grado, seccion.id_seccion]
                        );
                    }
                }
            }
        }

        // 4. Crear Estudiantes de Prueba
        console.log('- Creando estudiantes de prueba...');
        const testStudents = [
            { n: 'Ana', a: 'Pérez', c: '30111222', g: '1er Año', s: 'A' },
            { n: 'Carlos', a: 'Gómez', c: '31222333', g: '2do Año', s: 'B' },
            { n: 'María', a: 'Rodríguez', c: '32333444', g: '4to Año', s: 'A' },
            { n: 'Pedro', a: 'López', c: '33444555', g: '5to Año', s: 'C' }
        ];

        for (const ts of testStudents) {
            const gradeId = grados.find(g => g.nombre_grado === ts.g)?.id_grado;
            const sectionId = secciones.find(s => s.nombre_seccion === ts.s)?.id_seccion;

            if (!gradeId || !sectionId) continue;

            // Verificar existencia
            const checkStudent = await query('SELECT id FROM students WHERE cedula = $1', [ts.c]);
            let studentId;

            if (checkStudent.rows.length === 0) {
                const insert = await query(
                    `INSERT INTO students 
                    (nacionalidad, cedula, nombres, apellidos, email, genero, fecha_nacimiento, id_grado, id_seccion, status) 
                    VALUES ('V', $1, $2, $3, $4, 'F', '2010-01-01', $5, $6, 'ACTIVO') RETURNING id`,
                    [ts.c, ts.n, ts.a, `test_${ts.c}@boletin360.com`, gradeId, sectionId]
                );
                studentId = insert.rows[0].id;
                console.log(`  + Estudiante creado: ${ts.n} ${ts.a}`);
            } else {
                studentId = checkStudent.rows[0].id;
            }

            // 5. Asignar Notas Aleatorias para TODOS los años escolares
            console.log(`  - Asignando notas a ${ts.n}...`);
            // Buscar materias de su grado y sección
            const materias = await query(
                'SELECT id FROM materias WHERE id_grado = $1 AND id_seccion = $2',
                [gradeId, sectionId]
            );

            // Obtener todos los años
            const allYears = await query('SELECT id FROM anos_escolares');

            for (const year of allYears.rows) {
                for (const materia of materias.rows) {
                    // Generar notas aleatorías 10-20
                    const lapso1 = [{ descripcion: 'Examen', ponderacion: 20, nota: Math.floor(Math.random() * 11) + 10 }];
                    const lapso2 = [{ descripcion: 'Examen', ponderacion: 20, nota: Math.floor(Math.random() * 11) + 10 }];
                    const lapso3 = [{ descripcion: 'Examen', ponderacion: 20, nota: Math.floor(Math.random() * 11) + 10 }];

                    // Upsert calificaciones
                    await query(
                        `INSERT INTO calificaciones (student_id, materia_id, ano_escolar_id, lapso1, lapso2, lapso3)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (student_id, materia_id, ano_escolar_id) 
                         DO UPDATE SET lapso1 = $4, lapso2 = $5, lapso3 = $6`,
                        [studentId, materia.id, year.id, JSON.stringify(lapso1), JSON.stringify(lapso2), JSON.stringify(lapso3)]
                    );
                }
            }
        }

        console.log('Siembra completa finalizada.');
        process.exit(0);

    } catch (error) {
        console.error('Error en seed_full_data:', error);
        process.exit(1);
    }
};

seedFullData();
