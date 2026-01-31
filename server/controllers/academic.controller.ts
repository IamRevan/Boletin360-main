import { Request, Response } from 'express';
import { prisma } from '../db';

// --- GRADOS ---
export const createGrado = async (req: Request, res: Response) => {
    const grado = await prisma.grado.create({
        data: { nombreGrado: req.body.nombre_grado }
    });
    res.json(grado);
};

export const updateGrado = async (req: Request, res: Response) => {
    const grado = await prisma.grado.update({
        where: { id: Number(req.params.id) },
        data: { nombreGrado: req.body.nombre_grado }
    });
    res.json(grado);
};

export const deleteGrado = async (req: Request, res: Response) => {
    await prisma.grado.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
};

// --- SECCIONES ---
export const createSeccion = async (req: Request, res: Response) => {
    const seccion = await prisma.seccion.create({
        data: { nombreSeccion: req.body.nombre_seccion }
    });
    res.json(seccion);
};

export const updateSeccion = async (req: Request, res: Response) => {
    const seccion = await prisma.seccion.update({
        where: { id: Number(req.params.id) },
        data: { nombreSeccion: req.body.nombre_seccion }
    });
    res.json(seccion);
};

export const deleteSeccion = async (req: Request, res: Response) => {
    await prisma.seccion.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
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
    await prisma.anosEscolares.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
};
