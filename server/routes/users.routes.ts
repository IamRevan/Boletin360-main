import { Router } from 'express';
import { createUser, updateUser, deleteUser, resetPassword } from '../controllers/users.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol Admin (o Director para algunas)
router.use(authenticateToken);

router.post('/', authorizeRole(['ADMIN', 'DIRECTOR']), createUser);
router.put('/:id', authorizeRole(['ADMIN', 'DIRECTOR']), updateUser);
router.delete('/:id', authorizeRole(['ADMIN']), deleteUser);
router.post('/:id/reset-password', authorizeRole(['ADMIN']), resetPassword);

export default router;
