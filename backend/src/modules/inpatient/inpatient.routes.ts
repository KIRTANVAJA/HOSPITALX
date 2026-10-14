import { Router } from 'express';
import { InpatientController } from './inpatient.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createWardSchema,
  createRoomSchema,
  createBedSchema,
  updateBedStatusSchema,
  admitPatientSchema,
  transferPatientSchema,
  dischargePatientSchema,
} from './inpatient.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Metrics
router.get(
  '/metrics',
  InpatientController.getMetrics
);

// Wards
router.get(
  '/wards',
  InpatientController.listWards
);
router.post(
  '/wards',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createWardSchema }),
  InpatientController.createWard
);

// Rooms
router.get(
  '/rooms',
  InpatientController.listRooms
);
router.post(
  '/rooms',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createRoomSchema }),
  InpatientController.createRoom
);

// Beds
router.get(
  '/beds',
  InpatientController.listBeds
);
router.post(
  '/beds',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createBedSchema }),
  InpatientController.createBed
);
router.patch(
  '/beds/:id/status',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.NURSE, UserRole.DOCTOR]),
  validateRequest({ body: updateBedStatusSchema }),
  InpatientController.updateBedStatus
);

// Inpatient Admissions, Transfers & Discharges
router.post(
  '/admissions',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]),
  validateRequest({ body: admitPatientSchema }),
  InpatientController.admitPatient
);
router.patch(
  '/admissions/:id/transfer',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE]),
  validateRequest({ body: transferPatientSchema }),
  InpatientController.transferPatient
);
router.patch(
  '/admissions/:id/discharge',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE]),
  validateRequest({ body: dischargePatientSchema }),
  InpatientController.dischargePatient
);

export const inpatientRoutes = router;
