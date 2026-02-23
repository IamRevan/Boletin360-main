import { prisma } from '../db';
import { logger } from '../logger';

export enum LogLevel {
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    ERROR = 'ERROR',
    WARN = 'WARN',
}

export class LogService {
    static async saveLog(level: LogLevel, message: string, details?: any, userId?: number) {
        try {
            // In a real "separate database" scenario, we'd use a different prisma client or sqlite.
            // For now, we use the SystemLog table in the main DB to ensure it works across the docker setup.
            await (prisma as any).systemLog.create({
                data: {
                    level,
                    message,
                    details: details ? JSON.stringify(details) : null,
                    userId,
                },
            });
        } catch (error) {
            // Fallback to console if DB logging fails to avoid losing the message
            logger.error({ error }, 'Failed to save log to database');
        }
    }
}
