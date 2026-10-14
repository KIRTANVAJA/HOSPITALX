import { z } from 'zod';

export const createDoctorSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  userId: z.string().optional(),
  name: z.string().min(1, 'Doctor name is required'),
  specialty: z.string().min(1, 'Specialty is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  qualification: z.string().optional(),
  bio: z.string().optional(),
  consultationFee: z.number().positive().optional(),
});

export const updateDoctorSchema = z.object({
  departmentId: z.string().optional(),
  name: z.string().min(1).optional(),
  specialty: z.string().min(1).optional(),
  qualification: z.string().optional(),
  bio: z.string().optional(),
  consultationFee: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const setDoctorAvailabilitySchema = z.object({
  availabilities: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:mm (24-hour)'),
      endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be HH:mm (24-hour)'),
      slotDurationMinutes: z.number().int().min(10).max(120).default(30),
      isActive: z.boolean().default(true),
    })
  ),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type SetDoctorAvailabilityInput = z.infer<typeof setDoctorAvailabilitySchema>;
