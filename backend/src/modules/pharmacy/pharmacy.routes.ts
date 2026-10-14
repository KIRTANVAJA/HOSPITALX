import { Router } from 'express';
import { PharmacyController } from './pharmacy.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createPharmacyItemSchema,
  createPharmacyBatchSchema,
  recordStockMovementSchema,
  dispenseMedicationSchema,
} from './pharmacy.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Metrics
router.get(
  '/metrics',
  PharmacyController.getMetrics
);

// Items Catalogue
router.get(
  '/items',
  PharmacyController.listItems
);
router.post(
  '/items',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHARMACIST, UserRole.INVENTORY_MANAGER]),
  validateRequest({ body: createPharmacyItemSchema }),
  PharmacyController.createItem
);

// Batches
router.get(
  '/batches',
  PharmacyController.listBatches
);
router.post(
  '/batches',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHARMACIST, UserRole.INVENTORY_MANAGER]),
  validateRequest({ body: createPharmacyBatchSchema }),
  PharmacyController.createBatch
);

// Stock Movements
router.post(
  '/movements',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHARMACIST, UserRole.INVENTORY_MANAGER]),
  validateRequest({ body: recordStockMovementSchema }),
  PharmacyController.recordMovement
);

// Dispensing
router.post(
  '/dispense',
  requireRole([UserRole.PHARMACIST, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.NURSE, UserRole.DOCTOR]),
  validateRequest({ body: dispenseMedicationSchema }),
  PharmacyController.dispense
);

export const pharmacyRoutes = router;
