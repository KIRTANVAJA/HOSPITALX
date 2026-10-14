import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
} from './department.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Public to all hospital members (e.g. patients booking appointments, doctors viewing depts)
router.get('/', DepartmentController.list);

// Admin-only management
router.post(
  '/',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createDepartmentSchema }),
  DepartmentController.create
);

router.patch(
  '/:id',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: updateDepartmentSchema }),
  DepartmentController.update
);

router.patch(
  '/:id/status',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: updateDepartmentStatusSchema }),
  DepartmentController.updateStatus
);

export const departmentRoutes = router;
