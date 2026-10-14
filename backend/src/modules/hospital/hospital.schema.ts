import { z } from 'zod';

export const updateHospitalSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export type UpdateHospitalSettingsInput = z.infer<typeof updateHospitalSettingsSchema>;
