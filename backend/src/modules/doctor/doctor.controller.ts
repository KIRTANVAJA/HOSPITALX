import { Request, Response, NextFunction } from 'express';
import { DoctorService } from './doctor.service';
import { sendSuccess } from '../../utils/response';

export class DoctorController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const departmentId = req.query.departmentId as string | undefined;
      const search = req.query.search as string | undefined;
      const onlyActive = req.query.includeInactive !== 'true';

      const result = await DoctorService.listDoctors(
        req.user!.hospitalId,
        page,
        limit,
        departmentId,
        search,
        onlyActive
      );
      return sendSuccess(res, result.doctors, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorService.getDoctorById(req.user!.hospitalId, req.params.id);
      return sendSuccess(res, doctor);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await DoctorService.createDoctor(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Doctor created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await DoctorService.updateDoctor(
        req.user!.hospitalId,
        req.params.id,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Doctor profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const availability = await DoctorService.getDoctorAvailability(req.user!.hospitalId, req.params.id);
      return sendSuccess(res, availability);
    } catch (error) {
      next(error);
    }
  }

  static async setAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DoctorService.setDoctorAvailability(
        req.user!.hospitalId,
        req.params.id,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Doctor availability slots updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
