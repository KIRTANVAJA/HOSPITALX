import { Router } from 'express';
import { PatientController } from './patient.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import { createPatientByStaffSchema, updatePatientSchema } from './patient.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Staff roster lookup (cannot be viewed by ordinary patients)
router.get(
  '/',
  requireRole([
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.BILLING,
  ]),
  PatientController.list
);

// Detail lookup (permitted staff or patient self-inspection)
router.get('/:id', PatientController.getById);

// Staff manual registration
router.post(
  '/',
  requireRole([
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.NURSE,
  ]),
  validateRequest({ body: createPatientByStaffSchema }),
  PatientController.create
);

// Profile update (staff or patient self-update)
router.patch('/:id', validateRequest({ body: updatePatientSchema }), PatientController.update);

export const patientRoutes = router;
