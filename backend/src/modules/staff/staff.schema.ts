import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  EmployeeCategory,
  EmploymentStatus,
  ShiftStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
} from '@prisma/client';

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum([
    UserRole.HOSPITAL_ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.BILLING,
    UserRole.LAB_TECHNICIAN,
    UserRole.PHARMACIST,
    UserRole.HR_MANAGER,
    UserRole.INVENTORY_MANAGER,
  ]),
  phone: z.string().optional(),
  employeeId: z.string().min(1),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  employeeCategory: z.nativeEnum(EmployeeCategory).default(EmployeeCategory.OTHER),
  employmentStatus: z.nativeEnum(EmploymentStatus).default(EmploymentStatus.ACTIVE),
  joiningDate: z.string().optional(),
  salary: z.number().positive().optional(),
  emergencyContact: z.string().optional(),
});

export const updateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  employeeCategory: z.nativeEnum(EmployeeCategory).optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  salary: z.number().positive().optional(),
  emergencyContact: z.string().optional(),
  role: z
    .enum([
      UserRole.HOSPITAL_ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.BILLING,
      UserRole.LAB_TECHNICIAN,
      UserRole.PHARMACIST,
      UserRole.HR_MANAGER,
      UserRole.INVENTORY_MANAGER,
    ])
    .optional(),
});

export const updateStaffStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]),
});

// Shift schemas
export const createStaffShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm (24hr format)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:mm (24hr format)'),
  color: z.string().optional(),
});

// Schedule assignment schema
export const assignScheduleSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff Profile ID is required'),
  shiftId: z.string().min(1, 'Shift ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  status: z.nativeEnum(ShiftStatus).default(ShiftStatus.SCHEDULED),
  notes: z.string().optional(),
});

// Attendance clock in/out schema
export const staffClockInSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff Profile ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  notes: z.string().optional(),
});

export const staffClockOutSchema = z.object({
  notes: z.string().optional(),
});

// Leave request schemas
export const submitLeaveRequestSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff Profile ID is required'),
  leaveType: z.nativeEnum(LeaveType).default(LeaveType.ANNUAL),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().min(1, 'Reason for leave is required'),
});

export const reviewLeaveRequestSchema = z.object({
  status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
  reviewerNotes: z.string().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
export type CreateStaffShiftInput = z.infer<typeof createStaffShiftSchema>;
export type AssignScheduleInput = z.infer<typeof assignScheduleSchema>;
export type StaffClockInInput = z.infer<typeof staffClockInSchema>;
export type StaffClockOutInput = z.infer<typeof staffClockOutSchema>;
export type SubmitLeaveRequestInput = z.infer<typeof submitLeaveRequestSchema>;
export type ReviewLeaveRequestInput = z.infer<typeof reviewLeaveRequestSchema>;
