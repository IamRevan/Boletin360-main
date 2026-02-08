import { prisma } from './db';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    console.log('Resetting Admin password...');

    const email = 'admin@boletin360.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                nombres: 'Admin',
                apellidos: 'Principal'
            },
            create: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
                nombres: 'Admin',
                apellidos: 'Principal'
            }
        });

        console.log(`✅ Admin user '${email}' updated/created successfully.`);
        console.log(`🔑 Password reset to: '${password}'`);
    } catch (error) {
        console.error('❌ Error resetting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
