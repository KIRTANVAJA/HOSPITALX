import { Request, Response, NextFunction } from 'express';
import { LaboratoryService } from './laboratory.service';
import { sendSuccess } from '../../utils/response';
import { LabOrderStatus } from '@prisma/client';

export class LaboratoryController {
  // Tests Catalogue
  static async listTests(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const tests = await LaboratoryService.listTests(req.user!.hospitalId, category);
      return sendSuccess(res, tests);
    } catch (error) {
      next(error);
    }
  }

  static async createTest(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await LaboratoryService.createTest(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, test, 'Diagnostic test registered in catalogue', 201);
    } catch (error) {
      next(error);
    }
  }

  // Lab Orders
  static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const status = req.query.status as LabOrderStatus | undefined;

      const result = await LaboratoryService.listOrders(
        req.user!.hospitalId,
        req.user!,
        page,
        limit,
        { patientId, doctorId, status }
      );
      return sendSuccess(res, result.orders, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await LaboratoryService.getOrderById(
        req.user!.hospitalId,
        req.params.id,
        req.user!
      );
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await LaboratoryService.createOrder(
        req.user!.hospitalId,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, order, 'Laboratory test order dispatched', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await LaboratoryService.updateOrderStatus(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Lab order workflow status updated');
    } catch (error) {
      next(error);
    }
  }

  static async recordItemResult(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LaboratoryService.recordItemResult(
        req.user!.hospitalId,
        req.user!.id,
        req.params.itemId,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Diagnostic test result recorded and verified');
    } catch (error) {
      next(error);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await LaboratoryService.getLabMetrics(req.user!.hospitalId);
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}
