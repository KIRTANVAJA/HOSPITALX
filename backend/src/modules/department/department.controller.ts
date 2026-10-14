import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { sendSuccess } from '../../utils/response';

export class DepartmentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const onlyActive = req.query.includeInactive !== 'true';
      const departments = await DepartmentService.listDepartments(req.user!.hospitalId, onlyActive);
      return sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await DepartmentService.createDepartment(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Department created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await DepartmentService.updateDepartment(
        req.user!.hospitalId,
        req.params.id,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Department updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await DepartmentService.updateStatus(
        req.user!.hospitalId,
        req.params.id,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Department status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
