import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'hostname,pid',
            },
        }
        : undefined,
});

// Helper for structured logging
export const logEvent = (level: 'info' | 'warn' | 'error' | 'debug', message: string, details?: any) => {
    const logData = { message, details, timestamp: new Date() };

    switch (level) {
        case 'info':
            logger.info(logData, message);
            break;
        case 'warn':
            logger.warn(logData, message);
            break;
        case 'error':
            logger.error(logData, message);
            break;
        case 'debug':
            logger.debug(logData, message);
            break;
    }
};
