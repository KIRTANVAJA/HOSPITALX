import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import {
  CreateStaffInput,
  UpdateStaffInput,
  UpdateStaffStatusInput,
  CreateStaffShiftInput,
  AssignScheduleInput,
  StaffClockInInput,
  StaffClockOutInput,
  SubmitLeaveRequestInput,
  ReviewLeaveRequestInput,
} from './staff.schema';
import { recordAuditEvent } from '../../services/audit.service';
import {
  UserRole,
  EmployeeCategory,
  EmploymentStatus,
  ShiftStatus,
  AttendanceStatus,
  LeaveStatus,
} from '@prisma/client';

export class StaffService {
  static async listStaff(
    hospitalId: string,
    page: number = 1,
    limit: number = 20,
    filters: { role?: UserRole; category?: EmployeeCategory; status?: EmploymentStatus } = {}
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      ...(filters.role ? { role: filters.role } : { role: { not: UserRole.PATIENT } }),
    };

    if (filters.category || filters.status) {
      where.staffProfile = {
        ...(filters.category ? { employeeCategory: filters.category } : {}),
        ...(filters.status ? { employmentStatus: filters.status } : {}),
      };
    }

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          phone: true,
          createdAt: true,
          lastLoginAt: true,
          staffProfile: {
            select: {
              id: true,
              employeeId: true,
              department: true,
              jobTitle: true,
              employeeCategory: true,
              employmentStatus: true,
              joiningDate: true,
              salary: true,
              emergencyContact: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      staff,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createStaff(
    hospitalId: string,
    actorId: string,
    input: CreateStaffInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const cleanEmail = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: {
        hospitalId_email: {
          hospitalId,
          email: cleanEmail,
        },
      },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists in this hospital');
    }

    const existingEmployeeId = await prisma.staffProfile.findUnique({
      where: {
        hospitalId_employeeId: {
          hospitalId,
          employeeId: input.employeeId,
        },
      },
    });

    if (existingEmployeeId) {
      throw new ConflictError(`Employee ID "${input.employeeId}" is already assigned in this hospital`);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newStaff = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          hospitalId,
          email: cleanEmail,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: input.role,
          phone: input.phone || null,
        },
      });

      const profile = await tx.staffProfile.create({
        data: {
          hospitalId,
          userId: user.id,
          employeeId: input.employeeId.trim(),
          employeeCategory: input.employeeCategory,
          employmentStatus: input.employmentStatus,
          department: input.department || null,
          jobTitle: input.jobTitle || null,
          phone: input.phone || null,
          joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
          salary: input.salary !== undefined ? input.salary : null,
          emergencyContact: input.emergencyContact || null,
        },
      });

      return { user, profile };
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'STAFF_CREATE',
      entity: 'StaffProfile',
      entityId: newStaff.profile.id,
      details: {
        userId: newStaff.user.id,
        email: cleanEmail,
        employeeId: input.employeeId,
        role: input.role,
        category: input.employeeCategory,
      },
      ipAddress,
      userAgent,
    });

    return {
      id: newStaff.user.id,
      email: newStaff.user.email,
      firstName: newStaff.user.firstName,
      lastName: newStaff.user.lastName,
      role: newStaff.user.role,
      status: newStaff.user.status,
      phone: newStaff.user.phone,
      staffProfile: {
        id: newStaff.profile.id,
        employeeId: newStaff.profile.employeeId,
        department: newStaff.profile.department,
        jobTitle: newStaff.profile.jobTitle,
        employeeCategory: newStaff.profile.employeeCategory,
        employmentStatus: newStaff.profile.employmentStatus,
      },
    };
  }

  static async updateStaff(
    hospitalId: string,
    actorId: string,
    userId: string,
    input: UpdateStaffInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, hospitalId },
      include: { staffProfile: true },
    });

    if (!existing) {
      throw new NotFoundError('Staff user not found in this hospital');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: input.firstName?.trim() ?? existing.firstName,
          lastName: input.lastName?.trim() ?? existing.lastName,
          phone: input.phone !== undefined ? input.phone : existing.phone,
          role: input.role ?? existing.role,
        },
      });

      let profile = existing.staffProfile;
      if (profile) {
        profile = await tx.staffProfile.update({
          where: { id: profile.id },
          data: {
            department: input.department !== undefined ? input.department : profile.department,
            jobTitle: input.jobTitle !== undefined ? input.jobTitle : profile.jobTitle,
            employeeCategory: input.employeeCategory ?? profile.employeeCategory,
            employmentStatus: input.employmentStatus ?? profile.employmentStatus,
            salary: input.salary !== undefined ? input.salary : profile.salary,
            emergencyContact: input.emergencyContact !== undefined ? input.emergencyContact : profile.emergencyContact,
          },
        });
      }

      return { user, profile };
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'STAFF_UPDATE',
      entity: 'StaffProfile',
      entityId: updated.profile?.id || userId,
      details: { updatedFields: Object.keys(input) },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  static async updateStaffStatus(
    hospitalId: string,
    actorId: string,
    userId: string,
    input: UpdateStaffStatusInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.user.findFirst({
      where: { id: userId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Staff user not found in this hospital');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: input.status },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'STAFF_STATUS_UPDATE',
      entity: 'User',
      entityId: userId,
      details: { previousStatus: existing.status, newStatus: input.status },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Staff Shifts & Schedules
  // ---------------------------------------------------------------------------

  static async listShifts(hospitalId: string) {
    return prisma.staffShift.findMany({
      where: { hospitalId, isActive: true },
      orderBy: { startTime: 'asc' },
    });
  }

  static async createShift(
    hospitalId: string,
    actorId: string,
    input: CreateStaffShiftInput,
    ip?: string,
    userAgent?: string
  ) {
    const existing = await prisma.staffShift.findUnique({
      where: { hospitalId_name: { hospitalId, name: input.name } },
    });
    if (existing) {
      throw new ConflictError(`Shift "${input.name}" already exists in this hospital`);
    }

    const shift = await prisma.staffShift.create({
      data: {
        hospitalId,
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        color: input.color || '#176B68',
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'STAFF_SHIFT_CREATE',
      entity: 'StaffShift',
      entityId: shift.id,
      details: { name: shift.name, time: `${shift.startTime}-${shift.endTime}` },
      ipAddress: ip,
      userAgent,
    });

    return shift;
  }

  static async listSchedules(
    hospitalId: string,
    filters: { date?: string; staffProfileId?: string; shiftId?: string } = {}
  ) {
    const where: any = { hospitalId };
    if (filters.date) where.date = filters.date;
    if (filters.staffProfileId) where.staffProfileId = filters.staffProfileId;
    if (filters.shiftId) where.shiftId = filters.shiftId;

    return prisma.staffSchedule.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        shift: true,
        staffProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
          },
        },
      },
    });
  }

  static async assignSchedule(
    hospitalId: string,
    actorId: string,
    input: AssignScheduleInput,
    ip?: string,
    userAgent?: string
  ) {
    const profile = await prisma.staffProfile.findFirst({
      where: { id: input.staffProfileId, hospitalId },
    });
    if (!profile) {
      throw new NotFoundError('Staff profile not found in this hospital');
    }

    const shift = await prisma.staffShift.findFirst({
      where: { id: input.shiftId, hospitalId },
    });
    if (!shift) {
      throw new NotFoundError('Shift not found in this hospital');
    }

    const existingAssignment = await prisma.staffSchedule.findUnique({
      where: {
        staffProfileId_date_shiftId: {
          staffProfileId: input.staffProfileId,
          date: input.date,
          shiftId: input.shiftId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictError('Employee is already assigned to this shift on the specified date');
    }

    const schedule = await prisma.staffSchedule.create({
      data: {
        hospitalId,
        staffProfileId: input.staffProfileId,
        shiftId: input.shiftId,
        date: input.date,
        status: input.status,
        notes: input.notes || null,
      },
      include: {
        shift: true,
        staffProfile: {
          include: { user: { select: { firstName: true, lastName: true, role: true } } },
        },
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'STAFF_SCHEDULE_ASSIGN',
      entity: 'StaffSchedule',
      entityId: schedule.id,
      details: { staffProfileId: input.staffProfileId, date: input.date, shift: shift.name },
      ipAddress: ip,
      userAgent,
    });

    return schedule;
  }

  // ---------------------------------------------------------------------------
  // Attendance & Time Tracking
  // ---------------------------------------------------------------------------

  static async listAttendances(
    hospitalId: string,
    filters: { date?: string; staffProfileId?: string } = {}
  ) {
    const where: any = { hospitalId };
    if (filters.date) where.date = filters.date;
    if (filters.staffProfileId) where.staffProfileId = filters.staffProfileId;

    return prisma.staffAttendance.findMany({
      where,
      orderBy: { checkInTime: 'desc' },
      include: {
        staffProfile: {
          include: { user: { select: { firstName: true, lastName: true, role: true } } },
        },
      },
    });
  }

  static async clockIn(hospitalId: string, input: StaffClockInInput, ip?: string, userAgent?: string) {
    const profile = await prisma.staffProfile.findFirst({
      where: { id: input.staffProfileId, hospitalId },
    });
    if (!profile) throw new NotFoundError('Staff profile not found');

    const existing = await prisma.staffAttendance.findUnique({
      where: { staffProfileId_date: { staffProfileId: input.staffProfileId, date: input.date } },
    });
    if (existing) {
      throw new ConflictError('Staff attendance already clocked in for this date');
    }

    const now = new Date();
    const attendance = await prisma.staffAttendance.create({
      data: {
        hospitalId,
        staffProfileId: input.staffProfileId,
        date: input.date,
        checkInTime: now,
        status: AttendanceStatus.PRESENT,
        notes: input.notes || null,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: profile.userId,
      action: 'STAFF_ATTENDANCE_CLOCK_IN',
      entity: 'StaffAttendance',
      entityId: attendance.id,
      details: { staffProfileId: input.staffProfileId, date: input.date, time: now.toISOString() },
      ipAddress: ip,
      userAgent,
    });

    return attendance;
  }

  static async clockOut(
    hospitalId: string,
    attendanceId: string,
    input: StaffClockOutInput,
    ip?: string,
    userAgent?: string
  ) {
    const existing = await prisma.staffAttendance.findFirst({
      where: { id: attendanceId, hospitalId },
    });
    if (!existing) throw new NotFoundError('Attendance record not found');
    if (existing.checkOutTime) {
      throw new BadRequestError('Attendance record is already clocked out');
    }

    const now = new Date();
    const updated = await prisma.staffAttendance.update({
      where: { id: attendanceId },
      data: {
        checkOutTime: now,
        notes: input.notes ? `${existing.notes || ''}\nOut: ${input.notes}`.trim() : existing.notes,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: existing.staffProfileId,
      action: 'STAFF_ATTENDANCE_CLOCK_OUT',
      entity: 'StaffAttendance',
      entityId: attendanceId,
      details: { time: now.toISOString() },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Leave Requests & Approvals
  // ---------------------------------------------------------------------------

  static async listLeaveRequests(
    hospitalId: string,
    filters: { status?: LeaveStatus; staffProfileId?: string } = {}
  ) {
    const where: any = { hospitalId };
    if (filters.status) where.status = filters.status;
    if (filters.staffProfileId) where.staffProfileId = filters.staffProfileId;

    return prisma.staffLeaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        staffProfile: {
          include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        },
      },
    });
  }

  static async submitLeaveRequest(
    hospitalId: string,
    actorId: string,
    input: SubmitLeaveRequestInput,
    ip?: string,
    userAgent?: string
  ) {
    const profile = await prisma.staffProfile.findFirst({
      where: { id: input.staffProfileId, hospitalId },
    });
    if (!profile) throw new NotFoundError('Staff profile not found in this hospital');

    if (input.startDate > input.endDate) {
      throw new BadRequestError('Leave start date cannot be after end date');
    }

    const leave = await prisma.staffLeaveRequest.create({
      data: {
        hospitalId,
        staffProfileId: input.staffProfileId,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason.trim(),
        status: LeaveStatus.PENDING,
      },
      include: {
        staffProfile: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'STAFF_LEAVE_SUBMIT',
      entity: 'StaffLeaveRequest',
      entityId: leave.id,
      details: { staffProfileId: input.staffProfileId, type: input.leaveType, dates: `${input.startDate} to ${input.endDate}` },
      ipAddress: ip,
      userAgent,
    });

    return leave;
  }

  static async reviewLeaveRequest(
    hospitalId: string,
    reviewerId: string,
    leaveId: string,
    input: ReviewLeaveRequestInput,
    ip?: string,
    userAgent?: string
  ) {
    const existing = await prisma.staffLeaveRequest.findFirst({
      where: { id: leaveId, hospitalId },
    });
    if (!existing) throw new NotFoundError('Leave request not found');

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestError(`Cannot review leave request that is already ${existing.status}`);
    }

    const updated = await prisma.staffLeaveRequest.update({
      where: { id: leaveId },
      data: {
        status: input.status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewerNotes: input.reviewerNotes || null,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: reviewerId,
      action: 'STAFF_LEAVE_REVIEW',
      entity: 'StaffLeaveRequest',
      entityId: leaveId,
      details: { decision: input.status, reviewerNotes: input.reviewerNotes },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // HR Analytics & Roster Metrics
  // ---------------------------------------------------------------------------

  static async getHRMetrics(hospitalId: string) {
    const [totalEmployees, categoryCounts, pendingLeaves, todaysAttendances] = await Promise.all([
      prisma.staffProfile.count({ where: { hospitalId } }),
      prisma.staffProfile.groupBy({
        by: ['employeeCategory'],
        where: { hospitalId },
        _count: { id: true },
      }),
      prisma.staffLeaveRequest.count({
        where: { hospitalId, status: LeaveStatus.PENDING },
      }),
      prisma.staffAttendance.count({
        where: {
          hospitalId,
          date: new Date().toISOString().split('T')[0],
        },
      }),
    ]);

    const categoriesMap: Record<string, number> = {};
    categoryCounts.forEach((c) => {
      categoriesMap[c.employeeCategory] = c._count.id;
    });

    return {
      totalEmployees,
      categories: categoriesMap,
      pendingLeaves,
      todaysAttendances,
    };
  }
}
