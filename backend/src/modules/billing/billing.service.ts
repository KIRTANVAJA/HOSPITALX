import { prisma } from '../../db/prisma';
import { CreateInvoiceInput, RecordPaymentInput } from './billing.schema';
import { AuthenticatedUser } from '../../types';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { recordAuditEvent } from '../../services/audit.service';
import { InvoiceStatus, UserRole } from '@prisma/client';

export class BillingService {
  static async listInvoices(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    page = 1,
    limit = 20,
    filters: { patientId?: string; status?: InvoiceStatus } = {}
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId };

    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (!patient) {
        return { invoices: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.patientId = patient.id;
    } else if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              medicalRecordNumber: true,
              phone: true,
            },
          },
          lineItems: true,
          payments: true,
        },
      }),
    ]);

    return {
      invoices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getInvoiceById(
    hospitalId: string,
    id: string,
    currentUser: AuthenticatedUser
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, hospitalId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            phone: true,
            insuranceProvider: true,
          },
        },
        appointment: {
          select: {
            id: true,
            bookingId: true,
            appointmentDate: true,
            doctor: { select: { name: true, specialty: true } },
          },
        },
        lineItems: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice record not found');
    }

    if (
      currentUser.role === UserRole.PATIENT &&
      invoice.patient.userId !== currentUser.id
    ) {
      throw new ForbiddenError('Access denied: You may only view invoices issued to your account');
    }

    return invoice;
  }

  static async createInvoice(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    data: CreateInvoiceInput,
    ip?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, hospitalId },
    });
    if (!patient) {
      throw new NotFoundError('Patient record not found in this hospital');
    }

    // SERVER-SIDE TOTALS CALCULATION (Never trust client totals)
    let calculatedSubtotal = 0;
    const computedLineItems = data.lineItems.map((item) => {
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      calculatedSubtotal += lineTotal;
      return {
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: lineTotal,
      };
    });

    const taxAmount = Math.max(0, Math.round((data.tax || 0) * 100) / 100);
    const discountAmount = Math.max(0, Math.round((data.discount || 0) * 100) / 100);
    const calculatedTotal = Math.max(0, Math.round((calculatedSubtotal + taxAmount - discountAmount) * 100) / 100);

    // Generate unique invoice number: INV-YEAR-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { hospitalId } });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    const invoice = await prisma.$transaction(async (tx) => {
      return tx.invoice.create({
        data: {
          hospitalId,
          patientId: data.patientId,
          appointmentId: data.appointmentId || null,
          invoiceNumber,
          subtotal: calculatedSubtotal,
          tax: taxAmount,
          discount: discountAmount,
          total: calculatedTotal,
          status: InvoiceStatus.ISSUED,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          lineItems: {
            create: computedLineItems,
          },
        },
        include: {
          lineItems: true,
          patient: {
            select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true },
          },
        },
      });
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'INVOICE_CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber,
        patientId: data.patientId,
        total: calculatedTotal,
        lineItemCount: computedLineItems.length,
      },
      ipAddress: ip,
      userAgent,
    });

    return invoice;
  }

  static async recordPayment(
    hospitalId: string,
    invoiceId: string,
    currentUser: AuthenticatedUser,
    data: RecordPaymentInput,
    ip?: string,
    userAgent?: string
  ) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, hospitalId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice record not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestError('Invoice is already settled in full');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestError('Cannot post payment against a cancelled invoice');
    }

    const previousPayments = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const invoiceTotal = Number(invoice.total);
    const remainingBalance = Math.round((invoiceTotal - previousPayments) * 100) / 100;

    const paymentAmount = Math.round(data.amount * 100) / 100;

    if (paymentAmount > remainingBalance) {
      throw new BadRequestError(
        `Payment amount ($${paymentAmount}) exceeds the remaining invoice balance ($${remainingBalance})`
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          hospitalId,
          invoiceId,
          amount: paymentAmount,
          paymentMethod: data.paymentMethod,
          transactionRef: data.transactionRef || null,
        },
      });

      const newPaidTotal = previousPayments + paymentAmount;
      const nextStatus =
        newPaidTotal >= invoiceTotal ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: nextStatus },
      });

      return { payment, updatedInvoice };
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'PAYMENT_RECORD',
      entity: 'Payment',
      entityId: result.payment.id,
      details: {
        invoiceId,
        amount: paymentAmount,
        method: data.paymentMethod,
        invoiceStatus: result.updatedInvoice.status,
      },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }
}
