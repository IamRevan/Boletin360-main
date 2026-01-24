import { Request, Response } from 'express';
import { prisma } from '../db';

// --- GRADOS ---
export const createGrado = async (req: Request, res: Response) => {
    try {
        const grado = await prisma.grado.create({
            data: { nombreGrado: req.body.nombre_grado }
        });
        res.json(grado);
    } catch (err) { res.status(500).json({ error: 'Error al crear grado' }); }
};

export const updateGrado = async (req: Request, res: Response) => {
    try {
        const grado = await prisma.grado.update({
            where: { id: Number(req.params.id) },
            data: { nombreGrado: req.body.nombre_grado }
        });
        res.json(grado);
    } catch (err) { res.status(500).json({ error: 'Error al actualizar grado' }); }
};

export const deleteGrado = async (req: Request, res: Response) => {
    try {
        await prisma.grado.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar grado' }); }
};

// --- SECCIONES ---
export const createSeccion = async (req: Request, res: Response) => {
    try {
        const seccion = await prisma.seccion.create({
            data: { nombreSeccion: req.body.nombre_seccion }
        });
        res.json(seccion);
    } catch (err) { res.status(500).json({ error: 'Error al crear sección' }); }
};

export const updateSeccion = async (req: Request, res: Response) => {
    try {
        const seccion = await prisma.seccion.update({
            where: { id: Number(req.params.id) },
            data: { nombreSeccion: req.body.nombre_seccion }
        });
        res.json(seccion);
    } catch (err) { res.status(500).json({ error: 'Error al actualizar sección' }); }
};

export const deleteSeccion = async (req: Request, res: Response) => {
    try {
        await prisma.seccion.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar sección' }); }
};

// --- AÑOS ESCOLARES ---
export const createSchoolYear = async (req: Request, res: Response) => {
    try {
        const ay = await prisma.anosEscolares.create({
            data: { nombre: req.body.nombre }
        });
        res.json(ay);
    } catch (err) { res.status(500).json({ error: 'Error al crear año escolar' }); }
};

export const updateSchoolYear = async (req: Request, res: Response) => {
    try {
        const ay = await prisma.anosEscolares.update({
            where: { id: Number(req.params.id) },
            data: { nombre: req.body.nombre }
        });
        res.json(ay);
    } catch (err) { res.status(500).json({ error: 'Error al actualizar año escolar' }); }
};

export const deleteSchoolYear = async (req: Request, res: Response) => {
    try {
        await prisma.anosEscolares.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar año escolar' }); }
};
