import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  hospitalCode: z.string().optional(),
});

export const registerPatientSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  hospitalCode: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
