import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: PaginationMeta
) {
  return res.status(statusCode).json({
    success: true,
    message: message || undefined,
    data,
    meta: meta || undefined,
  });
}
