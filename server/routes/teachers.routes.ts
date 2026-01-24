import { Router } from 'express';
import { createTeacher, updateTeacher, deleteTeacher } from '../controllers/teachers.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken); // Requerir auth para todo

router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
