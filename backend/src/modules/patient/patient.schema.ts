import { z } from 'zod';

export const createPatientByStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  phone: z.string().min(7, 'Phone number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  allergies: z.string().optional(),
});

export const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional(),
  emergencyContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  allergies: z.string().optional(),
  bloodGroup: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreatePatientByStaffInput = z.infer<typeof createPatientByStaffSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
