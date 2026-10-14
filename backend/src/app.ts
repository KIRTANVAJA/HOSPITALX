import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './utils/errors';
import { checkDatabaseConnection } from './db/prisma';

// Import module routers
import { authRoutes } from './modules/auth/auth.routes';
import { hospitalRoutes } from './modules/hospital/hospital.routes';
import { staffRoutes } from './modules/staff/staff.routes';
import { departmentRoutes } from './modules/department/department.routes';
import { doctorRoutes } from './modules/doctor/doctor.routes';
import { patientRoutes } from './modules/patient/patient.routes';
import { appointmentRoutes } from './modules/appointment/appointment.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { clinicalRoutes } from './modules/clinical/clinical.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { notificationRoutes } from './modules/notification/notification.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { inpatientRoutes } from './modules/inpatient/inpatient.routes';
import { laboratoryRoutes } from './modules/laboratory/laboratory.routes';
import { pharmacyRoutes } from './modules/pharmacy/pharmacy.routes';

export function createApp() {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS with Credentials
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or test runners)
        if (!origin) return callback(null, true);
        if (origin === env.CORS_ORIGIN || env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body & Cookie Parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // 4. Safe Request Logging
  app.use(requestLogger);

  // 5. Global API Rate Limiter
  app.use('/api/', apiRateLimiter);

  // 6. Secure Health Check Endpoint (never exposes credentials, hostnames, or stack traces)
  const healthHandler = async (_req: Request, res: Response) => {
    const isDbConnected = await checkDatabaseConnection();
    const statusCode = isDbConnected ? 200 : 503;

    return res.status(statusCode).json({
      status: isDbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: isDbConnected ? 'connected' : 'disconnected',
      },
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // 7. Core REST API Endpoints (/api/v1)
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/hospitals', hospitalRoutes);
  apiRouter.use('/staff', staffRoutes);
  apiRouter.use('/departments', departmentRoutes);
  apiRouter.use('/doctors', doctorRoutes);
  apiRouter.use('/patients', patientRoutes);
  apiRouter.use('/appointments', appointmentRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/clinical', clinicalRoutes);
  apiRouter.use('/billing', billingRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/ai', aiRoutes);
  apiRouter.use('/inpatient', inpatientRoutes);
  apiRouter.use('/laboratory', laboratoryRoutes);
  apiRouter.use('/pharmacy', pharmacyRoutes);

  app.use('/api/v1', apiRouter);

  // 8. 404 Catch-All Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint not found: [${req.method}] ${req.originalUrl}`));
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
