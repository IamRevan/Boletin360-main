"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Clave secreta para firmar los tokens JWT. Debe coincidir con la variable de entorno o usar un valor por defecto (INSEGURO PARA PRODUCCIÓN).
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
/**
 * Middleware para autenticar el token JWT.
 * Verifica si el token es válido y adjunta la información del usuario a la solicitud.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer <token>
    if (!token) {
        return res.sendStatus(401); // No autorizado (Token no presente)
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Prohibido (Token inválido o expirado)
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware para autorizar acceso basado en roles.
 * @param allowedRoles Lista de roles permitidos para acceder a la ruta.
 */
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.sendStatus(401); // No autenticado
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.sendStatus(403); // Rol no autorizado
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
