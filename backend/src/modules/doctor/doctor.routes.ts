import { Router } from 'express';
import { DoctorController } from './doctor.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createDoctorSchema,
  updateDoctorSchema,
  setDoctorAvailabilitySchema,
} from './doctor.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Public roster lookup for patients and staff
router.get('/', DoctorController.list);
router.get('/:id', DoctorController.getById);
router.get('/:id/availability', DoctorController.getAvailability);

// Admin-only doctor creation
router.post(
  '/',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createDoctorSchema }),
  DoctorController.create
);

// Admin or Doctor profile modification
router.patch(
  '/:id',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR]),
  validateRequest({ body: updateDoctorSchema }),
  DoctorController.update
);

// Doctor or Admin availability management
router.put(
  '/:id/availability',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR]),
  validateRequest({ body: setDoctorAvailabilitySchema }),
  DoctorController.setAvailability
);

export const doctorRoutes = router;
