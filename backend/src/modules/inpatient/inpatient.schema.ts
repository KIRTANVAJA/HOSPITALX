import { z } from 'zod';
import { BedStatus } from '@prisma/client';

export const createWardSchema = z.object({
  name: z.string().min(1, 'Ward name is required'),
  code: z.string().min(1, 'Ward code is required'),
  floor: z.string().optional(),
  genderAllocation: z.enum(['MALE', 'FEMALE', 'MIXED', 'PEDIATRIC']).default('MIXED'),
  capacity: z.number().int().nonnegative().default(0),
});

export const createRoomSchema = z.object({
  wardId: z.string().min(1, 'Ward ID is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: z.enum(['STANDARD', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'ISOLATION']).default('STANDARD'),
});

export const createBedSchema = z.object({
  wardId: z.string().min(1, 'Ward ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  bedNumber: z.string().min(1, 'Bed number is required'),
  dailyRate: z.number().nonnegative().default(100.0),
});

export const updateBedStatusSchema = z.object({
  status: z.nativeEnum(BedStatus),
});

export const admitPatientSchema = z.object({
  bedId: z.string().min(1, 'Bed ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  admissionReason: z.string().min(1, 'Admission reason is required'),
  attendingDoctor: z.string().optional(),
});

export const transferPatientSchema = z.object({
  newBedId: z.string().min(1, 'New Bed ID is required'),
  transferReason: z.string().optional(),
});

export const dischargePatientSchema = z.object({
  dischargeSummary: z.string().min(1, 'Discharge summary is required'),
});

export type CreateWardInput = z.infer<typeof createWardSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateBedInput = z.infer<typeof createBedSchema>;
export type UpdateBedStatusInput = z.infer<typeof updateBedStatusSchema>;
export type AdmitPatientInput = z.infer<typeof admitPatientSchema>;
export type TransferPatientInput = z.infer<typeof transferPatientSchema>;
export type DischargePatientInput = z.infer<typeof dischargePatientSchema>;
