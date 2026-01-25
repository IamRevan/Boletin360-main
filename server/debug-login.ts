import { prisma } from './db';
import bcrypt from 'bcryptjs';

async function debugLogin() {
    console.log('--- DIAGNÓSTICO DE LOGIN ---');

    // 1. Listar Usuarios
    console.log('\n1. Consultando usuarios en la base de datos...');
    const users = await prisma.user.findMany();
    console.log(`Encontrados ${users.length} usuarios.`);

    users.forEach(u => {
        console.log(` - ID: ${u.id} | Email: ${u.email} | Rol: ${u.role} | Password (Hash): ${u.password.substring(0, 10)}...`);
    });

    const targetEmail = 'admin@boletin360.com';
    const targetPass = 'password';

    // 2. Probar Login Específico
    console.log(`\n2. Probando credenciales: ${targetEmail} / ${targetPass}`);

    const user = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (!user) {
        console.error('❌ ERROR: Usuario no encontrado en DB con ese email.');
        return;
    }
    console.log('✅ Usuario encontrado.');

    const isValid = await bcrypt.compare(targetPass, user.password);

    if (isValid) {
        console.log('✅ PASSWORD CORRECTO. El backend valida bien la contraseña.');
    } else {
        console.error('❌ PASSWORD INCORRECTO. El hash no coincide.');
        console.log('Re-hash de prueba:', await bcrypt.hash(targetPass, 10));
    }
}

debugLogin();
