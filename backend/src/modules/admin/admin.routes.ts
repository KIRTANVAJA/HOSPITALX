import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import { auditLogFilterSchema } from './admin.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]));

router.get('/metrics', AdminController.getMetrics);
router.get('/audit-logs', validateRequest({ query: auditLogFilterSchema }), AdminController.getAuditLogs);

export const adminRoutes = router;
