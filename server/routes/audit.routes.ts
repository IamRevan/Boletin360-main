import { Router, Response } from 'express';
import { prisma } from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs - Obtener logs de auditoría con filtros
router.get('/audit-logs', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { userId, action, startDate, endDate, limit = '50', offset = '0' } = req.query;

        // Construir filtros dinámicamente
        const where: any = {};

        if (userId) {
            where.userId = Number(userId);
        }

        if (action) {
            where.action = { contains: String(action) };
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(String(startDate));
            }
            if (endDate) {
                where.timestamp.lte = new Date(String(endDate));
            }
        }

        // Obtener logs con paginación
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: Number(limit),
                skip: Number(offset),
            }),
            prisma.auditLog.count({ where }),
        ]);

        // Obtener información de usuarios para mostrar nombres
        const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as number[];
        const users = userIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, nombres: true, apellidos: true }
            })
            : [];

        const userMap = new Map(users.map(u => [u.id, `${u.nombres} ${u.apellidos}`]));

        // Formatear respuesta
        const formattedLogs = logs.map(log => ({
            id: log.id,
            userId: log.userId,
            userName: log.userId ? userMap.get(log.userId) || 'Usuario eliminado' : 'Sistema',
            action: log.action,
            details: log.details,
            timestamp: log.timestamp,
        }));

        res.json({
            logs: formattedLogs,
            total,
            limit: Number(limit),
            offset: Number(offset),
        });
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: 'Error al obtener logs de auditoría' });
    }
});

// GET /api/audit-logs/actions - Obtener lista de acciones únicas para filtro
router.get('/audit-logs/actions', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const actions = await prisma.auditLog.findMany({
            distinct: ['action'],
            select: { action: true },
            orderBy: { action: 'asc' },
        });

        res.json(actions.map(a => a.action));
    } catch (err) {
        console.error('Error fetching audit actions:', err);
        res.status(500).json({ error: 'Error al obtener acciones' });
    }
});

export default router;
