
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Students in DB...');
    const students = await prisma.student.findMany();
    console.log(`Total Students Found: ${students.length}`);

    if (students.length > 0) {
        console.log('Last 5 students:');
        const lastStudents = students.slice(-5);
        lastStudents.forEach(s => {
            console.log(`ID: ${s.id}, Name: ${s.nombres} ${s.apellidos}, Status: ${s.status}, Grade: ${s.idGrado}, DeletedAt: ${s.deletedAt}`);
        });
    } else {
        console.log('No students found.');
    }

    console.log('\nVerifying Grados...');
    const grados = await prisma.grado.findMany();
    grados.forEach(g => console.log(`ID: ${g.id}, Name: ${g.nombreGrado}`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
