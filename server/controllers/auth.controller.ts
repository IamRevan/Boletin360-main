import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { LoginSchema } from '../schemas';

import { config } from '../config';

const JWT_SECRET = config.JWT_SECRET;

export const login = async (req: Request, res: Response) => {
    // Datos ya validados por middleware
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            // Verificar contraseña con bcrypt
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                // Generar token JWT
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '365d' }
                );

                // Return user info (excluding password)
                const { password: _, ...userWithoutPassword } = user;
                res.json({ ...userWithoutPassword, teacherId: user.teacherId, token });
            } else {
                res.status(401).json({ error: 'Credenciales inválidas' });
            }
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el inicio de sesión' });
    }
};
