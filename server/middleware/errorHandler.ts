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
    // Log error for debugging with more context
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${req.method} ${req.path}`);

    if (process.env.NODE_ENV === 'development') {
        if (Object.keys(req.body).length > 0) {
            console.error('Request Body:', JSON.stringify(req.body, null, 2));
        }
        if (Object.keys(req.params).length > 0) {
            console.error('Request Params:', req.params);
        }
        console.error('Error Message:', err.message);
        console.error('Stack Trace:', err.stack);
    } else {
        console.error(`Error: ${err.message}`);
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
