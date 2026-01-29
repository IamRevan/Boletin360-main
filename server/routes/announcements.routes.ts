import { Router } from 'express';
import { prisma } from '../db';
import { z } from 'zod';

const router = Router();

// GET all announcements
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch announcements" });
    }
});

// POST create announcement (Admin only)
router.post('/announcements', async (req, res) => {
    // Assuming simple check or relying on frontend for now. 
    // In strict impl, check req.user.role === 'Admin'
    try {
        const schema = z.object({
            title: z.string().min(1),
            content: z.string().min(1),
            type: z.enum(['info', 'warning', 'success']).default('info'),
            createdBy: z.number()
        });

        const data = schema.parse(req.body);

        const newAnnouncement = await prisma.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                createdBy: data.createdBy
            }
        });

        // OPTIONAL: Also create notifications for all users? 
        // For now, announcements are global, notifications are personal.

        res.json(newAnnouncement);
    } catch (error) {
        res.status(400).json({ error: "Invalid data" });
    }
});

// DELETE announcement
router.delete('/announcements/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.announcement.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

export default router;
