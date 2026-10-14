import { Router } from 'express';
import { HospitalController } from './hospital.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole, enforceHospitalScope } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import { updateHospitalSettingsSchema } from './hospital.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(enforceHospitalScope);

router.get('/current', HospitalController.getCurrent);
router.patch(
  '/settings',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: updateHospitalSettingsSchema }),
  HospitalController.updateSettings
);

export const hospitalRoutes = router;
