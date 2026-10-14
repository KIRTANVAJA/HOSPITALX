import { prisma } from '../../db/prisma';
import { AppointmentStatus } from '@prisma/client';

export class AdminService {
  static async getDashboardMetrics(hospitalId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
      totalPatients,
      totalDoctors,
      totalDepartments,
      totalStaff,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.appointment.count({ where: { hospitalId } }),
      prisma.appointment.count({ where: { hospitalId, status: AppointmentStatus.PENDING } }),
      prisma.appointment.count({ where: { hospitalId, status: AppointmentStatus.CONFIRMED } }),
      prisma.appointment.count({ where: { hospitalId, status: AppointmentStatus.COMPLETED } }),
      prisma.appointment.count({ where: { hospitalId, status: AppointmentStatus.CANCELLED } }),
      prisma.appointment.count({ where: { hospitalId, appointmentDate: today } }),
      prisma.patient.count({ where: { hospitalId, isActive: true } }),
      prisma.doctor.count({ where: { hospitalId, isActive: true } }),
      prisma.department.count({ where: { hospitalId, isActive: true } }),
      prisma.staffProfile.count({ where: { hospitalId } }),
      prisma.auditLog.findMany({
        where: { hospitalId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      }),
    ]);

    return {
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        today: todayAppointments,
      },
      resources: {
        patients: totalPatients,
        doctors: totalDoctors,
        departments: totalDepartments,
        staff: totalStaff,
      },
      recentActivity: recentAuditLogs,
    };
  }

  static async getAuditLogs(
    hospitalId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      action?: string;
      entity?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      ...(filters?.action && { action: filters.action }),
      ...(filters?.entity && { entity: filters.entity }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
