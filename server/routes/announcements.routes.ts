import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET all announcements
router.get('/announcements', asyncHandler(async (req: Request, res: Response) => {
    const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.json(announcements);
}));

// POST create announcement (Admin only)
router.post('/announcements', asyncHandler(async (req: Request, res: Response) => {
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

    // Emit Socket Event
    try {
        const { getIO } = require('../socket');
        getIO().emit('data_updated', { type: 'ANNOUNCEMENT', id: newAnnouncement.id });
    } catch (e) { }

    res.json(newAnnouncement);
}));

// DELETE announcement
router.delete('/announcements/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await prisma.announcement.delete({ where: { id } });

    // Emit Socket Event
    try {
        const { getIO } = require('../socket');
        getIO().emit('data_updated', { type: 'ANNOUNCEMENT', id });
    } catch (e) { }

    res.json({ success: true });
}));

export default router;

