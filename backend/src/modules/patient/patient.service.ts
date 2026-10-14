import { prisma } from '../../db/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreatePatientByStaffInput, UpdatePatientInput } from './patient.schema';
import { recordAuditEvent } from '../../services/audit.service';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../../middlewares/auth';

export class PatientService {
  static async listPatients(
    hospitalId: string,
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { phone: { contains: search } },
          { medicalRecordNumber: { contains: search } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          medicalRecordNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          gender: true,
          bloodGroup: true,
          insuranceProvider: true,
          createdAt: true,
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      patients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPatientById(hospitalId: string, patientId: string, currentUser: AuthUser) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId },
      include: {
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 5,
          include: {
            doctor: { select: { id: true, name: true, specialty: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient record not found in this hospital');
    }

    // Role check: If patient role, they can only view their own patient profile
    if (currentUser.role === UserRole.PATIENT && patient.userId !== currentUser.id) {
      throw new ForbiddenError('Access denied: Patients can only inspect their own personal medical record');
    }

    return patient;
  }

  static async createPatientByStaff(
    hospitalId: string,
    actorId: string,
    input: CreatePatientByStaffInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const mrn = `MRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const patient = await prisma.patient.create({
      data: {
        hospitalId,
        medicalRecordNumber: mrn,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email?.toLowerCase().trim() || null,
        phone: input.phone.trim(),
        dateOfBirth: input.dateOfBirth || null,
        gender: input.gender || null,
        bloodGroup: input.bloodGroup || null,
        emergencyContact: input.emergencyContact || null,
        insuranceProvider: input.insuranceProvider || null,
        insurancePolicyNumber: input.insurancePolicyNumber || null,
        allergies: input.allergies?.trim() || null,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PATIENT_CREATE',
      entity: 'Patient',
      entityId: patient.id,
      ipAddress,
      userAgent,
      details: { mrn, name: `${patient.firstName} ${patient.lastName}` },
    });

    return patient;
  }

  static async updatePatient(
    hospitalId: string,
    patientId: string,
    currentUser: AuthUser,
    input: UpdatePatientInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Patient record not found in this hospital');
    }

    // Patients can only update their own contact details
    if (currentUser.role === UserRole.PATIENT && existing.userId !== currentUser.id) {
      throw new ForbiddenError('Access denied: Patients can only edit their own personal medical record');
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(input.firstName && { firstName: input.firstName.trim() }),
        ...(input.lastName && { lastName: input.lastName.trim() }),
        ...(input.phone && { phone: input.phone.trim() }),
        ...(input.email !== undefined && { email: input.email?.toLowerCase().trim() || null }),
        ...(input.emergencyContact !== undefined && { emergencyContact: input.emergencyContact }),
        ...(input.insuranceProvider !== undefined && { insuranceProvider: input.insuranceProvider }),
        ...(input.insurancePolicyNumber !== undefined && { insurancePolicyNumber: input.insurancePolicyNumber }),
        ...(input.allergies !== undefined && { allergies: input.allergies?.trim() || null }),
        ...(input.bloodGroup !== undefined && { bloodGroup: input.bloodGroup }),
        ...(input.isActive !== undefined && currentUser.role !== UserRole.PATIENT && { isActive: input.isActive }),
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'PATIENT_UPDATE',
      entity: 'Patient',
      entityId: patientId,
      ipAddress,
      userAgent,
      details: { mrn: existing.medicalRecordNumber, updatedFields: Object.keys(input) },
    });

    return updated;
  }
}
