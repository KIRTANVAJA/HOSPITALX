import { prisma } from '../../db/prisma';
import {
  CreateConsultationInput,
  UpdateConsultationInput,
  CreatePrescriptionInput,
  CreateMedicalReportInput,
} from './clinical.schema';
import { AuthenticatedUser } from '../../types';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { recordAuditEvent } from '../../services/audit.service';
import {
  ConsultationStatus,
  PrescriptionStatus,
  UserRole,
} from '@prisma/client';

export class ClinicalService {
  // ---------------------------------------------------------------------------
  // Consultations
  // ---------------------------------------------------------------------------

  static async listConsultations(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    page = 1,
    limit = 20,
    filters: { patientId?: string; doctorId?: string } = {}
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId };

    // Patients can only see their own consultations
    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (!patient) {
        return { consultations: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.patientId = patient.id;
    } else if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    const [total, consultations] = await Promise.all([
      prisma.consultation.count({ where }),
      prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, specialty: true } },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              medicalRecordNumber: true,
              phone: true,
            },
          },
          prescriptions: true,
        },
      }),
    ]);

    return {
      consultations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getConsultationById(
    hospitalId: string,
    id: string,
    currentUser: AuthenticatedUser
  ) {
    const consultation = await prisma.consultation.findFirst({
      where: { id, hospitalId },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        patient: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            medicalRecordNumber: true,
            bloodGroup: true,
            allergies: true,
            phone: true,
          },
        },
        appointment: { select: { id: true, bookingId: true, appointmentDate: true, startTime: true } },
        prescriptions: true,
      },
    });

    if (!consultation) {
      throw new NotFoundError('Clinical consultation record not found');
    }

    // Role check for patients
    if (
      currentUser.role === UserRole.PATIENT &&
      consultation.patient.userId !== currentUser.id
    ) {
      throw new ForbiddenError('Access denied: You may only view your personal clinical records');
    }

    return consultation;
  }

  static async createConsultation(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    data: CreateConsultationInput,
    ip?: string,
    userAgent?: string
  ) {
    // Determine Doctor ID
    let doctorId = data.doctorId;
    if (!doctorId) {
      const doc = await prisma.doctor.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (doc) {
        doctorId = doc.id;
      }
    }

    if (!doctorId) {
      throw new BadRequestError('Doctor ID is required to create a clinical consultation record');
    }

    // Verify patient belongs to this hospital
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, hospitalId },
    });
    if (!patient) {
      throw new NotFoundError('Target patient record not found in this hospital');
    }

    const consultation = await prisma.consultation.create({
      data: {
        hospitalId,
        patientId: data.patientId,
        doctorId,
        appointmentId: data.appointmentId || null,
        diagnosis: data.diagnosis,
        symptoms: data.symptoms || null,
        examinationNotes: data.examinationNotes || null,
        vitalSigns: data.vitalSigns ? JSON.stringify(data.vitalSigns) : null,
        status: ConsultationStatus.DRAFT,
      },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        patient: { select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true } },
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'CLINICAL_CONSULTATION_CREATE',
      entity: 'Consultation',
      entityId: consultation.id,
      details: { patientId: data.patientId, doctorId, diagnosis: data.diagnosis },
      ipAddress: ip,
      userAgent,
    });

    return consultation;
  }

  static async updateConsultation(
    hospitalId: string,
    id: string,
    currentUser: AuthenticatedUser,
    data: UpdateConsultationInput,
    ip?: string,
    userAgent?: string
  ) {
    const existing = await prisma.consultation.findFirst({
      where: { id, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Consultation record not found');
    }

    if (existing.status === ConsultationStatus.FINALIZED) {
      throw new BadRequestError('Finalized consultation records are immutable and cannot be modified');
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        diagnosis: data.diagnosis ?? existing.diagnosis,
        symptoms: data.symptoms !== undefined ? data.symptoms : existing.symptoms,
        examinationNotes: data.examinationNotes !== undefined ? data.examinationNotes : existing.examinationNotes,
        vitalSigns: data.vitalSigns ? JSON.stringify(data.vitalSigns) : existing.vitalSigns,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'CLINICAL_CONSULTATION_UPDATE',
      entity: 'Consultation',
      entityId: id,
      details: { updatedFields: Object.keys(data) },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  static async finalizeConsultation(
    hospitalId: string,
    id: string,
    currentUser: AuthenticatedUser,
    ip?: string,
    userAgent?: string
  ) {
    const existing = await prisma.consultation.findFirst({
      where: { id, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Consultation record not found');
    }

    if (existing.status === ConsultationStatus.FINALIZED) {
      throw new BadRequestError('Consultation is already finalized');
    }

    const finalized = await prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.FINALIZED,
        finalizedAt: new Date(),
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'CLINICAL_CONSULTATION_FINALIZE',
      entity: 'Consultation',
      entityId: id,
      details: { finalizedAt: finalized.finalizedAt },
      ipAddress: ip,
      userAgent,
    });

    return finalized;
  }

  // ---------------------------------------------------------------------------
  // Prescriptions
  // ---------------------------------------------------------------------------

  static async listPrescriptions(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    page = 1,
    limit = 20,
    filters: { patientId?: string; status?: PrescriptionStatus } = {}
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId };

    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (!patient) {
        return { prescriptions: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.patientId = patient.id;
    } else if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [total, prescriptions] = await Promise.all([
      prisma.prescription.count({ where }),
      prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, specialty: true } },
          patient: { select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true } },
        },
      }),
    ]);

    return {
      prescriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createPrescription(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    data: CreatePrescriptionInput,
    ip?: string,
    userAgent?: string
  ) {
    let doctorId = data.doctorId;
    if (!doctorId) {
      const doc = await prisma.doctor.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (doc) doctorId = doc.id;
    }

    if (!doctorId) {
      throw new BadRequestError('Doctor ID is required to author a prescription');
    }

    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, hospitalId },
    });
    if (!patient) {
      throw new NotFoundError('Patient record not found in this hospital');
    }

    const prescription = await prisma.prescription.create({
      data: {
        hospitalId,
        patientId: data.patientId,
        doctorId,
        consultationId: data.consultationId || null,
        medications: JSON.stringify(data.medications),
        notes: data.notes || null,
        status: PrescriptionStatus.ACTIVE,
      },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        patient: { select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true } },
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'PRESCRIPTION_CREATE',
      entity: 'Prescription',
      entityId: prescription.id,
      details: { patientId: data.patientId, medicationCount: data.medications.length },
      ipAddress: ip,
      userAgent,
    });

    return prescription;
  }

  static async updatePrescriptionStatus(
    hospitalId: string,
    id: string,
    status: PrescriptionStatus,
    currentUser: AuthenticatedUser,
    ip?: string,
    userAgent?: string
  ) {
    const existing = await prisma.prescription.findFirst({
      where: { id, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Prescription record not found');
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'PRESCRIPTION_STATUS_UPDATE',
      entity: 'Prescription',
      entityId: id,
      details: { previousStatus: existing.status, newStatus: status },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Medical Reports
  // ---------------------------------------------------------------------------

  static async listMedicalReports(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    page = 1,
    limit = 20,
    filters: { patientId?: string } = {}
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId };

    if (currentUser.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findFirst({
        where: { hospitalId, userId: currentUser.id },
      });
      if (!patient) {
        return { reports: [], meta: { page, limit, total: 0, totalPages: 0 } };
      }
      where.patientId = patient.id;
    } else if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    const [total, reports] = await Promise.all([
      prisma.medicalReport.count({ where }),
      prisma.medicalReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, specialty: true } },
          patient: { select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true } },
        },
      }),
    ]);

    return {
      reports,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createMedicalReport(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    data: CreateMedicalReportInput,
    ip?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, hospitalId },
    });
    if (!patient) {
      throw new NotFoundError('Patient record not found in this hospital');
    }

    const report = await prisma.medicalReport.create({
      data: {
        hospitalId,
        patientId: data.patientId,
        doctorId: data.doctorId || null,
        title: data.title,
        reportType: data.reportType,
        fileUrl: data.fileUrl || null,
        mimeType: data.mimeType || 'application/pdf',
        fileSize: data.fileSize || null,
        summary: data.summary || null,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: currentUser.id,
      action: 'MEDICAL_REPORT_CREATE',
      entity: 'MedicalReport',
      entityId: report.id,
      details: { title: data.title, patientId: data.patientId, type: data.reportType },
      ipAddress: ip,
      userAgent,
    });

    return report;
  }
}
