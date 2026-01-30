import { Router } from 'express';
import { createStudent, updateStudent, deleteStudent, promoteStudents, getStudentProfile } from '../controllers/students.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), createStudent);
router.put('/:id', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), updateStudent);
router.delete('/:id', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), deleteStudent);
router.post('/promote', authorizeRole(['ADMIN']), promoteStudents);
router.get('/:id/profile', getStudentProfile);

export default router;
