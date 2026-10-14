import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import {
  CreateDoctorInput,
  UpdateDoctorInput,
  SetDoctorAvailabilityInput,
} from './doctor.schema';
import { recordAuditEvent } from '../../services/audit.service';

export class DoctorService {
  static async listDoctors(
    hospitalId: string,
    page: number = 1,
    limit: number = 20,
    departmentId?: string,
    search?: string,
    onlyActive: boolean = true
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      ...(onlyActive && { isActive: true }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { specialty: { contains: search } },
        ],
      }),
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          availabilities: {
            where: { isActive: true },
            select: { dayOfWeek: true, startTime: true, endTime: true, slotDurationMinutes: true },
          },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return {
      doctors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getDoctorById(hospitalId: string, doctorId: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, hospitalId },
      include: {
        department: true,
        availabilities: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found in this hospital');
    }

    return doctor;
  }

  static async createDoctor(
    hospitalId: string,
    userId: string,
    input: CreateDoctorInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Verify department exists in this hospital
    const department = await prisma.department.findFirst({
      where: { id: input.departmentId, hospitalId },
    });

    if (!department) {
      throw new NotFoundError('Selected department not found in this hospital');
    }

    // 2. Check unique license number in hospital
    const existingLicense = await prisma.doctor.findUnique({
      where: {
        hospitalId_licenseNumber: {
          hospitalId,
          licenseNumber: input.licenseNumber.trim(),
        },
      },
    });

    if (existingLicense) {
      throw new ConflictError(`Doctor with license number "${input.licenseNumber}" already exists in this hospital`);
    }

    const doctor = await prisma.doctor.create({
      data: {
        hospitalId,
        departmentId: input.departmentId,
        userId: input.userId || null,
        name: input.name.trim(),
        specialty: input.specialty.trim(),
        licenseNumber: input.licenseNumber.trim(),
        qualification: input.qualification?.trim() || null,
        bio: input.bio?.trim() || null,
        consultationFee: input.consultationFee || null,
      },
      include: { department: true },
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'DOCTOR_CREATE',
      entity: 'Doctor',
      entityId: doctor.id,
      ipAddress,
      userAgent,
      details: { name: doctor.name, specialty: doctor.specialty, licenseNumber: doctor.licenseNumber },
    });

    return doctor;
  }

  static async updateDoctor(
    hospitalId: string,
    doctorId: string,
    userId: string,
    input: UpdateDoctorInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.doctor.findFirst({
      where: { id: doctorId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Doctor not found in this hospital');
    }

    if (input.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: input.departmentId, hospitalId },
      });
      if (!dept) {
        throw new NotFoundError('Selected department not found in this hospital');
      }
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.departmentId && { departmentId: input.departmentId }),
        ...(input.specialty && { specialty: input.specialty.trim() }),
        ...(input.qualification !== undefined && { qualification: input.qualification?.trim() || null }),
        ...(input.bio !== undefined && { bio: input.bio?.trim() || null }),
        ...(input.consultationFee !== undefined && { consultationFee: input.consultationFee }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: { department: true },
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'DOCTOR_UPDATE',
      entity: 'Doctor',
      entityId: doctorId,
      ipAddress,
      userAgent,
      details: input,
    });

    return updated;
  }

  static async getDoctorAvailability(hospitalId: string, doctorId: string) {
    await this.getDoctorById(hospitalId, doctorId);

    return prisma.doctorAvailability.findMany({
      where: { doctorId, hospitalId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  static async setDoctorAvailability(
    hospitalId: string,
    doctorId: string,
    userId: string,
    input: SetDoctorAvailabilityInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.getDoctorById(hospitalId, doctorId);

    // Atomically replace existing availabilities
    const result = await prisma.$transaction(async (tx) => {
      await tx.doctorAvailability.deleteMany({
        where: { doctorId, hospitalId },
      });

      if (input.availabilities.length === 0) {
        return [];
      }

      await tx.doctorAvailability.createMany({
        data: input.availabilities.map((slot) => ({
          hospitalId,
          doctorId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDurationMinutes: slot.slotDurationMinutes,
          isActive: slot.isActive,
        })),
      });

      return tx.doctorAvailability.findMany({
        where: { doctorId, hospitalId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'DOCTOR_AVAILABILITY_UPDATE',
      entity: 'DoctorAvailability',
      entityId: doctorId,
      ipAddress,
      userAgent,
      details: { totalSlots: input.availabilities.length },
    });

    return result;
  }
}
