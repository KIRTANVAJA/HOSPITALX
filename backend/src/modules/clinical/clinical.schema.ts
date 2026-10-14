import { z } from 'zod';
import { ConsultationStatus, PrescriptionStatus, ReportType } from '@prisma/client';

export const vitalSignsSchema = z.object({
  bp: z.string().optional(),
  heartRate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  weightKg: z.number().positive().optional(),
}).optional();

export const createConsultationSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(), // Inferred from authenticated doctor if omitted
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  symptoms: z.string().optional(),
  examinationNotes: z.string().optional(),
  vitalSigns: vitalSignsSchema,
});

export const updateConsultationSchema = z.object({
  diagnosis: z.string().min(1).optional(),
  symptoms: z.string().optional(),
  examinationNotes: z.string().optional(),
  vitalSigns: vitalSignsSchema,
});

export const medicationItemSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. twice daily)'),
  duration: z.string().min(1, 'Duration is required (e.g. 7 days)'),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  consultationId: z.string().optional(),
  medications: z.array(medicationItemSchema).min(1, 'At least one medication is required'),
  notes: z.string().optional(),
});

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum([
    PrescriptionStatus.ACTIVE,
    PrescriptionStatus.DISCONTINUED,
    PrescriptionStatus.COMPLETED,
  ]),
});

export const createMedicalReportSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  title: z.string().min(1, 'Report title is required'),
  reportType: z.enum([
    ReportType.LAB_TEST,
    ReportType.RADIOLOGY,
    ReportType.PATHOLOGY,
    ReportType.DISCHARGE_SUMMARY,
    ReportType.OTHER,
  ]).default(ReportType.LAB_TEST),
  fileUrl: z.string().url().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  summary: z.string().optional(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type CreateMedicalReportInput = z.infer<typeof createMedicalReportSchema>;
