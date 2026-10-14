import { z } from 'zod';

export const summarizeConsultationSchema = z.object({
  consultationId: z.string().optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required if consultationId is omitted').optional(),
  symptoms: z.string().optional(),
  examinationNotes: z.string().optional(),
  vitalSigns: z.object({
    bp: z.string().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weightKg: z.number().optional(),
  }).optional(),
});

export type SummarizeConsultationInput = z.infer<typeof summarizeConsultationSchema>;
