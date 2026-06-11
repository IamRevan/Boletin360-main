import { Request, Response } from 'express';
import { prisma } from '../db';
import { getIO } from '../socket';
import { logger } from '../logger';

// --- GRADOS ---
export const createGrado = async (req: Request, res: Response) => {
    try {
        const { nombreGrado, anoEscolarId } = req.body;
        const grado = await prisma.grado.create({
            data: { nombreGrado, anoEscolarId: Number(anoEscolarId) }
        });
        res.json(grado);
    } catch (err) {
        logger.error({ err }, 'Error creating grado');
        res.status(500).json({ error: 'Error al crear el grado' });
    }
};

export const createBatchGrados = async (req: Request, res: Response) => {
    try {
        const { grados } = req.body;
        if (!Array.isArray(grados)) return res.status(400).json({ error: 'Expected array of grados' });

        const created = await prisma.grado.createMany({
            data: grados.map((g: any) => ({
                nombreGrado: g.nombreGrado,
                anoEscolarId: Number(g.anoEscolarId)
            }))
        });
        getIO().emit('data_updated', { type: 'GRADO' });
        res.json({ success: true, count: created.count });
    } catch (err) {
        logger.error({ err }, 'Error creating batch grados');
        res.status(500).json({ error: 'Error al crear los grados' });
    }
};

export const updateGrado = async (req: Request, res: Response) => {
    try {
        const { nombreGrado, anoEscolarId } = req.body;
        const grado = await prisma.grado.update({
            where: { id: Number(req.params.id) },
            data: { nombreGrado, anoEscolarId: Number(anoEscolarId) }
        });
        res.json(grado);
    } catch (err) {
        logger.error({ err }, 'Error updating grado');
        res.status(500).json({ error: 'Error al actualizar el grado' });
    }
};

export const deleteGrado = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.grado.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() }
        });
        getIO().emit('data_updated', { type: 'GRADO', id: Number(id) });
        res.status(204).send();
    } catch (err) {
        logger.error({ err }, 'Error deleting grado');
        res.status(500).json({ error: 'Error al eliminar el grado' });
    }
};

// --- SECCIONES ---
export const createSeccion = async (req: Request, res: Response) => {
    try {
        const { nombreSeccion, idGrado } = req.body;
        const seccion = await prisma.seccion.create({
            data: { nombreSeccion, idGrado: Number(idGrado) }
        });
        res.json(seccion);
    } catch (err) {
        logger.error({ err }, 'Error creating seccion');
        res.status(500).json({ error: 'Error al crear la sección' });
    }
};

export const createBatchSecciones = async (req: Request, res: Response) => {
    try {
        const { secciones } = req.body;
        if (!Array.isArray(secciones)) return res.status(400).json({ error: 'Expected array of secciones' });

        const created = await prisma.seccion.createMany({
            data: secciones.map((s: any) => ({
                nombreSeccion: s.nombreSeccion,
                idGrado: s.idGrado
            }))
        });
        getIO().emit('data_updated', { type: 'SECCION' });
        res.json({ success: true, count: created.count });
    } catch (err) {
        logger.error({ err }, 'Error creating batch secciones');
        res.status(500).json({ error: 'Error al crear las secciones' });
    }
};

export const updateSeccion = async (req: Request, res: Response) => {
    try {
        const { nombreSeccion, idGrado } = req.body;
        const seccion = await prisma.seccion.update({
            where: { id: Number(req.params.id) },
            data: { nombreSeccion, idGrado: Number(idGrado) }
        });
        res.json(seccion);
    } catch (err) {
        logger.error({ err }, 'Error updating seccion');
        res.status(500).json({ error: 'Error al actualizar la sección' });
    }
};

export const deleteSeccion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.seccion.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() }
        });
        getIO().emit('data_updated', { type: 'SECCION', id: Number(id) });
        res.status(204).send();
    } catch (err) {
        logger.error({ err }, 'Error deleting seccion');
        res.status(500).json({ error: 'Error al eliminar la sección' });
    }
};

// --- AÑOS ESCOLARES ---
export const createSchoolYear = async (req: Request, res: Response) => {
    try {
        const ay = await prisma.anosEscolares.create({
            data: { nombre: req.body.nombre }
        });
        res.json(ay);
    } catch (err) {
        logger.error({ err }, 'Error creating school year');
        res.status(500).json({ error: 'Error al crear el año escolar' });
    }
};

export const updateSchoolYear = async (req: Request, res: Response) => {
    try {
        const ay = await prisma.anosEscolares.update({
            where: { id: Number(req.params.id) },
            data: { nombre: req.body.nombre }
        });
        res.json(ay);
    } catch (err) {
        logger.error({ err }, 'Error updating school year');
        res.status(500).json({ error: 'Error al actualizar el año escolar' });
    }
};

export const deleteSchoolYear = async (req: Request, res: Response) => {
    try {
        await prisma.anosEscolares.update({
            where: { id: Number(req.params.id) },
            data: { deletedAt: new Date() }
        });
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, 'Error deleting school year');
        res.status(500).json({ error: 'Error al eliminar el año escolar' });
    }
};
