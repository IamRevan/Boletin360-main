import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../schemas';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/login', validate(LoginSchema), asyncHandler(login));

export default router;

