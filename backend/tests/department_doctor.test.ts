import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole } from '@prisma/client';
import { prisma } from '../src/db/prisma';

function createAdminToken() {
  return jwt.sign(
    {
      id: 'admin_1',
      hospitalId: 'hosp_test_1',
      email: 'admin@hospitalx.org',
      role: UserRole.HOSPITAL_ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Department & Doctor Operations Tests', () => {
  const app = createApp();
  const token = createAdminToken();

  it('rejects department creation when code already exists (409 Conflict)', async () => {
    vi.spyOn(prisma.department, 'findFirst').mockResolvedValue({
      id: 'dept_1',
      name: 'Cardiology',
      code: 'CARDIO',
      hospitalId: 'hosp_test_1',
    } as any);

    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cardiology Center',
        code: 'CARDIO',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('already exists');
  });

  it('rejects doctor creation when department is not found (404 Not Found)', async () => {
    vi.spyOn(prisma.department, 'findFirst').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/doctors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dr. John Watson',
        specialty: 'Trauma Surgery',
        licenseNumber: 'MD-99120',
        departmentId: 'dept_non_existent',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Selected department not found');
  });

  it('successfully updates doctor availability slots', async () => {
    const mockDoctor = { id: 'doc_1', hospitalId: 'hosp_test_1', name: 'Dr. Tony Stark' };
    vi.spyOn(prisma.doctor, 'findFirst').mockResolvedValue(mockDoctor as any);

    const mockAvailabilities = [
      { id: 'av_1', hospitalId: 'hosp_test_1', doctorId: 'doc_1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30, isActive: true },
    ];

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        doctorAvailability: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
          findMany: vi.fn().mockResolvedValue(mockAvailabilities),
        },
      };
      return cb(tx);
    });

    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .put('/api/v1/doctors/doc_1/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({
        availabilities: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30, isActive: true },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].startTime).toBe('09:00');
  });
});
