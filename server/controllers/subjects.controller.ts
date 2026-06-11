import { Request, Response } from 'express';
import { prisma } from '../db';
import { logger } from '../logger';

export const createMateria = async (req: Request, res: Response) => {
    try {
        const { nombreMateria, idDocente, idGrado, idSeccion } = req.body;
        const materia = await prisma.materia.create({
            data: {
                nombreMateria,
                idDocente: idDocente ? Number(idDocente) : null,
                idGrado: idGrado ? Number(idGrado) : null,
                idSeccion: idSeccion ? Number(idSeccion) : null
            }
        });
        res.json(materia);
    } catch (err) {
        logger.error({ err }, 'Error creating materia');
        res.status(500).json({ error: 'Error al crear la materia' });
    }
};

export const updateMateria = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombreMateria, idDocente, idGrado, idSeccion } = req.body;
        const materia = await prisma.materia.update({
            where: { id: Number(id) },
            data: {
                nombreMateria,
                idDocente: idDocente ? Number(idDocente) : null,
                idGrado: idGrado ? Number(idGrado) : null,
                idSeccion: idSeccion ? Number(idSeccion) : null
            }
        });
        res.json(materia);
    } catch (err) {
        logger.error({ err }, 'Error updating materia');
        res.status(500).json({ error: 'Error al actualizar la materia' });
    }
};

export const deleteMateria = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.materia.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() }
        });
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, 'Error deleting materia');
        res.status(500).json({ error: 'Error al eliminar la materia' });
    }
};
