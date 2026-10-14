import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Log internal prisma errors safely
// @ts-ignore
prisma.$on('error', (e: any) => {
  logger.error('[Prisma Database Error]', e);
});

// @ts-ignore
prisma.$on('warn', (e: any) => {
  logger.warn('[Prisma Database Warning]', e);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Quick raw heartbeat query without exposing connection details
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connectivity check failed', error);
    return false;
  }
}
