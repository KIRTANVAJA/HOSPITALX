import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import {
  UserRole,
  BedStatus,
  AdmissionStatus,
  LabOrderStatus,
  LabPriority,
  StockMovementType,
  AttendanceStatus,
  LeaveStatus,
  LeaveType,
} from '@prisma/client';
import { prisma } from '../src/db/prisma';

function createToken(role: UserRole, id = 'usr_test_1', hospitalId = 'hosp_test_1') {
  return jwt.sign(
    {
      id,
      hospitalId,
      email: `${role.toLowerCase()}@hospitalx.org`,
      role,
      firstName: 'Ops',
      lastName: 'Tester',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Hospital Operations: Staff Scheduling, Inpatient Beds, Laboratory & Pharmacy Tests', () => {
  const app = createApp();

  const adminToken = createToken(UserRole.HOSPITAL_ADMIN, 'usr_admin_1');
  const doctorToken = createToken(UserRole.DOCTOR, 'usr_doc_1');
  const nurseToken = createToken(UserRole.NURSE, 'usr_nurse_1');
  const labTechToken = createToken(UserRole.LAB_TECHNICIAN, 'usr_lab_1');
  const pharmacistToken = createToken(UserRole.PHARMACIST, 'usr_pharm_1');
  const patientToken = createToken(UserRole.PATIENT, 'usr_pat_1');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Staff Scheduling, Attendance & Leave
  // ---------------------------------------------------------------------------
  describe('Staff Scheduling & Leaves', () => {
    it('creates a staff shift with valid timing constraints', async () => {
      vi.spyOn(prisma.staffShift, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.staffShift, 'create').mockResolvedValue({
        id: 'shift_1',
        hospitalId: 'hosp_test_1',
        name: 'ICU Night Shift',
        startTime: '20:00',
        endTime: '08:00',
        color: '#176B68',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/staff/shifts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'ICU Night Shift',
          startTime: '20:00',
          endTime: '08:00',
          color: '#176B68',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('shift_1');
      expect(res.body.data.name).toBe('ICU Night Shift');
    });

    it('records employee clock-in and prevents duplicate clock-in on same date (409 Conflict)', async () => {
      vi.spyOn(prisma.staffProfile, 'findFirst').mockResolvedValue({
        id: 'sp_1',
        hospitalId: 'hosp_test_1',
        userId: 'usr_nurse_1',
      } as any);

      vi.spyOn(prisma.staffAttendance, 'findUnique').mockResolvedValue({
        id: 'att_1',
        staffProfileId: 'sp_1',
        date: '2026-10-15',
        status: AttendanceStatus.PRESENT,
      } as any);

      const res = await request(app)
        .post('/api/v1/staff/attendance/clock-in')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          staffProfileId: 'sp_1',
          date: '2026-10-15',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('already clocked in');
    });

    it('submits a leave request and approves it via administrative review', async () => {
      vi.spyOn(prisma.staffProfile, 'findFirst').mockResolvedValue({
        id: 'sp_1',
        hospitalId: 'hosp_test_1',
        userId: 'usr_nurse_1',
      } as any);

      vi.spyOn(prisma.staffLeaveRequest, 'create').mockResolvedValue({
        id: 'leave_1',
        hospitalId: 'hosp_test_1',
        staffProfileId: 'sp_1',
        leaveType: LeaveType.ANNUAL,
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        reason: 'Family annual leave',
        status: LeaveStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const submitRes = await request(app)
        .post('/api/v1/staff/leaves')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          staffProfileId: 'sp_1',
          leaveType: LeaveType.ANNUAL,
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          reason: 'Family annual leave',
        });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.data.status).toBe('PENDING');

      // Now review & approve
      vi.spyOn(prisma.staffLeaveRequest, 'findFirst').mockResolvedValue({
        id: 'leave_1',
        hospitalId: 'hosp_test_1',
        status: LeaveStatus.PENDING,
      } as any);

      vi.spyOn(prisma.staffLeaveRequest, 'update').mockResolvedValue({
        id: 'leave_1',
        status: LeaveStatus.APPROVED,
        reviewedById: 'usr_admin_1',
        reviewedAt: new Date(),
      } as any);

      const reviewRes = await request(app)
        .patch('/api/v1/staff/leaves/leave_1/review')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: LeaveStatus.APPROVED,
          reviewerNotes: 'Approved per department staffing quota.',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.data.status).toBe('APPROVED');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Inpatient Wards, Rooms & Bed Management
  // ---------------------------------------------------------------------------
  describe('Inpatient Wards & Bed Admissions', () => {
    it('admits patient to an AVAILABLE bed and marks bed as OCCUPIED (201 Created)', async () => {
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({ id: 'pat_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.bedAssignment, 'findFirst').mockResolvedValue(null); // not currently admitted

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          bed: {
            findFirst: vi.fn().mockResolvedValue({ id: 'bed_1', hospitalId: 'hosp_test_1', status: BedStatus.AVAILABLE }),
            update: vi.fn().mockResolvedValue({ id: 'bed_1', status: BedStatus.OCCUPIED }),
          },
          bedAssignment: {
            create: vi.fn().mockResolvedValue({
              id: 'assign_1',
              hospitalId: 'hosp_test_1',
              bedId: 'bed_1',
              patientId: 'pat_1',
              status: AdmissionStatus.ACTIVE,
              admissionReason: 'Post-operative recovery observation',
            }),
          },
        };
        return cb(tx);
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/inpatient/admissions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          bedId: 'bed_1',
          patientId: 'pat_1',
          admissionReason: 'Post-operative recovery observation',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('rejects admitting a patient when the bed is already OCCUPIED (409 Conflict)', async () => {
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({ id: 'pat_2', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.bedAssignment, 'findFirst').mockResolvedValue(null);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          bed: {
            findFirst: vi.fn().mockResolvedValue({ id: 'bed_occupied', hospitalId: 'hosp_test_1', status: BedStatus.OCCUPIED }),
          },
        };
        return cb(tx);
      });

      const res = await request(app)
        .post('/api/v1/inpatient/admissions')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({
          bedId: 'bed_occupied',
          patientId: 'pat_2',
          admissionReason: 'Acute admission',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('Bed is not available');
    });

    it('discharges patient, records discharge summary, and liberates the bed to AVAILABLE', async () => {
      vi.spyOn(prisma.bedAssignment, 'findFirst').mockResolvedValue({
        id: 'assign_1',
        hospitalId: 'hosp_test_1',
        bedId: 'bed_1',
        status: AdmissionStatus.ACTIVE,
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          bed: {
            update: vi.fn().mockResolvedValue({ id: 'bed_1', status: BedStatus.AVAILABLE }),
          },
          bedAssignment: {
            update: vi.fn().mockResolvedValue({
              id: 'assign_1',
              status: AdmissionStatus.DISCHARGED,
              dischargeSummary: 'Full clinical recovery achieved.',
            }),
          },
        };
        return cb(tx);
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .patch('/api/v1/inpatient/admissions/assign_1/discharge')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          dischargeSummary: 'Full clinical recovery achieved.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DISCHARGED');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Laboratory Management & Results
  // ---------------------------------------------------------------------------
  describe('Laboratory Management', () => {
    it('creates a lab test order with multiple diagnostic test line items (201 Created)', async () => {
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({ id: 'pat_1', hospitalId: 'hosp_test_1' } as any);
      vi.spyOn(prisma.labTest, 'findMany').mockResolvedValue([
        { id: 'test_cbc', hospitalId: 'hosp_test_1', name: 'Complete Blood Count', isActive: true },
        { id: 'test_lipid', hospitalId: 'hosp_test_1', name: 'Lipid Profile', isActive: true },
      ] as any);
      vi.spyOn(prisma.labOrder, 'count').mockResolvedValue(10);
      vi.spyOn(prisma.labOrder, 'create').mockResolvedValue({
        id: 'order_1',
        orderNumber: 'LAB-2026-00011',
        hospitalId: 'hosp_test_1',
        patientId: 'pat_1',
        priority: LabPriority.ROUTINE,
        status: LabOrderStatus.ORDERED,
        items: [
          { id: 'item_1', labTestId: 'test_cbc', status: 'PENDING' },
          { id: 'item_2', labTestId: 'test_lipid', status: 'PENDING' },
        ],
      } as any);
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/laboratory/orders')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId: 'pat_1',
          priority: LabPriority.ROUTINE,
          testIds: ['test_cbc', 'test_lipid'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.orderNumber).toBe('LAB-2026-00011');
      expect(res.body.data.status).toBe('ORDERED');
    });

    it('LAB_TECHNICIAN records test result and flags abnormal telemetry', async () => {
      vi.spyOn(prisma.labOrderItem, 'findUnique').mockResolvedValue({
        id: 'item_1',
        labOrderId: 'order_1',
        labOrder: { hospitalId: 'hosp_test_1' },
        labTest: { name: 'Blood Glucose Fasting' },
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          labOrderItem: {
            update: vi.fn().mockResolvedValue({
              id: 'item_1',
              resultValue: '185 mg/dL',
              isAbnormal: true,
              status: 'COMPLETED',
            }),
            count: vi.fn().mockResolvedValue(0), // all items completed
          },
          labOrder: {
            update: vi.fn().mockResolvedValue({ id: 'order_1', status: LabOrderStatus.COMPLETED }),
          },
        };
        return cb(tx);
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/laboratory/items/item_1/result')
        .set('Authorization', `Bearer ${labTechToken}`)
        .send({
          resultValue: '185 mg/dL',
          resultNotes: 'Fasting glucose significantly elevated above normal range 70-99 mg/dL',
          isAbnormal: true,
          status: 'COMPLETED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.resultValue).toBe('185 mg/dL');
      expect(res.body.data.isAbnormal).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Pharmacy & Inventory Management
  // ---------------------------------------------------------------------------
  describe('Pharmacy & Inventory Management', () => {
    it('creates a pharmacy batch and automatically records initial procurement stock receipt', async () => {
      vi.spyOn(prisma.pharmacyItem, 'findFirst').mockResolvedValue({
        id: 'med_1',
        hospitalId: 'hosp_test_1',
        name: 'Amoxicillin 500mg',
      } as any);
      vi.spyOn(prisma.pharmacyBatch, 'findUnique').mockResolvedValue(null);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          pharmacyBatch: {
            create: vi.fn().mockResolvedValue({
              id: 'batch_1',
              pharmacyItemId: 'med_1',
              batchNumber: 'AMX-2026-A1',
              quantity: 500,
              expiryDate: '2028-06-30',
            }),
          },
          stockMovement: {
            create: vi.fn().mockResolvedValue({
              id: 'move_1',
              movementType: StockMovementType.PURCHASE,
              quantity: 500,
            }),
          },
        };
        return cb(tx);
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/batches')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          pharmacyItemId: 'med_1',
          batchNumber: 'AMX-2026-A1',
          expiryDate: '2028-06-30',
          quantity: 500,
          unitCost: 0.45,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.batchNumber).toBe('AMX-2026-A1');
      expect(res.body.data.quantity).toBe(500);
    });

    it('rejects dispensing when requested quantity exceeds available batch balance (400 Bad Request)', async () => {
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({
        id: 'pat_1',
        hospitalId: 'hosp_test_1',
        medicalRecordNumber: 'MRN-1001',
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          pharmacyBatch: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'batch_low',
              hospitalId: 'hosp_test_1',
              pharmacyItemId: 'med_1',
              batchNumber: 'LOW-01',
              quantity: 5, // only 5 in stock
            }),
          },
        };
        return cb(tx);
      });

      const res = await request(app)
        .post('/api/v1/pharmacy/dispense')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          patientId: 'pat_1',
          items: [{ pharmacyItemId: 'med_1', batchId: 'batch_low', quantity: 30 }], // requests 30 > 5
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Insufficient quantity in batch');
    });

    it('successfully dispenses medication and deducts batch inventory safely', async () => {
      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({
        id: 'pat_1',
        hospitalId: 'hosp_test_1',
        medicalRecordNumber: 'MRN-1001',
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const tx = {
          pharmacyBatch: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'batch_ok',
              hospitalId: 'hosp_test_1',
              pharmacyItemId: 'med_1',
              batchNumber: 'OK-01',
              quantity: 100,
            }),
            update: vi.fn().mockResolvedValue({ id: 'batch_ok', quantity: 80 }),
          },
          stockMovement: {
            create: vi.fn().mockResolvedValue({ id: 'mov_dispense_1' }),
          },
          prescription: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return cb(tx);
      });
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/pharmacy/dispense')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          patientId: 'pat_1',
          prescriptionId: 'rx_101',
          items: [{ pharmacyItemId: 'med_1', batchId: 'batch_ok', quantity: 20 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dispensed).toBe(true);
    });
  });
});
