import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole } from '@prisma/client';
import { prisma } from '../src/db/prisma';

function createToken(role: UserRole, hospitalId: string = 'hosp_test_1', id: string = 'usr_1') {
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

describe('Role-Based Access Control & Tenant Isolation Tests', () => {
  const app = createApp();

  it('PATIENT role receives 403 Forbidden on administrative endpoints', async () => {
    const patientToken = createToken(UserRole.PATIENT);

    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Insufficient privileges');
  });

  it('DOCTOR role receives 403 Forbidden on hospital staff creation endpoint', async () => {
    const doctorToken = createToken(UserRole.DOCTOR);

    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        email: 'nurse@test.org',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'NURSE',
        employeeId: 'EMP-01',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('HOSPITAL_ADMIN has access to list departments in their hospital', async () => {
    const adminToken = createToken(UserRole.HOSPITAL_ADMIN);

    vi.spyOn(prisma.department, 'findMany').mockResolvedValue([
      { id: 'dept_1', name: 'Cardiology', code: 'CARDIO', hospitalId: 'hosp_test_1', isActive: true } as any,
    ]);

    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Cardiology');
  });

  it('Tenant Isolation: non-super-admin user cannot access another hospital scope', async () => {
    const adminToken = createToken(UserRole.HOSPITAL_ADMIN, 'hospital_A');

    // Attempting to query hospital_B with token belonging to hospital_A
    const res = await request(app)
      .get('/api/v1/hospitals/current?hospitalId=hospital_B')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Tenant isolation violation');
  });
});
