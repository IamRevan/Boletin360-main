import { query } from '../db';

export const logAction = async (userId: number, action: string, details: string) => {
    try {
        await query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, action, details]
        );
    } catch (err) {
        console.error('Failed to log action:', err);
    }
};
