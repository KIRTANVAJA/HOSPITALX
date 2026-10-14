import { prisma } from '../../db/prisma';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import {
  BookAppointmentInput,
  RescheduleAppointmentInput,
  CancelAppointmentInput,
  UpdateAppointmentStatusInput,
} from './appointment.schema';
import { recordAuditEvent } from '../../services/audit.service';
import { UserRole, AppointmentStatus, VisitType } from '@prisma/client';
import { AuthUser } from '../../middlewares/auth';

export class AppointmentService {
  /**
   * Helper to calculate default end time (+30 minutes) if not supplied
   */
  private static calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map((num) => parseInt(num, 10));
    const totalMinutes = hours * 60 + minutes + 30;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  static async listAppointments(
    hospitalId: string,
    currentUser: AuthUser,
    page: number = 1,
    limit: number = 20,
    filters?: {
      doctorId?: string;
      patientId?: string;
      status?: AppointmentStatus;
      date?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.date && { appointmentDate: filters.date }),
    };

    // Role-based visibility enforcement
    if (currentUser.role === UserRole.PATIENT) {
      // Find patient profile for this user
      const patient = await prisma.patient.findFirst({
        where: { userId: currentUser.id, hospitalId },
      });
      if (!patient) {
        return { appointments: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.patientId = patient.id;
    } else if (currentUser.role === UserRole.DOCTOR) {
      // Doctor views their own appointments unless doctorId filter is specified by permitted staff
      const doctor = await prisma.doctor.findFirst({
        where: { userId: currentUser.id, hospitalId },
      });
      if (doctor) {
        where.doctorId = doctor.id;
      } else if (filters?.doctorId) {
        where.doctorId = filters.doctorId;
      }
    } else {
      // Staff / Admin can filter by doctor or patient
      if (filters?.doctorId) where.doctorId = filters.doctorId;
      if (filters?.patientId) where.patientId = filters.patientId;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
        include: {
          doctor: {
            select: { id: true, name: true, specialty: true, consultationFee: true },
          },
          patient: {
            select: { id: true, firstName: true, lastName: true, phone: true, medicalRecordNumber: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getAppointmentById(hospitalId: string, appointmentId: string, currentUser: AuthUser) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
      include: {
        doctor: true,
        patient: true,
        department: true,
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found in this hospital');
    }

    // Role visibility check
    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { userId: currentUser.id, hospitalId },
      });
      if (!patient || appointment.patientId !== patient.id) {
        throw new ForbiddenError('Access denied: You can only view your own appointments');
      }
    }

    return appointment;
  }

  /**
   * Concurrency-safe appointment booking with double-booking prevention
   */
  static async bookAppointment(
    hospitalId: string,
    currentUser: AuthUser,
    input: BookAppointmentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const endTime = input.endTime || this.calculateEndTime(input.startTime);

    // Concurrency-safe atomic transaction
    const appointment = await prisma.$transaction(async (tx) => {
      // 1. Resolve Patient ID
      let patientId = input.patientId;

      if (currentUser.role === UserRole.PATIENT) {
        const patientProfile = await tx.patient.findFirst({
          where: { userId: currentUser.id, hospitalId },
        });

        if (!patientProfile) {
          throw new NotFoundError('Patient profile not found for this account. Please register patient details first.');
        }
        patientId = patientProfile.id;
      } else {
        if (!patientId) {
          throw new BadRequestError('Patient ID is required when booking as clinical staff');
        }
        const verifiedPatient = await tx.patient.findFirst({
          where: { id: patientId, hospitalId },
        });
        if (!verifiedPatient) {
          throw new NotFoundError('Selected patient not found in this hospital');
        }
      }

      // 2. Verify Doctor & Department belong to this hospital
      const doctor = await tx.doctor.findFirst({
        where: { id: input.doctorId, hospitalId, isActive: true },
      });
      if (!doctor) {
        throw new NotFoundError('Doctor not found or inactive in this hospital');
      }

      const department = await tx.department.findFirst({
        where: { id: input.departmentId, hospitalId, isActive: true },
      });
      if (!department) {
        throw new NotFoundError('Department not found or inactive in this hospital');
      }

      // 3. CONCURRENCY-SAFE DOUBLE-BOOKING CHECK:
      // Verify no active appointment exists for this doctor on the date & time slot
      const existingConflict = await tx.appointment.findFirst({
        where: {
          hospitalId,
          doctorId: input.doctorId,
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        },
      });

      if (existingConflict) {
        throw new ConflictError(
          `Schedule conflict: Dr. ${doctor.name} is already booked at ${input.startTime} on ${input.appointmentDate}. Please choose another time slot.`
        );
      }

      // 4. Generate unique Booking ID (e.g. WC-2026-9812)
      const bookingId = `WC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 5. Create Appointment
      return tx.appointment.create({
        data: {
          hospitalId,
          bookingId,
          patientId,
          doctorId: input.doctorId,
          departmentId: input.departmentId,
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          endTime,
          visitType: input.visitType || VisitType.IN_PERSON,
          status: AppointmentStatus.PENDING,
          reason: input.reason?.trim() || null,
        },
        include: {
          doctor: { select: { id: true, name: true, specialty: true } },
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          department: { select: { id: true, name: true } },
        },
      });
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'APPOINTMENT_BOOK',
      entity: 'Appointment',
      entityId: appointment.id,
      ipAddress,
      userAgent,
      details: {
        bookingId: appointment.bookingId,
        doctor: appointment.doctor.name,
        date: appointment.appointmentDate,
        time: appointment.startTime,
      },
    });

    return appointment;
  }

  /**
   * Reschedule an appointment with conflict verification
   */
  static async rescheduleAppointment(
    hospitalId: string,
    appointmentId: string,
    currentUser: AuthUser,
    input: RescheduleAppointmentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const endTime = input.endTime || this.calculateEndTime(input.startTime);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: { id: appointmentId, hospitalId },
        include: { doctor: true },
      });

      if (!existing) {
        throw new NotFoundError('Appointment not found');
      }

      if (existing.status === AppointmentStatus.COMPLETED || existing.status === AppointmentStatus.CANCELLED) {
        throw new BadRequestError(`Cannot reschedule an appointment that is already ${existing.status.toLowerCase()}`);
      }

      // If patient role, check ownership
      if (currentUser.role === UserRole.PATIENT) {
        const patient = await tx.patient.findFirst({
          where: { userId: currentUser.id, hospitalId },
        });
        if (!patient || existing.patientId !== patient.id) {
          throw new ForbiddenError('Access denied: You can only reschedule your own appointments');
        }
      }

      // Double-booking check on the NEW slot (excluding this appointment)
      const slotConflict = await tx.appointment.findFirst({
        where: {
          hospitalId,
          doctorId: existing.doctorId,
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          id: { not: appointmentId },
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        },
      });

      if (slotConflict) {
        throw new ConflictError(
          `Schedule conflict: Dr. ${existing.doctor.name} is already booked at ${input.startTime} on ${input.appointmentDate}.`
        );
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: {
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          endTime,
          notes: input.reason ? `Reschedule note: ${input.reason}` : existing.notes,
        },
        include: { doctor: true, patient: true, department: true },
      });
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'APPOINTMENT_RESCHEDULE',
      entity: 'Appointment',
      entityId: appointmentId,
      ipAddress,
      userAgent,
      details: {
        bookingId: updated.bookingId,
        newDate: input.appointmentDate,
        newTime: input.startTime,
      },
    });

    return updated;
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(
    hospitalId: string,
    appointmentId: string,
    currentUser: AuthUser,
    input: CancelAppointmentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Appointment not found');
    }

    if (existing.status === AppointmentStatus.COMPLETED || existing.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestError(`Appointment is already marked as ${existing.status.toLowerCase()}`);
    }

    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { userId: currentUser.id, hospitalId },
      });
      if (!patient || existing.patientId !== patient.id) {
        throw new ForbiddenError('Access denied: You can only cancel your own appointments');
      }
    }

    const cancelled = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: input.cancellationReason.trim(),
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'APPOINTMENT_CANCEL',
      entity: 'Appointment',
      entityId: appointmentId,
      ipAddress,
      userAgent,
      details: { bookingId: existing.bookingId, reason: input.cancellationReason },
    });

    return cancelled;
  }

  /**
   * Update status (Approve, Complete, No-Show)
   */
  static async updateStatus(
    hospitalId: string,
    appointmentId: string,
    currentUser: AuthUser,
    input: UpdateAppointmentStatusInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Appointment not found');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: input.status,
        ...(input.notes && { notes: input.notes.trim() }),
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'APPOINTMENT_STATUS_CHANGE',
      entity: 'Appointment',
      entityId: appointmentId,
      ipAddress,
      userAgent,
      details: { bookingId: existing.bookingId, newStatus: input.status },
    });

    return updated;
  }
}
