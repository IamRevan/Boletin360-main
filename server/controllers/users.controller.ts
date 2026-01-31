import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { CreateUserSchema, UpdateUserSchema } from '../schemas';
import { logAction } from '../services/audit';
import { AuthRequest } from '../middleware/auth';

export const createUser = async (req: AuthRequest, res: Response) => {
    const validation = CreateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nombres, apellidos, email, password, role, teacherId } = validation.data;
    const userId = req.user?.id;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            nombres,
            apellidos,
            email,
            password: hashedPassword,
            role,
            teacherId: teacherId || null
        }
    });

    await logAction(userId, 'CREATE_USER', `Created user ${user.email} with role ${user.role}`);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, teacherId: user.teacherId });
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const validation = UpdateUserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
    }
    const { nombres, apellidos, email, password, role, teacherId } = validation.data;
    const userId = req.user?.id;

    let updateData: any = {
        nombres,
        apellidos,
        email,
        role,
        teacherId: teacherId || null
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
        where: { id: Number(id) },
        data: updateData
    });

    await logAction(userId, 'UPDATE_USER', `Updated user ID ${id}`);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, teacherId: user.teacherId });
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    // Soft delete - set deletedAt instead of deleting
    await prisma.user.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() }
    });

    await logAction(userId, 'DELETE_USER', `Soft deleted user ID ${id}`);
    res.json({ success: true });
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const userId = req.user?.id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: Number(id) },
        data: { password: hashedPassword }
    });

    await logAction(userId, 'RESET_PASSWORD', `Reset password for user ID ${id}`);
    res.json({ success: true });
};
