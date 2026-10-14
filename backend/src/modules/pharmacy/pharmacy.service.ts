import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import {
  CreatePharmacyItemInput,
  CreatePharmacyBatchInput,
  RecordStockMovementInput,
  DispenseMedicationInput,
} from './pharmacy.schema';
import { recordAuditEvent } from '../../services/audit.service';
import { StockMovementType, PrescriptionStatus } from '@prisma/client';

export class PharmacyService {
  // ---------------------------------------------------------------------------
  // Catalogue
  // ---------------------------------------------------------------------------

  static async listItems(hospitalId: string, category?: string) {
    const where: any = { hospitalId, isActive: true };
    if (category) where.category = category;

    return prisma.pharmacyItem.findMany({
      where,
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createItem(
    hospitalId: string,
    actorId: string,
    input: CreatePharmacyItemInput,
    ip?: string,
    userAgent?: string
  ) {
    const cleanSku = input.sku.toUpperCase().trim();
    const existing = await prisma.pharmacyItem.findUnique({
      where: { hospitalId_sku: { hospitalId, sku: cleanSku } },
    });
    if (existing) {
      throw new ConflictError(`Item with SKU "${cleanSku}" already exists in pharmacy catalogue`);
    }

    const item = await prisma.pharmacyItem.create({
      data: {
        hospitalId,
        name: input.name.trim(),
        genericName: input.genericName?.trim() || null,
        sku: cleanSku,
        category: input.category.trim(),
        unitOfMeasure: input.unitOfMeasure,
        reorderLevel: input.reorderLevel,
        unitPrice: input.unitPrice,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PHARMACY_ITEM_CREATE',
      entity: 'PharmacyItem',
      entityId: item.id,
      details: { name: item.name, sku: item.sku },
      ipAddress: ip,
      userAgent,
    });

    return item;
  }

  // ---------------------------------------------------------------------------
  // Batches & Stock Tracking
  // ---------------------------------------------------------------------------

  static async listBatches(hospitalId: string, pharmacyItemId?: string) {
    const where: any = { hospitalId };
    if (pharmacyItemId) where.pharmacyItemId = pharmacyItemId;

    return prisma.pharmacyBatch.findMany({
      where,
      include: {
        pharmacyItem: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  static async createBatch(
    hospitalId: string,
    actorId: string,
    input: CreatePharmacyBatchInput,
    ip?: string,
    userAgent?: string
  ) {
    const item = await prisma.pharmacyItem.findFirst({
      where: { id: input.pharmacyItemId, hospitalId },
    });
    if (!item) throw new NotFoundError('Pharmacy item not found');

    const cleanBatch = input.batchNumber.trim();
    const existing = await prisma.pharmacyBatch.findUnique({
      where: {
        pharmacyItemId_batchNumber: {
          pharmacyItemId: input.pharmacyItemId,
          batchNumber: cleanBatch,
        },
      },
    });
    if (existing) {
      throw new ConflictError(`Batch "${cleanBatch}" already exists for this item`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.pharmacyBatch.create({
        data: {
          hospitalId,
          pharmacyItemId: input.pharmacyItemId,
          batchNumber: cleanBatch,
          expiryDate: input.expiryDate,
          quantity: input.quantity,
          unitCost: input.unitCost,
        },
      });

      // Record initial stock receipt movement
      await tx.stockMovement.create({
        data: {
          hospitalId,
          pharmacyItemId: input.pharmacyItemId,
          batchId: batch.id,
          movementType: StockMovementType.PURCHASE,
          quantity: input.quantity,
          referenceId: cleanBatch,
          notes: 'Initial batch procurement receipt',
          performedById: actorId,
        },
      });

      return batch;
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PHARMACY_BATCH_CREATE',
      entity: 'PharmacyBatch',
      entityId: result.id,
      details: { item: item.name, batch: cleanBatch, quantity: input.quantity },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  static async recordStockMovement(
    hospitalId: string,
    actorId: string,
    input: RecordStockMovementInput,
    ip?: string,
    userAgent?: string
  ) {
    const item = await prisma.pharmacyItem.findFirst({
      where: { id: input.pharmacyItemId, hospitalId },
    });
    if (!item) throw new NotFoundError('Pharmacy item not found');

    const movement = await prisma.$transaction(async (tx) => {
      if (input.batchId) {
        const batch = await tx.pharmacyBatch.findFirst({
          where: { id: input.batchId, hospitalId, pharmacyItemId: input.pharmacyItemId },
        });
        if (!batch) throw new NotFoundError('Batch not found');

        // Check if movement reduces stock
        const isDeduction = [
          StockMovementType.DISPENSE,
          StockMovementType.DAMAGED,
          StockMovementType.EXPIRED,
          StockMovementType.ADJUSTMENT,
        ].includes(input.movementType);

        if (isDeduction && batch.quantity < input.quantity) {
          throw new BadRequestError(
            `Insufficient stock in batch ${batch.batchNumber} (available: ${batch.quantity}, requested: ${input.quantity})`
          );
        }

        const newQty = isDeduction
          ? batch.quantity - input.quantity
          : batch.quantity + input.quantity;

        await tx.pharmacyBatch.update({
          where: { id: input.batchId },
          data: { quantity: newQty },
        });
      }

      const rec = await tx.stockMovement.create({
        data: {
          hospitalId,
          pharmacyItemId: input.pharmacyItemId,
          batchId: input.batchId || null,
          movementType: input.movementType,
          quantity: input.quantity,
          referenceId: input.referenceId || null,
          notes: input.notes || null,
          performedById: actorId,
        },
      });

      return rec;
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PHARMACY_STOCK_MOVEMENT',
      entity: 'StockMovement',
      entityId: movement.id,
      details: { item: item.name, type: input.movementType, quantity: input.quantity },
      ipAddress: ip,
      userAgent,
    });

    return movement;
  }

  // ---------------------------------------------------------------------------
  // Medication Dispensing Workflow
  // ---------------------------------------------------------------------------

  static async dispenseMedication(
    hospitalId: string,
    actorId: string,
    input: DispenseMedicationInput,
    ip?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, hospitalId },
    });
    if (!patient) throw new NotFoundError('Patient not found');

    const result = await prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const batch = await tx.pharmacyBatch.findFirst({
          where: { id: item.batchId, hospitalId, pharmacyItemId: item.pharmacyItemId },
        });

        if (!batch) {
          throw new NotFoundError(`Batch ${item.batchId} not found`);
        }

        if (batch.quantity < item.quantity) {
          throw new BadRequestError(
            `Insufficient quantity in batch ${batch.batchNumber} (requested: ${item.quantity}, available: ${batch.quantity})`
          );
        }

        // Deduct inventory
        await tx.pharmacyBatch.update({
          where: { id: item.batchId },
          data: { quantity: batch.quantity - item.quantity },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            hospitalId,
            pharmacyItemId: item.pharmacyItemId,
            batchId: item.batchId,
            movementType: StockMovementType.DISPENSE,
            quantity: item.quantity,
            referenceId: input.prescriptionId || `PATIENT-${patient.medicalRecordNumber}`,
            notes: input.notes || 'Prescription medication dispensed to patient',
            performedById: actorId,
          },
        });
      }

      // If tied to prescription, mark prescription as COMPLETED
      if (input.prescriptionId) {
        await tx.prescription.updateMany({
          where: { id: input.prescriptionId, hospitalId },
          data: { status: PrescriptionStatus.COMPLETED },
        });
      }

      return {
        dispensed: true,
        patientId: input.patientId,
        itemsCount: input.items.length,
      };
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PHARMACY_DISPENSE',
      entity: 'PharmacyItem',
      entityId: input.patientId,
      details: { itemsCount: input.items.length, prescriptionId: input.prescriptionId },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  // ---------------------------------------------------------------------------
  // Metrics & Alerts
  // ---------------------------------------------------------------------------

  static async getInventoryMetrics(hospitalId: string) {
    const [totalItems, batches] = await Promise.all([
      prisma.pharmacyItem.count({ where: { hospitalId, isActive: true } }),
      prisma.pharmacyBatch.findMany({
        where: { hospitalId, quantity: { gt: 0 } },
        include: { pharmacyItem: true },
      }),
    ]);

    let totalUnitsInStock = 0;
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    const ninetyDaysStr = ninetyDaysFromNow.toISOString().split('T')[0];

    let expiringSoonCount = 0;
    const itemStockMap: Record<string, { total: number; reorderLevel: number; name: string }> = {};

    batches.forEach((b) => {
      totalUnitsInStock += b.quantity;
      if (b.expiryDate <= ninetyDaysStr) {
        expiringSoonCount++;
      }
      if (!itemStockMap[b.pharmacyItemId]) {
        itemStockMap[b.pharmacyItemId] = {
          total: 0,
          reorderLevel: b.pharmacyItem.reorderLevel,
          name: b.pharmacyItem.name,
        };
      }
      itemStockMap[b.pharmacyItemId].total += b.quantity;
    });

    let lowStockCount = 0;
    Object.values(itemStockMap).forEach((item) => {
      if (item.total <= item.reorderLevel) {
        lowStockCount++;
      }
    });

    return {
      totalItems,
      totalUnitsInStock,
      lowStockCount,
      expiringSoonCount,
    };
  }
}
