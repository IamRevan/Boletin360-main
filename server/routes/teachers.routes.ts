import { Router } from 'express';
import { createTeacher, updateTeacher, deleteTeacher, getTeacherClasses, getTeacherClassStudents } from '../controllers/teachers.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken); // Requerir auth para todo

router.post('/', asyncHandler(createTeacher));
router.put('/:id', asyncHandler(updateTeacher));
router.delete('/:id', asyncHandler(deleteTeacher));

// Teacher gradebook endpoints
router.get('/classes', asyncHandler(getTeacherClasses));
router.get('/classes/:materiaId/students', asyncHandler(getTeacherClassStudents));

export default router;
