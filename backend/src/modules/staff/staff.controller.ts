import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { sendSuccess } from '../../utils/response';
import { UserRole, EmployeeCategory, EmploymentStatus, LeaveStatus } from '@prisma/client';

export class StaffController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const role = req.query.role as UserRole | undefined;
      const category = req.query.category as EmployeeCategory | undefined;
      const status = req.query.status as EmploymentStatus | undefined;

      const result = await StaffService.listStaff(req.user!.hospitalId, page, limit, {
        role,
        category,
        status,
      });
      return sendSuccess(res, result.staff, 'Staff members retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.createStaff(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Hospital employee account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.updateStaff(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Staff member details updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.updateStaffStatus(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Staff account status updated');
    } catch (error) {
      next(error);
    }
  }

  // Shifts
  static async listShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.listShifts(req.user!.hospitalId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createShift(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.createShift(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Staff shift created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Schedules
  static async listSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const staffProfileId = req.query.staffProfileId as string | undefined;
      const shiftId = req.query.shiftId as string | undefined;

      const result = await StaffService.listSchedules(req.user!.hospitalId, {
        date,
        staffProfileId,
        shiftId,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async assignSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.assignSchedule(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Staff assigned to schedule successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Attendance
  static async listAttendances(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const staffProfileId = req.query.staffProfileId as string | undefined;

      const result = await StaffService.listAttendances(req.user!.hospitalId, {
        date,
        staffProfileId,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.clockIn(
        req.user!.hospitalId,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Clock-in recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.clockOut(
        req.user!.hospitalId,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Clock-out recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  // Leave Requests
  static async listLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as LeaveStatus | undefined;
      const staffProfileId = req.query.staffProfileId as string | undefined;

      const result = await StaffService.listLeaveRequests(req.user!.hospitalId, {
        status,
        staffProfileId,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async submitLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.submitLeaveRequest(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Leave request submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async reviewLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.reviewLeaveRequest(
        req.user!.hospitalId,
        req.user!.id,
        req.params.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, `Leave request has been ${req.body.status.toLowerCase()}`);
    } catch (error) {
      next(error);
    }
  }

  // HR Metrics
  static async getHRMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.getHRMetrics(req.user!.hospitalId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
