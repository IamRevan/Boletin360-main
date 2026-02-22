import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClient = new PrismaClient();

// Prisma Middleware for Global Soft Delete Filtering
prismaClient.$use(async (params, next) => {
    const modelsWithDeletedAt = ['User', 'Announcement', 'Teacher', 'Materia', 'Grado', 'Seccion', 'AnosEscolares', 'Calificacion', 'Evaluation', 'Student'];

    if (params.model && modelsWithDeletedAt.includes(params.model)) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
            // Change to findFirst - you cannot filter by anything except ID / unique with findUnique
            params.action = 'findFirst';
            params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
            if (params.args.where) {
                if (params.args.where.deletedAt === undefined) {
                    params.args.where['deletedAt'] = null;
                }
            } else {
                params.args['where'] = { deletedAt: null };
            }
        }
        // Aggregate, Count, etc can also be added here if needed
        if (params.action === 'count' || params.action === 'aggregate' || params.action === 'groupBy') {
            if (params.args.where) {
                if (params.args.where.deletedAt === undefined) {
                    params.args.where['deletedAt'] = null;
                }
            } else {
                params.args['where'] = { deletedAt: null };
            }
        }
    }
    return next(params);
});

export const prisma = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
