import { Router } from 'express';
import { createUser, updateUser, deleteUser, resetPassword } from '../controllers/users.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Todas las rutas requieren autenticación y rol Admin (o Director para algunas)
router.use(authenticateToken);

router.post('/', authorizeRole(['ADMIN', 'DIRECTOR']), asyncHandler(createUser));
router.put('/:id', authorizeRole(['ADMIN', 'DIRECTOR']), asyncHandler(updateUser));
router.delete('/:id', authorizeRole(['ADMIN']), asyncHandler(deleteUser));
router.post('/:id/reset-password', authorizeRole(['ADMIN']), asyncHandler(resetPassword));


export default router;
