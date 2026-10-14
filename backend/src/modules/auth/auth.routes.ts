import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate';
import { loginSchema, registerPatientSchema } from './auth.schema';
import { authenticate } from '../../middlewares/auth';
import { authRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/register', authRateLimiter, validateRequest({ body: registerPatientSchema }), AuthController.register);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export const authRoutes = router;
