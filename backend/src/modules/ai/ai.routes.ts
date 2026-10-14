import { Router } from 'express';
import { AiController } from './ai.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import { summarizeConsultationSchema } from './ai.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post(
  '/summarize-consultation',
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: summarizeConsultationSchema }),
  AiController.summarizeConsultation
);

export const aiRoutes = router;
