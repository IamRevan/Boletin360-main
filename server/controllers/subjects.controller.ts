import { Request, Response } from 'express';
import { prisma } from '../db';

export const createMateria = async (req: Request, res: Response) => {
    const { nombreMateria, idDocente, idGrado, idSeccion } = req.body;
    const materia = await prisma.materia.create({
        data: {
            nombreMateria,
            idDocente,
            idGrado,
            idSeccion
        } as any
    });
    res.json(materia);
};

export const updateMateria = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombreMateria, idDocente, idGrado, idSeccion } = req.body;
    const materia = await prisma.materia.update({
        where: { id: Number(id) },
        data: {
            nombreMateria,
            idDocente,
            idGrado,
            idSeccion
        } as any
    });
    res.json(materia);
};

export const deleteMateria = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.materia.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() } as any
    });
    res.json({ success: true });
};
