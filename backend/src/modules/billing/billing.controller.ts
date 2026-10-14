import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { sendSuccess } from '../../utils/response';
import { InvoiceStatus } from '@prisma/client';

export class BillingController {
  static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const patientId = req.query.patientId as string | undefined;
      const status = req.query.status as InvoiceStatus | undefined;

      const result = await BillingService.listInvoices(
        req.user!.hospitalId,
        req.user!,
        page,
        limit,
        { patientId, status }
      );
      return sendSuccess(res, result.invoices, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await BillingService.getInvoiceById(
        req.user!.hospitalId,
        req.params.id,
        req.user!
      );
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await BillingService.createInvoice(
        req.user!.hospitalId,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Invoice generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillingService.recordPayment(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Payment recorded and invoice balance updated', 201);
    } catch (error) {
      next(error);
    }
  }
}
