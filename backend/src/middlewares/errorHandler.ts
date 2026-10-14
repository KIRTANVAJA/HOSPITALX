import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = 'An unexpected server error occurred';
  let details: any = undefined;

  // 1. Custom Application Error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // 2. Prisma Database Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
      message = `Conflict error: Unique constraint failed on field(s): ${target || 'unique record'}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record not found in database';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed: Related entity does not exist';
    } else {
      statusCode = 400;
      message = `Database query error (Code ${err.code})`;
    }
  }
  // 3. Body Parser Syntax Error (malformed JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
  }
  // 4. Fallback unknown error
  else if (err.message) {
    logger.error(`[Unhandled Exception] ${req.method} ${req.originalUrl}:`, err);
    if (env.NODE_ENV !== 'production') {
      message = err.message;
    }
  }

  // Safe request logging (no credentials or PII)
  if (statusCode >= 500) {
    logger.error(`[HTTP ${statusCode}] ${req.method} ${req.originalUrl} - ${message}`);
  } else {
    logger.warn(`[HTTP ${statusCode}] ${req.method} ${req.originalUrl} - ${message}`);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: details || undefined,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
