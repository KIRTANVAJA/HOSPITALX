import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole, AppointmentStatus, VisitType } from '@prisma/client';
import { prisma } from '../src/db/prisma';

function createToken(role: UserRole, id: string = 'usr_patient_1') {
  return jwt.sign(
    {
      id,
      hospitalId: 'hosp_test_1',
      email: 'patient@test.org',
      role,
      firstName: 'Alex',
      lastName: 'Morgan',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Appointment Booking & Concurrency Conflict Tests', () => {
  const app = createApp();
  const patientToken = createToken(UserRole.PATIENT);

  it('rejects booking when doctor already has a booking at that time slot (409 Conflict)', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        patient: {
          findFirst: vi.fn().mockResolvedValue({ id: 'pat_1', userId: 'usr_patient_1', hospitalId: 'hosp_test_1' }),
        },
        doctor: {
          findFirst: vi.fn().mockResolvedValue({ id: 'doc_1', hospitalId: 'hosp_test_1', name: 'Dr. Stephen Strange', isActive: true }),
        },
        department: {
          findFirst: vi.fn().mockResolvedValue({ id: 'dept_1', hospitalId: 'hosp_test_1', name: 'Neurology', isActive: true }),
        },
        appointment: {
          // CONFLICT DETECTED: Existing active appointment for this slot
          findFirst: vi.fn().mockResolvedValue({
            id: 'appt_existing_conflict',
            doctorId: 'doc_1',
            appointmentDate: '2026-10-20',
            startTime: '10:00',
            status: AppointmentStatus.CONFIRMED,
          }),
        },
      };
      return cb(tx);
    });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: 'doc_1',
        departmentId: 'dept_1',
        appointmentDate: '2026-10-20',
        startTime: '10:00',
        visitType: 'IN_PERSON',
        reason: 'Severe migraine headache follow-up',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Schedule conflict');
  });

  it('successfully books appointment when time slot is clear (201 Created)', async () => {
    const mockCreatedAppt = {
      id: 'appt_new_1',
      bookingId: 'WC-2026-4491',
      hospitalId: 'hosp_test_1',
      patientId: 'pat_1',
      doctorId: 'doc_1',
      departmentId: 'dept_1',
      appointmentDate: '2026-10-20',
      startTime: '11:00',
      endTime: '11:30',
      visitType: VisitType.IN_PERSON,
      status: AppointmentStatus.PENDING,
      doctor: { id: 'doc_1', name: 'Dr. Stephen Strange', specialty: 'Neurology' },
      patient: { id: 'pat_1', firstName: 'Alex', lastName: 'Morgan', phone: '555-0199' },
      department: { id: 'dept_1', name: 'Neurology' },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        patient: {
          findFirst: vi.fn().mockResolvedValue({ id: 'pat_1', userId: 'usr_patient_1', hospitalId: 'hosp_test_1' }),
        },
        doctor: {
          findFirst: vi.fn().mockResolvedValue({ id: 'doc_1', hospitalId: 'hosp_test_1', name: 'Dr. Stephen Strange', isActive: true }),
        },
        department: {
          findFirst: vi.fn().mockResolvedValue({ id: 'dept_1', hospitalId: 'hosp_test_1', name: 'Neurology', isActive: true }),
        },
        appointment: {
          findFirst: vi.fn().mockResolvedValue(null), // NO CONFLICT
          create: vi.fn().mockResolvedValue(mockCreatedAppt),
        },
      };
      return cb(tx);
    });

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: 'doc_1',
        departmentId: 'dept_1',
        appointmentDate: '2026-10-20',
        startTime: '11:00',
        visitType: 'IN_PERSON',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toBe('WC-2026-4491');
    expect(res.body.data.status).toBe('PENDING');
  });

  it('cancels appointment with cancellation reason', async () => {
    vi.spyOn(prisma.appointment, 'findFirst').mockResolvedValue({
      id: 'appt_new_1',
      hospitalId: 'hosp_test_1',
      patientId: 'pat_1',
      bookingId: 'WC-2026-4491',
      status: AppointmentStatus.PENDING,
    } as any);

    vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({
      id: 'pat_1',
      userId: 'usr_patient_1',
      hospitalId: 'hosp_test_1',
    } as any);

    vi.spyOn(prisma.appointment, 'update').mockResolvedValue({
      id: 'appt_new_1',
      bookingId: 'WC-2026-4491',
      status: AppointmentStatus.CANCELLED,
      cancellationReason: 'Patient travel conflict',
    } as any);

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .patch('/api/v1/appointments/appt_new_1/cancel')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        cancellationReason: 'Patient travel conflict',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('reschedules appointment successfully when new slot is clear', async () => {
    const mockExistingAppt = {
      id: 'appt_resched_1',
      bookingId: 'WC-2026-8888',
      hospitalId: 'hosp_test_1',
      patientId: 'pat_1',
      doctorId: 'doc_1',
      appointmentDate: '2026-10-20',
      startTime: '10:00',
      status: AppointmentStatus.CONFIRMED,
      doctor: { id: 'doc_1', name: 'Dr. Stephen Strange' },
    };

    const mockUpdatedAppt = {
      ...mockExistingAppt,
      appointmentDate: '2026-10-22',
      startTime: '14:00',
      endTime: '14:30',
      notes: 'Reschedule note: Schedule adjustment',
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        appointment: {
          findFirst: vi.fn()
            .mockResolvedValueOnce(mockExistingAppt) // find existing
            .mockResolvedValueOnce(null), // slot conflict check: returns null (clear)
          update: vi.fn().mockResolvedValue(mockUpdatedAppt),
        },
        patient: {
          findFirst: vi.fn().mockResolvedValue({ id: 'pat_1', userId: 'usr_patient_1' }),
        },
      };
      return cb(tx);
    });

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .patch('/api/v1/appointments/appt_resched_1/reschedule')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentDate: '2026-10-22',
        startTime: '14:00',
        reason: 'Schedule adjustment',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentDate).toBe('2026-10-22');
    expect(res.body.data.startTime).toBe('14:00');
  });

  it('rejects rescheduling when target slot is already booked by another appointment (409 Conflict)', async () => {
    const mockExistingAppt = {
      id: 'appt_resched_1',
      bookingId: 'WC-2026-8888',
      hospitalId: 'hosp_test_1',
      patientId: 'pat_1',
      doctorId: 'doc_1',
      appointmentDate: '2026-10-20',
      startTime: '10:00',
      status: AppointmentStatus.CONFIRMED,
      doctor: { id: 'doc_1', name: 'Dr. Stephen Strange' },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        appointment: {
          findFirst: vi.fn()
            .mockResolvedValueOnce(mockExistingAppt) // find existing
            .mockResolvedValueOnce({ id: 'appt_collision', startTime: '14:00' }), // slot conflict detected
        },
        patient: {
          findFirst: vi.fn().mockResolvedValue({ id: 'pat_1', userId: 'usr_patient_1' }),
        },
      };
      return cb(tx);
    });

    const res = await request(app)
      .patch('/api/v1/appointments/appt_resched_1/reschedule')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentDate: '2026-10-22',
        startTime: '14:00',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Schedule conflict');
  });

  it('rejects rescheduling when appointment is already cancelled (400 Bad Request)', async () => {
    const mockCancelledAppt = {
      id: 'appt_resched_1',
      bookingId: 'WC-2026-8888',
      hospitalId: 'hosp_test_1',
      patientId: 'pat_1',
      doctorId: 'doc_1',
      status: AppointmentStatus.CANCELLED,
      doctor: { id: 'doc_1', name: 'Dr. Stephen Strange' },
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        appointment: {
          findFirst: vi.fn().mockResolvedValue(mockCancelledAppt),
        },
      };
      return cb(tx);
    });

    const res = await request(app)
      .patch('/api/v1/appointments/appt_resched_1/reschedule')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentDate: '2026-10-22',
        startTime: '14:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Cannot reschedule');
  });
});

