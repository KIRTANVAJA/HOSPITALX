import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole } from '@prisma/client';
import { prisma } from '../src/db/prisma';

function createToken(role: UserRole, id: string = 'usr_1', hospitalId: string = 'hosp_test_1') {
  return jwt.sign(
    {
      id,
      hospitalId,
      email: `${role.toLowerCase()}@test.org`,
      role,
      firstName: 'Test',
      lastName: 'User',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Patient Data Access Restrictions Tests', () => {
  const app = createApp();

  it('PATIENT role receives 403 Forbidden when requesting full patient directory', async () => {
    const patientToken = createToken(UserRole.PATIENT);

    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('PATIENT cannot view another patient profile (403 Forbidden)', async () => {
    const patientToken = createToken(UserRole.PATIENT, 'user_patient_A');

    // Mock patient profile belonging to user_patient_B
    vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({
      id: 'patient_record_B',
      userId: 'user_patient_B',
      hospitalId: 'hosp_test_1',
      firstName: 'Bob',
      lastName: 'Smith',
      medicalRecordNumber: 'MRN-999',
    } as any);

    const res = await request(app)
      .get('/api/v1/patients/patient_record_B')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Patients can only inspect their own');
  });

  it('RECEPTIONIST role can successfully query patient list', async () => {
    const receptionistToken = createToken(UserRole.RECEPTIONIST);

    vi.spyOn(prisma.patient, 'findMany').mockResolvedValue([
      {
        id: 'pat_1',
        medicalRecordNumber: 'MRN-2026-1234',
        firstName: 'Alice',
        lastName: 'Walker',
        phone: '555-1234',
        email: 'alice@test.org',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        insuranceProvider: 'BlueCross',
        createdAt: new Date(),
      } as any,
    ]);
    vi.spyOn(prisma.patient, 'count').mockResolvedValue(1);

    const res = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].medicalRecordNumber).toBe('MRN-2026-1234');
  });
});
