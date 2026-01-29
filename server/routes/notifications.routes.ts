import { Router } from 'express';
import { prisma } from '../db';
import { z } from 'zod';

const router = Router();

// Middleware to get userId from headers (assuming auth middleware sets it or we pass it)
// For query param simplicity in this codebase context:
// const userId = parseInt(req.query.userId as string);

// GET user notifications
router.get('/notifications', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId as string);
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// PUT mark as read
router.put('/notifications/:id/read', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update" });
    }
});

// PUT mark all as read
router.put('/notifications/read-all', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update all" });
    }
});

// DELETE notification
router.delete('/notifications/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.notification.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

export default router;
