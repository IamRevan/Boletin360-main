import { Request, Response, NextFunction } from 'express';

interface OperationalError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

/**
 * Centralized error handler middleware.
 * Catches all errors and returns consistent JSON responses.
 */
export const errorHandler = (
    err: OperationalError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error for debugging
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}:`, err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Default error values
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Error interno del servidor';

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Async handler wrapper to catch errors in async route handlers.
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom operational error class.
 * Use for expected errors that should be shown to users.
 */
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
