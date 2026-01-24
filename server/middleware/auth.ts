import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config';

// Clave secreta obtenida de configuración validada
const JWT_SECRET = config.JWT_SECRET;

// Extensión de la interfaz Request de Express para incluir el usuario decodificado.
export interface AuthRequest extends Request {
    user?: any;
}

/**
 * Middleware para autenticar el token JWT.
 * Verifica si el token es válido y adjunta la información del usuario a la solicitud.
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer <token>

    if (!token) {
        return res.sendStatus(401); // No autorizado (Token no presente)
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.sendStatus(403); // Prohibido (Token inválido o expirado)
        }
        req.user = user;
        next();
    });
};

/**
 * Middleware para autorizar acceso basado en roles.
 * @param allowedRoles Lista de roles permitidos para acceder a la ruta.
 */
export const authorizeRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.sendStatus(401); // No autenticado
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.sendStatus(403); // Rol no autorizado
        }
        next();
    };
};
