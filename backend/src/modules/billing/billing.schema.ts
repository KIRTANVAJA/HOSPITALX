import { z } from 'zod';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  dueDate: z.string().optional(),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'Invoice must include at least one billable line item'),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.INSURANCE,
    PaymentMethod.BANK_TRANSFER,
  ]),
  transactionRef: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum([
    InvoiceStatus.DRAFT,
    InvoiceStatus.ISSUED,
    InvoiceStatus.PAID,
    InvoiceStatus.PARTIAL,
    InvoiceStatus.CANCELLED,
  ]),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
