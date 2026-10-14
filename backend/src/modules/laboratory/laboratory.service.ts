import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import {
  CreateLabTestInput,
  CreateLabOrderInput,
  UpdateLabOrderStatusInput,
  RecordLabResultInput,
} from './laboratory.schema';
import { recordAuditEvent } from '../../services/audit.service';
import { LabOrderStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../types';

export class LaboratoryService {
  // ---------------------------------------------------------------------------
  // Lab Tests Catalogue
  // ---------------------------------------------------------------------------

  static async listTests(hospitalId: string, category?: string) {
    const where: any = { hospitalId, isActive: true };
    if (category) where.category = category;

    return prisma.labTest.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  static async createTest(
    hospitalId: string,
    actorId: string,
    input: CreateLabTestInput,
    ip?: string,
    userAgent?: string
  ) {
    const cleanCode = input.code.toUpperCase().trim();
    const existing = await prisma.labTest.findUnique({
      where: { hospitalId_code: { hospitalId, code: cleanCode } },
    });
    if (existing) {
      throw new ConflictError(`Diagnostic test with code "${cleanCode}" already exists`);
    }

    const test = await prisma.labTest.create({
      data: {
        hospitalId,
        name: input.name.trim(),
        code: cleanCode,
        category: input.category.trim(),
        sampleType: input.sampleType,
        normalRange: input.normalRange || null,
        units: input.units || null,
        price: input.price,
        turnaroundHours: input.turnaroundHours,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'LAB_TEST_CATALOGUE_CREATE',
      entity: 'LabTest',
      entityId: test.id,
      details: { name: test.name, code: test.code, category: test.category },
      ipAddress: ip,
      userAgent,
    });

    return test;
  }

  // ---------------------------------------------------------------------------
  // Lab Orders
  // ---------------------------------------------------------------------------

  static async listOrders(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    page = 1,
    limit = 20,
    filters: { patientId?: string; doctorId?: string; status?: LabOrderStatus } = {}
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId };

    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (!patient) return { orders: [], meta: { page, limit, total: 0, totalPages: 0 } };
      where.patientId = patient.id;
    } else {
      if (filters.patientId) where.patientId = filters.patientId;
      if (filters.doctorId) where.doctorId = filters.doctorId;
    }

    if (filters.status) where.status = filters.status;

    const [total, orders] = await Promise.all([
      prisma.labOrder.count({ where }),
      prisma.labOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true, phone: true } },
          doctor: { select: { id: true, name: true, specialty: true } },
          items: {
            include: {
              labTest: true,
            },
          },
        },
      }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getOrderById(hospitalId: string, orderId: string, currentUser: AuthenticatedUser) {
    const order = await prisma.labOrder.findFirst({
      where: { id: orderId, hospitalId },
      include: {
        patient: true,
        doctor: true,
        items: {
          include: { labTest: true },
        },
      },
    });

    if (!order) throw new NotFoundError('Lab order not found');

    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (!patient || patient.id !== order.patientId) {
        throw new NotFoundError('Lab order not found');
      }
    }

    return order;
  }

  static async createOrder(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    input: CreateLabOrderInput,
    ip?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, hospitalId },
    });
    if (!patient) throw new NotFoundError('Patient record not found in this hospital');

    // Verify tests exist
    const tests = await prisma.labTest.findMany({
      where: { id: { in: input.testIds }, hospitalId, isActive: true },
    });
    if (tests.length !== input.testIds.length) {
      throw new BadRequestError('One or more selected diagnostic tests are invalid or inactive');
    }

    // Auto-sequence order number LAB-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = await prisma.labOrder.count({ where: { hospitalId } });
    const orderNumber = `LAB-${year}-${String(count + 1).padStart(5, '0')}`;

    const order = await prisma.labOrder.create({
      data: {
        hospitalId,
        orderNumber,
        patientId: input.patientId,
        doctorId: input.doctorId || null,
        priority: input.priority,
        notes: input.notes || null,
        status: LabOrderStatus.ORDERED,
        items: {
          create: input.testIds.map((testId) => ({
            labTestId: testId,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: { include: { labTest: true } },
        patient: true,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'LAB_ORDER_CREATE',
      entity: 'LabOrder',
      entityId: order.id,
      details: { orderNumber, patientId: input.patientId, testsCount: tests.length },
      ipAddress: ip,
      userAgent,
    });

    return order;
  }

  static async updateOrderStatus(
    hospitalId: string,
    actorId: string,
    orderId: string,
    input: UpdateLabOrderStatusInput,
    ip?: string,
    userAgent?: string
  ) {
    const order = await prisma.labOrder.findFirst({
      where: { id: orderId, hospitalId },
    });
    if (!order) throw new NotFoundError('Lab order not found');

    const updated = await prisma.labOrder.update({
      where: { id: orderId },
      data: { status: input.status },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'LAB_ORDER_STATUS_UPDATE',
      entity: 'LabOrder',
      entityId: orderId,
      details: { previousStatus: order.status, newStatus: input.status },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  static async recordItemResult(
    hospitalId: string,
    actorId: string,
    itemId: string,
    input: RecordLabResultInput,
    ip?: string,
    userAgent?: string
  ) {
    const item = await prisma.labOrderItem.findUnique({
      where: { id: itemId },
      include: { labOrder: true, labTest: true },
    });

    if (!item || item.labOrder.hospitalId !== hospitalId) {
      throw new NotFoundError('Diagnostic order item not found');
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      const res = await tx.labOrderItem.update({
        where: { id: itemId },
        data: {
          resultValue: input.resultValue.trim(),
          resultNotes: input.resultNotes || null,
          isAbnormal: input.isAbnormal,
          status: input.status,
          performedAt: new Date(),
          verifiedAt: new Date(),
          verifiedById: actorId,
        },
      });

      // Check if all items in order are completed
      const remainingPending = await tx.labOrderItem.count({
        where: {
          labOrderId: item.labOrderId,
          status: { not: 'COMPLETED' },
        },
      });

      if (remainingPending === 0) {
        await tx.labOrder.update({
          where: { id: item.labOrderId },
          data: { status: LabOrderStatus.COMPLETED },
        });
      } else {
        await tx.labOrder.update({
          where: { id: item.labOrderId },
          data: { status: LabOrderStatus.IN_ANALYSIS },
        });
      }

      return res;
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'LAB_RESULT_RECORD',
      entity: 'LabOrderItem',
      entityId: itemId,
      details: { testName: item.labTest.name, isAbnormal: input.isAbnormal },
      ipAddress: ip,
      userAgent,
    });

    return updatedItem;
  }

  // ---------------------------------------------------------------------------
  // Metrics & Operational Telemetry
  // ---------------------------------------------------------------------------

  static async getLabMetrics(hospitalId: string) {
    const [totalCatalogTests, activeOrders, completedOrders, abnormalResults] = await Promise.all([
      prisma.labTest.count({ where: { hospitalId, isActive: true } }),
      prisma.labOrder.count({
        where: {
          hospitalId,
          status: { in: [LabOrderStatus.ORDERED, LabOrderStatus.SAMPLE_COLLECTED, LabOrderStatus.IN_ANALYSIS] },
        },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: LabOrderStatus.COMPLETED },
      }),
      prisma.labOrderItem.count({
        where: {
          labOrder: { hospitalId },
          isAbnormal: true,
        },
      }),
    ]);

    return {
      totalCatalogTests,
      activeOrders,
      completedOrders,
      abnormalResults,
    };
  }
}
