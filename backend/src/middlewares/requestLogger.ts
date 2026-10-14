import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const ip = req.ip || req.socket.remoteAddress || '-';

    logger.info(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms (IP: ${ip})`);
  });

  next();
}
