import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { sendSuccess } from '../../utils/response';

export class AdminController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await AdminService.getDashboardMetrics(req.user!.hospitalId);
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const action = req.query.action as string | undefined;
      const entity = req.query.entity as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await AdminService.getAuditLogs(req.user!.hospitalId, page, limit, {
        action,
        entity,
        startDate,
        endDate,
      });

      return sendSuccess(res, result.logs, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
