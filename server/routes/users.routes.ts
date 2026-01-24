import { Router } from 'express';
import { createUser, updateUser, deleteUser, resetPassword } from '../controllers/users.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol Admin (o Director para algunas)
router.use(authenticateToken);

router.post('/', authorizeRole(['Admin', 'Director']), createUser);
router.put('/:id', authorizeRole(['Admin', 'Director']), updateUser);
router.delete('/:id', authorizeRole(['Admin']), deleteUser);
router.post('/:id/reset-password', authorizeRole(['Admin']), resetPassword);

export default router;
