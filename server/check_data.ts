import { query } from './db';

const checkData = async () => {
    try {
        console.log('--- Años Escolares ---');
        const years = await query('SELECT * FROM anos_escolares');
        console.table(years.rows);

        console.log('\n--- Estudiante Ana ---');
        const student = await query("SELECT id, nombres, apellidos, id_grado, id_seccion FROM students WHERE nombres = 'Ana'");
        console.table(student.rows);

        if (student.rows.length > 0) {
            const sId = student.rows[0].id;
            console.log(`\n--- Calificaciones de Ana (ID: ${sId}) ---`);
            const grades = await query('SELECT materia_id, ano_escolar_id, lapso1 FROM calificaciones WHERE student_id = $1', [sId]);
            console.table(grades.rows.map(r => ({ ...r, lapso1: JSON.stringify(r.lapso1).substring(0, 50) + '...' })));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
