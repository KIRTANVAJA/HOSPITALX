import { z } from 'zod';
import { VisitType, AppointmentStatus } from '@prisma/client';

export const bookAppointmentSchema = z.object({
  patientId: z.string().optional(), // optional if patient is booking for themselves
  doctorId: z.string().min(1, 'Doctor ID is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:mm (24-hour)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be HH:mm (24-hour)').optional(),
  visitType: z.enum([VisitType.IN_PERSON, VisitType.TELEHEALTH]).default(VisitType.IN_PERSON),
  reason: z.string().max(1000).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:mm (24-hour)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be HH:mm (24-hour)').optional(),
  reason: z.string().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.REJECTED,
  ]),
  notes: z.string().optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
