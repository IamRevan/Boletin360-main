import { prisma } from '../db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // 1. Ensure Admin User
  const email = 'admin@boletin360.com';
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    console.log(`Creating user: ${email}`);
    const hashedPassword = await bcrypt.hash('password', 10);
    await prisma.user.create({
        data: {
            nombres: 'Admin',
            apellidos: 'Principal',
            email,
            password: hashedPassword,
            role: 'Admin'
        }
    });
  } else {
    console.log(`User ${email} already exists.`);
  }

  // 2. Ensure basic academic data
  // Grados
  const grados = ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'];
  for (const g of grados) {
      // Upsert logic for simple name check if needed, but for now just skip if table has data or use findFirst
      const exists = await prisma.grado.findFirst({ where: { nombreGrado: g } });
      if (!exists) {
          await prisma.grado.create({ data: { nombreGrado: g } });
      }
  }

  // Secciones
  const secciones = ['A', 'B', 'C'];
  for (const s of secciones) {
      const exists = await prisma.seccion.findFirst({ where: { nombreSeccion: s } });
      if (!exists) {
          await prisma.seccion.create({ data: { nombreSeccion: s } });
      }
  }

  // Years
  const years = ['2023-2024', '2024-2025'];
  for (const y of years) {
      const exists = await prisma.anosEscolares.findFirst({ where: { nombre: y } });
      if (!exists) {
          await prisma.anosEscolares.create({ data: { nombre: y } });
      }
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
