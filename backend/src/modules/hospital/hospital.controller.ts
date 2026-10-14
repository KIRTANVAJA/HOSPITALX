import { Request, Response, NextFunction } from 'express';
import { HospitalService } from './hospital.service';
import { sendSuccess } from '../../utils/response';

export class HospitalController {
  static async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const hospital = await HospitalService.getCurrentHospital(req.user!.hospitalId);
      return sendSuccess(res, hospital);
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await HospitalService.updateSettings(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Hospital settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
