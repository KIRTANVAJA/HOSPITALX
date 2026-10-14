import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(2, 'Department code is required (e.g. CARDIO)'),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
});

export const updateDepartmentStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type UpdateDepartmentStatusInput = z.infer<typeof updateDepartmentStatusSchema>;
