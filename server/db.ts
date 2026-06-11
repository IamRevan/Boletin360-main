import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const SOFT_DELETE_MODELS = ['User', 'Announcement', 'Student', 'Teacher', 'Materia', 'Grado', 'Seccion', 'AnosEscolares', 'Calificacion', 'Evaluation'];

function applySoftDelete(model: string | undefined, args: any): void {
    if (model && SOFT_DELETE_MODELS.includes(model) && args.where?.deletedAt === undefined) {
        args.where = { ...(args.where || {}), deletedAt: null };
    }
}

const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Apply soft-delete filter via $extends (modern replacement for deprecated $use middleware)
const extendedClient = baseClient.$extends({
    name: 'soft-delete-filter',
    query: {
        $allModels: {
            async findMany({ model, args, query }) {
                applySoftDelete(model, args);
                return query(args);
            },
            async findFirst({ model, args, query }) {
                applySoftDelete(model, args);
                return query(args);
            },
            async findUnique({ model, args, query }) {
                applySoftDelete(model, args);
                return query(args);
            },
            async count({ model, args, query }) {
                applySoftDelete(model, args);
                return query(args);
            },
            async aggregate({ model, args, query }) {
                applySoftDelete(model, args);
                return query(args);
            },
            async groupBy({ model, args, query }) {
                applySoftDelete(model, args);
                return query(args);
            }
        }
    }
}) as unknown as PrismaClient;

export const prisma = globalForPrisma.prisma || extendedClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
