import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './appointment.service';
import { sendSuccess } from '../../utils/response';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const doctorId = req.query.doctorId as string | undefined;
      const patientId = req.query.patientId as string | undefined;
      const status = req.query.status as AppointmentStatus | undefined;
      const date = req.query.date as string | undefined;

      const result = await AppointmentService.listAppointments(
        req.user!.hospitalId,
        req.user!,
        page,
        limit,
        { doctorId, patientId, status, date }
      );
      return sendSuccess(res, result.appointments, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentService.getAppointmentById(
        req.user!.hospitalId,
        req.params.id,
        req.user!
      );
      return sendSuccess(res, appointment);
    } catch (error) {
      next(error);
    }
  }

  static async book(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await AppointmentService.bookAppointment(
        req.user!.hospitalId,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, created, 'Appointment successfully booked', 201);
    } catch (error) {
      next(error);
    }
  }

  static async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await AppointmentService.rescheduleAppointment(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, 'Appointment rescheduled successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const cancelled = await AppointmentService.cancelAppointment(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, cancelled, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await AppointmentService.updateStatus(
        req.user!.hospitalId,
        req.params.id,
        req.user!,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, updated, `Appointment status updated to ${updated.status}`);
    } catch (error) {
      next(error);
    }
  }
}
