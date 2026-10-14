import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './db/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`HospitalX Backend API server successfully started on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful shutdown handling
let isShuttingDown = false;

async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown of HospitalX backend...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database connection pool cleanly closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnect', err);
      process.exit(1);
    }
  });

  // Force close if graceful termination exceeds 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing process exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception occurred:', err);
  handleShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection occurred:', reason);
});
