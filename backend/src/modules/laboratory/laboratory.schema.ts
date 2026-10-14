import { z } from 'zod';
import { LabOrderStatus, LabPriority } from '@prisma/client';

export const createLabTestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  code: z.string().min(1, 'Test code is required'),
  category: z.string().min(1, 'Category is required'),
  sampleType: z.string().default('BLOOD'),
  normalRange: z.string().optional(),
  units: z.string().optional(),
  price: z.number().nonnegative().default(0),
  turnaroundHours: z.number().int().positive().default(24),
});

export const createLabOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  priority: z.nativeEnum(LabPriority).default(LabPriority.ROUTINE),
  notes: z.string().optional(),
  testIds: z.array(z.string().min(1)).min(1, 'At least one lab test must be selected'),
});

export const updateLabOrderStatusSchema = z.object({
  status: z.nativeEnum(LabOrderStatus),
});

export const recordLabResultSchema = z.object({
  resultValue: z.string().min(1, 'Result value is required'),
  resultNotes: z.string().optional(),
  isAbnormal: z.boolean().default(false),
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).default('COMPLETED'),
});

export type CreateLabTestInput = z.infer<typeof createLabTestSchema>;
export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;
export type UpdateLabOrderStatusInput = z.infer<typeof updateLabOrderStatusSchema>;
export type RecordLabResultInput = z.infer<typeof recordLabResultSchema>;
