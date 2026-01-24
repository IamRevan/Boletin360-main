import { Request, Response } from 'express';
import { prisma } from '../db';

export const createMateria = async (req: Request, res: Response) => {
    const { nombre_materia, id_docente, id_grado, id_seccion } = req.body;
    try {
        const materia = await prisma.materia.create({
            data: {
                nombreMateria: nombre_materia,
                idDocente: id_docente,
                idGrado: id_grado,
                idSeccion: id_seccion
            }
        });
        res.json(materia);
    } catch (err) { res.status(500).json({ error: 'Error al crear materia' }); }
};

export const updateMateria = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre_materia, id_docente, id_grado, id_seccion } = req.body;
    try {
        const materia = await prisma.materia.update({
            where: { id: Number(id) },
            data: {
                nombreMateria: nombre_materia,
                idDocente: id_docente,
                idGrado: id_grado,
                idSeccion: id_seccion
            }
        });
        res.json(materia);
    } catch (err) { res.status(500).json({ error: 'Error al actualizar materia' }); }
};

export const deleteMateria = async (req: Request, res: Response) => {
    try {
        await prisma.materia.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar materia' }); }
};
