import { Router } from 'express';
import { createStudent, updateStudent, deleteStudent, promoteStudents, getStudentProfile } from '../controllers/students.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), asyncHandler(createStudent));
router.put('/:id', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), asyncHandler(updateStudent));
router.delete('/:id', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), asyncHandler(deleteStudent));
router.post('/promote', authorizeRole(['ADMIN']), asyncHandler(promoteStudents));
router.get('/:id/profile', asyncHandler(getStudentProfile));


export default router;
