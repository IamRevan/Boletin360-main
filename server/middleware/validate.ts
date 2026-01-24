import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

/**
 * Middleware para validar el cuerpo de la solicitud (req.body) contra un esquema Zod.
 * @param schema Esquema de Zod a validar
 */
export const validate = (schema: ZodType<any>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync(req.body);
        next();
    } catch (error: any) {
        return res.status(400).json({ error: error.issues || 'Validation error' });
    }
};
