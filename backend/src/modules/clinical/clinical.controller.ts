import { Request, Response, NextFunction } from 'express';
import { ClinicalService } from './clinical.service';
import { sendSuccess } from '../../utils/response';
import { PrescriptionStatus } from '@prisma/client';

export class ClinicalController {
  // Consultations
  static async listConsultations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const patientId = req.query.patientId as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;

      const result = await ClinicalService.listConsultations(
        req.user!.hospitalId,
        req.user!,
        page,
        limit,
        { patientId, doctorId }
      );
      return sendSuccess(res, result.consultations, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getConsultationById(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ClinicalService.getConsultationById(
        req.user!.hospitalId,
        req.params.id,
        req.user!
      );
      return sendSuccess(res, consultation);
    } catch (error) {
      next(error);
    }
  }

  static async createConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await ClinicalService.createConsultation(
        req.user!.hospitalId,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Clinical consultation record established', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await ClinicalService.updateConsultation(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Consultation record updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async finalizeConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const finalized = await ClinicalService.finalizeConsultation(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, finalized, 'Consultation finalized and locked against edits');
    } catch (error) {
      next(error);
    }
  }

  // Prescriptions
  static async listPrescriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const patientId = req.query.patientId as string | undefined;
      const status = req.query.status as PrescriptionStatus | undefined;

      const result = await ClinicalService.listPrescriptions(
        req.user!.hospitalId,
        req.user!,
        page,
        limit,
        { patientId, status }
      );
      return sendSuccess(res, result.prescriptions, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async createPrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await ClinicalService.createPrescription(
        req.user!.hospitalId,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Prescription orders authored and dispatched', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updatePrescriptionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await ClinicalService.updatePrescriptionStatus(
        req.user!.hospitalId,
        req.params.id,
        req.body.status,
        req.user!,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Prescription status updated');
    } catch (error) {
      next(error);
    }
  }

  // Medical Reports
  static async listMedicalReports(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const patientId = req.query.patientId as string | undefined;

      const result = await ClinicalService.listMedicalReports(
        req.user!.hospitalId,
        req.user!,
        page,
        limit,
        { patientId }
      );
      return sendSuccess(res, result.reports, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async createMedicalReport(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await ClinicalService.createMedicalReport(
        req.user!.hospitalId,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Diagnostic report recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
