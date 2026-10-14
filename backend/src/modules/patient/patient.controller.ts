import { Request, Response, NextFunction } from 'express';
import { PatientService } from './patient.service';
import { sendSuccess } from '../../utils/response';

export class PatientController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string | undefined;

      const result = await PatientService.listPatients(req.user!.hospitalId, page, limit, search);
      return sendSuccess(res, result.patients, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.getPatientById(req.user!.hospitalId, req.params.id, req.user!);
      return sendSuccess(res, patient);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await PatientService.createPatientByStaff(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Patient registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await PatientService.updatePatient(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Patient details updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
