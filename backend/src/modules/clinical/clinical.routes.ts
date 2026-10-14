import { Router } from 'express';
import { ClinicalController } from './clinical.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createConsultationSchema,
  updateConsultationSchema,
  createPrescriptionSchema,
  updatePrescriptionStatusSchema,
  createMedicalReportSchema,
} from './clinical.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// -----------------------------------------------------------------------------
// Consultations
// -----------------------------------------------------------------------------
router.get('/consultations', ClinicalController.listConsultations);
router.get('/consultations/:id', ClinicalController.getConsultationById);
router.post(
  '/consultations',
  requireRole([UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createConsultationSchema }),
  ClinicalController.createConsultation
);
router.patch(
  '/consultations/:id',
  requireRole([UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: updateConsultationSchema }),
  ClinicalController.updateConsultation
);
router.post(
  '/consultations/:id/finalize',
  requireRole([UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  ClinicalController.finalizeConsultation
);

// -----------------------------------------------------------------------------
// Prescriptions
// -----------------------------------------------------------------------------
router.get('/prescriptions', ClinicalController.listPrescriptions);
router.post(
  '/prescriptions',
  requireRole([UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createPrescriptionSchema }),
  ClinicalController.createPrescription
);
router.patch(
  '/prescriptions/:id/status',
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: updatePrescriptionStatusSchema }),
  ClinicalController.updatePrescriptionStatus
);

// -----------------------------------------------------------------------------
// Medical Reports
// -----------------------------------------------------------------------------
router.get('/reports', ClinicalController.listMedicalReports);
router.post(
  '/reports',
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createMedicalReportSchema }),
  ClinicalController.createMedicalReport
);

export const clinicalRoutes = router;
