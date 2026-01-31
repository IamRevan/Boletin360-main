import { Router } from 'express';
import { createTeacher, updateTeacher, deleteTeacher } from '../controllers/teachers.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken); // Requerir auth para todo

router.post('/', asyncHandler(createTeacher));
router.put('/:id', asyncHandler(updateTeacher));
router.delete('/:id', asyncHandler(deleteTeacher));


export default router;
