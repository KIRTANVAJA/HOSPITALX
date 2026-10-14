import { Router } from 'express';
import { AppointmentController } from './appointment.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
} from './appointment.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// View list of appointments (filtered by role in service)
router.get('/', AppointmentController.list);

// View single appointment details
router.get('/:id', AppointmentController.getById);

// Book new appointment
router.post('/', validateRequest({ body: bookAppointmentSchema }), AppointmentController.book);

// Reschedule appointment
router.patch(
  '/:id/reschedule',
  validateRequest({ body: rescheduleAppointmentSchema }),
  AppointmentController.reschedule
);

// Cancel appointment
router.patch(
  '/:id/cancel',
  validateRequest({ body: cancelAppointmentSchema }),
  AppointmentController.cancel
);

// Staff status update (Approve, Complete, No-Show)
router.patch(
  '/:id/status',
  requireRole([
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
    UserRole.NURSE,
  ]),
  validateRequest({ body: updateAppointmentStatusSchema }),
  AppointmentController.updateStatus
);

export const appointmentRoutes = router;
