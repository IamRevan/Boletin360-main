import { prisma } from '../db';

export const logAction = async (userId: number, action: string, details: string) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details
            }
        });
    } catch (err) {
        console.error('Failed to log action:', err);
    }
};
