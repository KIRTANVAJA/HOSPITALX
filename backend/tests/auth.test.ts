import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole, UserStatus } from '@prisma/client';

describe('Authentication & Authorization Tests', () => {
  const app = createApp();

  it('rejects access to protected routes without a token (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Authentication required');
  });

  it('rejects access with an invalid/tampered token (401 Unauthorized)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.tampered.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects login with invalid email or missing password (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details).toBeDefined();
  });

  it('authenticates valid credentials and never exposes passwordHash', async () => {
    const mockPassword = 'SecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(mockPassword, salt);

    const mockUser = {
      id: 'usr_test_1',
      hospitalId: 'hosp_test_1',
      email: 'doctor@hospitalx.org',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Bennett',
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      phone: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      hospital: { id: 'hosp_test_1', code: 'HOSP-01', name: 'Test Hospital' },
    };

    vi.spyOn(prisma.hospital, 'findUnique').mockResolvedValue(mockUser.hospital as any);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    vi.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor@hospitalx.org', password: mockPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('doctor@hospitalx.org');
    expect(res.body.data.user.role).toBe('DOCTOR');
    // Ensure password hash is NEVER leaked in response
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify token can be decoded
    const decoded = jwt.verify(res.body.data.token, env.JWT_SECRET) as any;
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.hospitalId).toBe(mockUser.hospitalId);
  });
});
