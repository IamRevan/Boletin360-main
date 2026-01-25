import { prisma } from './db';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    console.log('--- Reseteando Usuario Admin ---');

    const email = 'admin@boletin360.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Buscar si existe
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            console.log('Usuario encontrado. Actualizando contraseña...');
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
        } else {
            console.log('Usuario no encontrado. Creando nuevo admin...');
            await prisma.user.create({
                data: {
                    nombres: 'Admin',
                    apellidos: 'Principal',
                    email,
                    password: hashedPassword,
                    role: 'Admin'
                }
            });
        }

        console.log(`✅ Admin restaurado: ${email} / ${password}`);

    } catch (e) {
        console.error('Error al resetear admin:', e);
    }
}

resetAdmin();
