import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import { createInvoiceSchema, recordPaymentSchema } from './billing.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// View list of invoices
router.get('/invoices', BillingController.listInvoices);

// View single invoice details
router.get('/invoices/:id', BillingController.getInvoiceById);

// Create new invoice
router.post(
  '/invoices',
  requireRole([UserRole.BILLING, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: createInvoiceSchema }),
  BillingController.createInvoice
);

// Record payment against invoice
router.post(
  '/invoices/:id/payments',
  requireRole([UserRole.BILLING, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]),
  validateRequest({ body: recordPaymentSchema }),
  BillingController.recordPayment
);

export const billingRoutes = router;
