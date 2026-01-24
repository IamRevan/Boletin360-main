import { Router } from 'express';
import { createStudent, updateStudent, deleteStudent, promoteStudents, getStudentProfile } from '../controllers/students.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['Admin', 'Control de Estudios', 'Director']), createStudent);
router.put('/:id', authorizeRole(['Admin', 'Control de Estudios', 'Director']), updateStudent);
router.delete('/:id', authorizeRole(['Admin', 'Control de Estudios', 'Director']), deleteStudent);
router.post('/promote', authorizeRole(['Admin']), promoteStudents);
router.get('/:id/profile', getStudentProfile);

export default router;
