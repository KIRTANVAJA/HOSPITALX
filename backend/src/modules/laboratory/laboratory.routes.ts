import { Router } from 'express';
import { LaboratoryController } from './laboratory.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createLabTestSchema,
  createLabOrderSchema,
  updateLabOrderStatusSchema,
  recordLabResultSchema,
} from './laboratory.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Metrics
router.get(
  '/metrics',
  LaboratoryController.getMetrics
);

// Catalogue
router.get(
  '/tests',
  LaboratoryController.listTests
);
router.post(
  '/tests',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN]),
  validateRequest({ body: createLabTestSchema }),
  LaboratoryController.createTest
);

// Orders
router.get(
  '/orders',
  LaboratoryController.listOrders
);
router.get(
  '/orders/:id',
  LaboratoryController.getOrderById
);
router.post(
  '/orders',
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createLabOrderSchema }),
  LaboratoryController.createOrder
);
router.patch(
  '/orders/:id/status',
  requireRole([UserRole.LAB_TECHNICIAN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE]),
  validateRequest({ body: updateLabOrderStatusSchema }),
  LaboratoryController.updateOrderStatus
);

// Results Recording
router.post(
  '/items/:itemId/result',
  requireRole([UserRole.LAB_TECHNICIAN, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR]),
  validateRequest({ body: recordLabResultSchema }),
  LaboratoryController.recordItemResult
);

export const laboratoryRoutes = router;
