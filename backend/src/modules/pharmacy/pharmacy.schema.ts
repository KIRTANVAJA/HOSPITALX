import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createPharmacyItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  genericName: z.string().optional(),
  sku: z.string().min(1, 'SKU code is required'),
  category: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string().default('BOX'),
  reorderLevel: z.number().int().nonnegative().default(20),
  unitPrice: z.number().nonnegative().default(0),
});

export const createPharmacyBatchSchema = z.object({
  pharmacyItemId: z.string().min(1, 'Pharmacy Item ID is required'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be YYYY-MM-DD format'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitCost: z.number().nonnegative().default(0),
});

export const recordStockMovementSchema = z.object({
  pharmacyItemId: z.string().min(1, 'Pharmacy Item ID is required'),
  batchId: z.string().optional(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.number().int().positive('Quantity must be positive'),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const dispenseMedicationSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  prescriptionId: z.string().optional(),
  items: z
    .array(
      z.object({
        pharmacyItemId: z.string().min(1),
        batchId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'At least one medication item must be specified for dispensing'),
  notes: z.string().optional(),
});

export type CreatePharmacyItemInput = z.infer<typeof createPharmacyItemSchema>;
export type CreatePharmacyBatchInput = z.infer<typeof createPharmacyBatchSchema>;
export type RecordStockMovementInput = z.infer<typeof recordStockMovementSchema>;
export type DispenseMedicationInput = z.infer<typeof dispenseMedicationSchema>;
