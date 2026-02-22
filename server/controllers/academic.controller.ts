import { Request, Response } from 'express';
import { prisma } from '../db';
import { getIO } from '../socket';

// --- GRADOS ---
export const createGrado = async (req: Request, res: Response) => {
    const { nombreGrado, anoEscolarId } = req.body;
    const grado = await prisma.grado.create({
        data: {
            nombreGrado,
            anoEscolarId
        } as any
    });
    res.json(grado);
};

export const createBatchGrados = async (req: Request, res: Response) => {
    const { grados } = req.body; // Expecting array of { nombreGrado, anoEscolarId }
    if (!Array.isArray(grados)) return res.status(400).json({ error: 'Expected array of grados' });

    const created = await prisma.grado.createMany({
        data: grados.map((g: any) => ({
            nombreGrado: g.nombreGrado,
            anoEscolarId: g.anoEscolarId
        }))
    }) as any;
    getIO().emit('data_updated', { type: 'GRADO' });
    res.json({ success: true, count: created.count });
};

export const updateGrado = async (req: Request, res: Response) => {
    const { nombreGrado, anoEscolarId } = req.body;
    const grado = await prisma.grado.update({
        where: { id: Number(req.params.id) },
        data: {
            nombreGrado,
            anoEscolarId
        } as any
    });
    res.json(grado);
};

export const deleteGrado = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.grado.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() } as any
    });
    getIO().emit('data_updated', { type: 'GRADO', id: Number(id) });
    res.status(204).send();
};

// --- SECCIONES ---
export const createSeccion = async (req: Request, res: Response) => {
    const { nombreSeccion, idGrado } = req.body;
    const seccion = await prisma.seccion.create({
        data: {
            nombreSeccion,
            idGrado
        } as any
    });
    res.json(seccion);
};

export const createBatchSecciones = async (req: Request, res: Response) => {
    const { secciones } = req.body; // Expecting array of { nombreSeccion, idGrado }
    if (!Array.isArray(secciones)) return res.status(400).json({ error: 'Expected array of secciones' });

    const created = await prisma.seccion.createMany({
        data: secciones.map((s: any) => ({
            nombreSeccion: s.nombreSeccion,
            idGrado: s.idGrado
        }))
    });
    getIO().emit('data_updated', { type: 'SECCION' });
    res.json({ success: true, count: created.count });
};

export const updateSeccion = async (req: Request, res: Response) => {
    const { nombreSeccion, idGrado } = req.body;
    const seccion = await prisma.seccion.update({
        where: { id: Number(req.params.id) },
        data: {
            nombreSeccion,
            idGrado
        } as any
    });
    res.json(seccion);
};

export const deleteSeccion = async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.seccion.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() } as any
    });
    getIO().emit('data_updated', { type: 'SECCION', id: Number(id) });
    res.status(204).send();
};

// --- AÑOS ESCOLARES ---
export const createSchoolYear = async (req: Request, res: Response) => {
    const ay = await prisma.anosEscolares.create({
        data: { nombre: req.body.nombre }
    });
    res.json(ay);
};

export const updateSchoolYear = async (req: Request, res: Response) => {
    const ay = await prisma.anosEscolares.update({
        where: { id: Number(req.params.id) },
        data: { nombre: req.body.nombre }
    });
    res.json(ay);
};

export const deleteSchoolYear = async (req: Request, res: Response) => {
    await prisma.anosEscolares.update({
        where: { id: Number(req.params.id) },
        data: { deletedAt: new Date() } as any
    });
    res.json({ success: true });
};
