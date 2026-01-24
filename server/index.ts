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

const app = express();
const PORT = config.PORT;

// Middlewares globales
app.use(cors());
app.use(express.json());

// --- RUTAS API ---
app.use('/api', authRoutes); // login
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api', academicRoutes); // Mounted at /api because it contains /grados, /secciones (e.g. /api/grados)
app.use('/api', gradesRoutes);   // Mounted at /api because it contains /initial-data, /reports

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connected via Prisma`);
});
