import { Router } from 'express';
import { StaffController } from './staff.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validateRequest } from '../../middlewares/validate';
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  createStaffShiftSchema,
  assignScheduleSchema,
  staffClockInSchema,
  staffClockOutSchema,
  submitLeaveRequestSchema,
  reviewLeaveRequestSchema,
} from './staff.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Staff Metrics
router.get(
  '/metrics',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  StaffController.getHRMetrics
);

// Shifts
router.get(
  '/shifts',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER, UserRole.NURSE, UserRole.DOCTOR, UserRole.RECEPTIONIST]),
  StaffController.listShifts
);
router.post(
  '/shifts',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  validateRequest({ body: createStaffShiftSchema }),
  StaffController.createShift
);

// Schedules
router.get(
  '/schedules',
  StaffController.listSchedules
);
router.post(
  '/schedules',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  validateRequest({ body: assignScheduleSchema }),
  StaffController.assignSchedule
);

// Attendance
router.get(
  '/attendance',
  StaffController.listAttendances
);
router.post(
  '/attendance/clock-in',
  validateRequest({ body: staffClockInSchema }),
  StaffController.clockIn
);
router.post(
  '/attendance/:id/clock-out',
  validateRequest({ body: staffClockOutSchema }),
  StaffController.clockOut
);

// Leaves
router.get(
  '/leaves',
  StaffController.listLeaveRequests
);
router.post(
  '/leaves',
  validateRequest({ body: submitLeaveRequestSchema }),
  StaffController.submitLeaveRequest
);
router.patch(
  '/leaves/:id/review',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  validateRequest({ body: reviewLeaveRequestSchema }),
  StaffController.reviewLeaveRequest
);

// Employee CRUD
router.get(
  '/',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  StaffController.list
);
router.post(
  '/',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  validateRequest({ body: createStaffSchema }),
  StaffController.create
);
router.patch(
  '/:id',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  validateRequest({ body: updateStaffSchema }),
  StaffController.update
);
router.patch(
  '/:id/status',
  requireRole([UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER]),
  validateRequest({ body: updateStaffStatusSchema }),
  StaffController.updateStatus
);

export const staffRoutes = router;
