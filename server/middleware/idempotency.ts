import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { logger } from '../logger';

/**
 * Middleware to handle idempotent requests using the Idempotency-Key header.
 * It stores the response of a successful request and returns it if the same key is used again.
 */
export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string;

    if (!key) {
        return next();
    }

    // Only apply to POST, PUT, DELETE
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return next();
    }

    try {
        const existingRecord = await (prisma as any).idempotencyKey.findUnique({
            where: { key }
        });

        if (existingRecord) {
            logger.info({ key }, `Idempotent request detected. Returning cached response.`);
            return res.status(existingRecord.responseStatus).json(JSON.parse(existingRecord.responseBody));
        }

        // Intercept res.json to store the result
        const originalJson = res.json;
        res.json = function (body: any) {
            // Restore original json function
            res.json = originalJson;

            // Save the response for future retries
            // We only save successful or operational error responses (2xx, 4xx)
            if (res.statusCode >= 200 && res.statusCode < 500) {
                (prisma as any).idempotencyKey.create({
                    data: {
                        key,
                        responseStatus: res.statusCode,
                        responseBody: JSON.stringify(body)
                    }
                }).catch((err: any) => logger.error({ err, key }, 'Failed to save idempotency record'));
            }

            return originalJson.call(this, body);
        };

        next();
    } catch (error) {
        logger.error({ error, key }, 'Error in idempotency middleware');
        next();
    }
};
