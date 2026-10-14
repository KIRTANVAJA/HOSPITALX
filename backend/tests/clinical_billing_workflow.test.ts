import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import {
  UserRole,
  ConsultationStatus,
  PrescriptionStatus,
  InvoiceStatus,
  PaymentMethod,
} from '@prisma/client';
import { prisma } from '../src/db/prisma';

function createToken(role: UserRole, id = 'usr_test_1', hospitalId = 'hosp_test_1') {
  return jwt.sign(
    {
      id,
      hospitalId,
      email: `${role.toLowerCase()}@hospitalx.org`,
      role,
      firstName: 'Clinical',
      lastName: 'Tester',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Clinical Records, Prescriptions, Billing & AI Workflow Tests', () => {
  const app = createApp();

  const doctorToken = createToken(UserRole.DOCTOR, 'usr_doc_1');
  const patientToken = createToken(UserRole.PATIENT, 'usr_pat_1');
  const billingToken = createToken(UserRole.BILLING, 'usr_bill_1');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Clinical Consultations & EHR Rules
  // ---------------------------------------------------------------------------
  describe('Clinical Consultations', () => {
    it('PATIENT role receives 403 Forbidden when attempting to author a clinical consultation', async () => {
      const res = await request(app)
        .post('/api/v1/clinical/consultations')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: 'pat_1',
          diagnosis: 'Acute Bronchitis',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Insufficient privileges');
    });

    it('DOCTOR role successfully establishes a consultation record in DRAFT status (201 Created)', async () => {
      vi.spyOn(prisma.doctor, 'findFirst').mockResolvedValue({
        id: 'doc_1',
        hospitalId: 'hosp_test_1',
        name: 'Dr. Stephen Strange',
      } as any);

      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({
        id: 'pat_1',
        hospitalId: 'hosp_test_1',
        firstName: 'Alex',
        lastName: 'Morgan',
      } as any);

      vi.spyOn(prisma.consultation, 'create').mockResolvedValue({
        id: 'cons_1',
        hospitalId: 'hosp_test_1',
        patientId: 'pat_1',
        doctorId: 'doc_1',
        diagnosis: 'Essential Hypertension',
        symptoms: 'Occasional morning headaches',
        status: ConsultationStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctor: { id: 'doc_1', name: 'Dr. Stephen Strange', specialty: 'Cardiology' },
        patient: { id: 'pat_1', firstName: 'Alex', lastName: 'Morgan', medicalRecordNumber: 'MRN-1001' },
      } as any);

      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/clinical/consultations')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: 'pat_1',
          diagnosis: 'Essential Hypertension',
          symptoms: 'Occasional morning headaches',
          vitalSigns: { bp: '142/90', heartRate: 78 },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('cons_1');
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('rejects modifications when consultation is already FINALIZED (400 Bad Request)', async () => {
      vi.spyOn(prisma.consultation, 'findFirst').mockResolvedValue({
        id: 'cons_locked',
        hospitalId: 'hosp_test_1',
        status: ConsultationStatus.FINALIZED,
        diagnosis: 'Locked Diagnosis',
      } as any);

      const res = await request(app)
        .patch('/api/v1/clinical/consultations/cons_locked')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          diagnosis: 'Illegal Alteration Attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Finalized consultation records are immutable');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Prescriptions Management
  // ---------------------------------------------------------------------------
  describe('Prescriptions', () => {
    it('PATIENT role receives 403 Forbidden when attempting to issue prescriptions', async () => {
      const res = await request(app)
        .post('/api/v1/clinical/prescriptions')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: 'pat_1',
          medications: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days' }],
        });

      expect(res.status).toBe(403);
    });

    it('DOCTOR successfully creates structured prescription orders', async () => {
      vi.spyOn(prisma.doctor, 'findFirst').mockResolvedValue({ id: 'doc_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({ id: 'pat_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.prescription, 'create').mockResolvedValue({
        id: 'rx_101',
        hospitalId: 'hosp_test_1',
        patientId: 'pat_1',
        doctorId: 'doc_1',
        medications: JSON.stringify([{ name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days' }]),
        status: PrescriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctor: { id: 'doc_1', name: 'Dr. Strange', specialty: 'Cardiology' },
        patient: { id: 'pat_1', firstName: 'Alex', lastName: 'Morgan', medicalRecordNumber: 'MRN-1001' },
      } as any);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/clinical/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: 'pat_1',
          medications: [{ name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days' }],
          notes: 'Take with full glass of water in the morning.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('rx_101');
      expect(res.body.data.status).toBe('ACTIVE');
    });
  });

  // ---------------------------------------------------------------------------
  // 2.5 Medical Reports
  // ---------------------------------------------------------------------------
  describe('Medical Reports', () => {
    it('DOCTOR registers a diagnostic imaging report with valid metadata (201 Created)', async () => {
      vi.spyOn(prisma.doctor, 'findFirst').mockResolvedValue({ id: 'doc_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({ id: 'pat_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.medicalReport, 'create').mockResolvedValue({
        id: 'rep_1',
        hospitalId: 'hosp_test_1',
        patientId: 'pat_1',
        doctorId: 'doc_1',
        title: 'Chest Radiograph X-Ray PA View',
        reportType: 'RADIOLOGY',
        fileUrl: 'https://vault.hospitalx.internal/reports/hosp_test_1/pat_1/cxr-2026.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048576,
        summary: 'Clear bilateral lung fields. No active cardiopulmonary lesions detected.',
        createdAt: new Date(),
        patient: { id: 'pat_1', firstName: 'Alex', lastName: 'Morgan', medicalRecordNumber: 'MRN-1001' },
        doctor: { id: 'doc_1', name: 'Dr. Strange', specialty: 'Radiology' },
      } as any);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/clinical/reports')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: 'pat_1',
          title: 'Chest Radiograph X-Ray PA View',
          reportType: 'RADIOLOGY',
          fileUrl: 'https://vault.hospitalx.internal/reports/hosp_test_1/pat_1/cxr-2026.pdf',
          mimeType: 'application/pdf',
          fileSize: 2048576,
          summary: 'Clear bilateral lung fields. No active cardiopulmonary lesions detected.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('rep_1');
      expect(res.body.data.reportType).toBe('RADIOLOGY');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Billing & Server-Side Math Calculation
  // ---------------------------------------------------------------------------
  describe('Billing & Financials', () => {
    it('PATIENT role receives 403 Forbidden when creating invoices', async () => {
      const res = await request(app)
        .post('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patientId: 'pat_1',
          lineItems: [{ description: 'Office Consultation', quantity: 1, unitPrice: 150 }],
        });

      expect(res.status).toBe(403);
    });

    it('BILLING staff creates invoice with exact server-side computed totals (never trusts frontend totals)', async () => {
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({ id: 'pat_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.invoice, 'count').mockResolvedValue(42);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          invoice: {
            create: vi.fn().mockImplementation((args: any) => {
              return {
                id: 'inv_43',
                invoiceNumber: args.data.invoiceNumber,
                subtotal: args.data.subtotal,
                tax: args.data.tax,
                discount: args.data.discount,
                total: args.data.total,
                status: InvoiceStatus.ISSUED,
                lineItems: args.data.lineItems.create,
                patient: { id: 'pat_1', firstName: 'Alex', lastName: 'Morgan', medicalRecordNumber: 'MRN-1001' },
              };
            }),
          },
        };
        return cb(tx);
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      // Line items: (2 * 125.50 = 251.00) + (1 * 50.00 = 50.00) => Subtotal: 301.00
      // Tax: 15.00, Discount: 10.00 => Total: 306.00
      const res = await request(app)
        .post('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${billingToken}`)
        .send({
          patientId: 'pat_1',
          tax: 15,
          discount: 10,
          lineItems: [
            { description: 'Specialist Consultation', quantity: 2, unitPrice: 125.5 },
            { description: 'Electrocardiogram (ECG)', quantity: 1, unitPrice: 50.0 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.subtotal).toBe(301.0);
      expect(res.body.data.total).toBe(306.0);
      expect(res.body.data.invoiceNumber).toBe('INV-2026-00043');
    });

    it('rejects recording payments that exceed remaining balance (400 Bad Request)', async () => {
      vi.spyOn(prisma.invoice, 'findFirst').mockResolvedValue({
        id: 'inv_1',
        hospitalId: 'hosp_test_1',
        total: 100.0,
        status: InvoiceStatus.ISSUED,
        payments: [{ amount: 40.0 }], // 60.00 remaining
      } as any);

      const res = await request(app)
        .post('/api/v1/billing/invoices/inv_1/payments')
        .set('Authorization', `Bearer ${billingToken}`)
        .send({
          amount: 80.0, // 80 > 60 remaining balance
          paymentMethod: PaymentMethod.CARD,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds the remaining invoice balance');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. In-App Notifications
  // ---------------------------------------------------------------------------
  describe('In-App Notifications', () => {
    it('retrieves user notifications and unread tally', async () => {
      vi.spyOn(prisma.notification, 'count')
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(2); // unread
      vi.spyOn(prisma.notification, 'findMany').mockResolvedValue([
        {
          id: 'notif_1',
          title: 'Appointment Confirmed',
          message: 'Your consultation with Dr. Strange is confirmed.',
          isRead: false,
          createdAt: new Date(),
        },
      ] as any);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
      expect(res.body.data.notifications.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. AI-Assisted Clinical Documentation Synthesis
  // ---------------------------------------------------------------------------
  describe('AI-Assisted Summarization', () => {
    it('generates a transparent clinical summary with required safety disclaimer and review flag', async () => {
      const res = await request(app)
        .post('/api/v1/ai/summarize-consultation')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          diagnosis: 'Type 2 Diabetes Mellitus',
          symptoms: 'Polydipsia, polyuria, blurred vision',
          examinationNotes: 'BMI 29.4, bilateral pedal pulses intact',
          vitalSigns: { bp: '130/84', heartRate: 72 },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.aiGenerated).toBe(true);
      expect(res.body.data.requiresPhysicianReview).toBe(true);
      expect(res.body.data.disclaimer).toContain('Clinical Decision Support');
      expect(res.body.data.summary).toContain('Type 2 Diabetes Mellitus');
    });
  });
});
