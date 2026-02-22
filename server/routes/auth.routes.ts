import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../schemas';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', authLimiter, validate(LoginSchema), asyncHandler(login));

export default router;

