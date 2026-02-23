import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { LogService, LogLevel } from '../services/log.service';

interface OperationalError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    userId?: number;
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
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Log error using pino (raw error to console/PM2 logs)
    logger.error({
        method: req.method,
        path: req.path,
        statusCode,
        isOperational,
        error: err.message,
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query
    }, `Error in ${req.method} ${req.path}`);

    // Persist error to system logs database
    LogService.saveLog(
        LogLevel.ERROR,
        `HTTP Error: ${err.message}`,
        {
            path: req.path,
            method: req.method,
            isOperational,
            stack: err.stack
        },
        err.userId
    ).catch(e => logger.error({ error: e }, 'Failed to persist error log'));

    // Determine user-facing message
    const message = isOperational ? err.message : 'Error interno del servidor';

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            originalError: err.message
        })
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
