import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import * as prismaModule from '../src/db/prisma';

describe('Application Startup & Health Endpoints', () => {
  const app = createApp();

  it('GET /health returns healthy status when database is reachable', async () => {
    vi.spyOn(prismaModule, 'checkDatabaseConnection').mockResolvedValue(true);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services.database).toBe('connected');
    expect(res.body.version).toBe('1.0.0');
    // Ensure no credentials or internal details are leaked
    expect(res.body.databaseUrl).toBeUndefined();
    expect(res.body.password).toBeUndefined();
  });

  it('GET /api/v1/health returns degraded 503 status when database is unreachable', async () => {
    vi.spyOn(prismaModule, 'checkDatabaseConnection').mockResolvedValue(false);

    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.database).toBe('disconnected');
    // Ensure no internal stack trace leaked
    expect(res.body.stack).toBeUndefined();
  });

  it('GET /api/v1/non-existent returns 404 with consistent JSON error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.statusCode).toBe(404);
    expect(res.body.error.message).toContain('Endpoint not found');
  });

  it('POST with malformed JSON body returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": "broken-json, ');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Malformed JSON');
  });

  it('maps Prisma P2002 unique constraint error to 409 Conflict', async () => {
    const { errorHandler } = await import('../src/middlewares/errorHandler');
    const { Prisma } = await import('@prisma/client');

    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.4.1',
      meta: { target: ['email'] },
    });

    const mockReq: any = { method: 'POST', originalUrl: '/api/v1/auth/register' };
    const mockRes: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    errorHandler(prismaError, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          statusCode: 409,
          message: expect.stringContaining('Conflict error'),
        }),
      })
    );
  });

  it('maps Prisma P2025 not found error to 404 Not Found', async () => {
    const { errorHandler } = await import('../src/middlewares/errorHandler');
    const { Prisma } = await import('@prisma/client');

    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.4.1',
    });

    const mockReq: any = { method: 'GET', originalUrl: '/api/v1/doctors/doc_999' };
    const mockRes: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    errorHandler(prismaError, mockReq, mockRes, next);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          statusCode: 404,
          message: 'Requested record not found in database',
        }),
      })
    );
  });
});

