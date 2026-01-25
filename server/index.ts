import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import studentRoutes from './routes/students.routes';
import teacherRoutes from './routes/teachers.routes';
import academicRoutes from './routes/academic.routes';
import gradesRoutes from './routes/grades.routes';
import auditRoutes from './routes/audit.routes';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = config.PORT;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rate limiting (aplicado a todas las rutas API)
app.use('/api', apiLimiter);

// --- RUTAS API ---
app.use('/api', authRoutes); // login (authLimiter se aplica específicamente en auth.routes si es necesario)
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api', academicRoutes); // Mounted at /api because it contains /grados, /secciones (e.g. /api/grados)
app.use('/api', gradesRoutes);   // Mounted at /api because it contains /initial-data, /reports
app.use('/api', auditRoutes);    // Mounted at /api because it contains /audit-logs

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connected via Prisma`);
});
