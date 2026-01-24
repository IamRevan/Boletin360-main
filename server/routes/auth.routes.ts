import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../schemas';

const router = Router();

router.post('/login', validate(LoginSchema), login);

export default router;
