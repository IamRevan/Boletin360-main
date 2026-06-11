import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { LoginSchema } from '../schemas';
import { LogService, LogLevel } from '../services/log.service';

import { config } from '../config';
import { logger } from '../logger';

const JWT_SECRET = config.JWT_SECRET;

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: user.role, teacherId: user.teacherId },
                    JWT_SECRET,
                    { expiresIn: '8h' }
                );

                LogService.saveLog(LogLevel.INFO, `User logged in: ${user.email}`, { role: user.role }, user.id)
                    .catch(e => logger.error({ err: e }, 'Failed to log login event'));

                const { password: _, ...userWithoutPassword } = user;
                return res.json({ ...userWithoutPassword, teacherId: user.teacherId, token });
            }
        }

        res.status(401).json({ error: 'Credenciales inválidas' });
    } catch (err) {
        logger.error({ err }, 'Error during login');
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
