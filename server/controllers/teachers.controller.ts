import { Request, Response } from 'express';
import { prisma } from '../db';
import { TeacherSchema } from '../schemas';

export const createTeacher = async (req: Request, res: Response) => {
    const validation = TeacherSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nacionalidad, cedula, nombres, apellidos, email, status } = validation.data;

    const teacher = await prisma.teacher.create({
        data: { nacionalidad, cedula, nombres, apellidos, email, status: status as any }
    });
    res.json(teacher);
};

export const updateTeacher = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nacionalidad, cedula, nombres, apellidos, email, status } = req.body;

    const teacher = await prisma.teacher.update({
        where: { id: Number(id) },
        data: { nacionalidad, cedula, nombres, apellidos, email, status }
    });
    res.json(teacher);
};

export const deleteTeacher = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.teacher.delete({ where: { id: Number(id) } });
    res.json({ success: true });
};
