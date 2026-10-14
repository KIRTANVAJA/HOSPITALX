import { Request, Response, NextFunction } from 'express';
import { InpatientService } from './inpatient.service';
import { sendSuccess } from '../../utils/response';
import { BedStatus } from '@prisma/client';

export class InpatientController {
  // Wards
  static async listWards(req: Request, res: Response, next: NextFunction) {
    try {
      const wards = await InpatientService.listWards(req.user!.hospitalId);
      return sendSuccess(res, wards);
    } catch (error) {
      next(error);
    }
  }

  static async createWard(req: Request, res: Response, next: NextFunction) {
    try {
      const ward = await InpatientService.createWard(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, ward, 'Hospital ward created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Rooms
  static async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const wardId = req.query.wardId as string | undefined;
      const rooms = await InpatientService.listRooms(req.user!.hospitalId, wardId);
      return sendSuccess(res, rooms);
    } catch (error) {
      next(error);
    }
  }

  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await InpatientService.createRoom(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, room, 'Inpatient room registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Beds
  static async listBeds(req: Request, res: Response, next: NextFunction) {
    try {
      const wardId = req.query.wardId as string | undefined;
      const roomId = req.query.roomId as string | undefined;
      const status = req.query.status as BedStatus | undefined;

      const beds = await InpatientService.listBeds(req.user!.hospitalId, {
        wardId,
        roomId,
        status,
      });
      return sendSuccess(res, beds);
    } catch (error) {
      next(error);
    }
  }

  static async createBed(req: Request, res: Response, next: NextFunction) {
    try {
      const bed = await InpatientService.createBed(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, bed, 'Bed configured successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateBedStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await InpatientService.updateBedStatus(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Bed status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Patient Admissions, Transfers & Discharges
  static async admitPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await InpatientService.admitPatient(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, admission, 'Patient successfully admitted and assigned to bed', 201);
    } catch (error) {
      next(error);
    }
  }

  static async transferPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const transferred = await InpatientService.transferPatient(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, transferred, 'Patient transferred to target bed');
    } catch (error) {
      next(error);
    }
  }

  static async dischargePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const discharged = await InpatientService.dischargePatient(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, discharged, 'Patient discharged and bed liberated');
    } catch (error) {
      next(error);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await InpatientService.getInpatientMetrics(req.user!.hospitalId);
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}
