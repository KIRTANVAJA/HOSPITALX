import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import {
  CreateWardInput,
  CreateRoomInput,
  CreateBedInput,
  UpdateBedStatusInput,
  AdmitPatientInput,
  TransferPatientInput,
  DischargePatientInput,
} from './inpatient.schema';
import { recordAuditEvent } from '../../services/audit.service';
import { BedStatus, AdmissionStatus } from '@prisma/client';

export class InpatientService {
  // ---------------------------------------------------------------------------
  // Wards & Rooms
  // ---------------------------------------------------------------------------

  static async listWards(hospitalId: string) {
    return prisma.ward.findMany({
      where: { hospitalId, isActive: true },
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
        _count: { select: { beds: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createWard(
    hospitalId: string,
    actorId: string,
    input: CreateWardInput,
    ip?: string,
    userAgent?: string
  ) {
    const existingCode = await prisma.ward.findUnique({
      where: { hospitalId_code: { hospitalId, code: input.code } },
    });
    if (existingCode) {
      throw new ConflictError(`Ward code "${input.code}" already exists in this hospital`);
    }

    const ward = await prisma.ward.create({
      data: {
        hospitalId,
        name: input.name,
        code: input.code.toUpperCase(),
        floor: input.floor || null,
        genderAllocation: input.genderAllocation,
        capacity: input.capacity,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'WARD_CREATE',
      entity: 'Ward',
      entityId: ward.id,
      details: { name: ward.name, code: ward.code },
      ipAddress: ip,
      userAgent,
    });

    return ward;
  }

  static async listRooms(hospitalId: string, wardId?: string) {
    const where: any = { hospitalId, isActive: true };
    if (wardId) where.wardId = wardId;

    return prisma.room.findMany({
      where,
      include: {
        ward: { select: { id: true, name: true, code: true } },
        beds: true,
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  static async createRoom(
    hospitalId: string,
    actorId: string,
    input: CreateRoomInput,
    ip?: string,
    userAgent?: string
  ) {
    const ward = await prisma.ward.findFirst({
      where: { id: input.wardId, hospitalId },
    });
    if (!ward) throw new NotFoundError('Ward not found in this hospital');

    const existing = await prisma.room.findUnique({
      where: {
        hospitalId_wardId_roomNumber: {
          hospitalId,
          wardId: input.wardId,
          roomNumber: input.roomNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictError(`Room "${input.roomNumber}" already exists in this ward`);
    }

    const room = await prisma.room.create({
      data: {
        hospitalId,
        wardId: input.wardId,
        roomNumber: input.roomNumber,
        roomType: input.roomType,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'ROOM_CREATE',
      entity: 'Room',
      entityId: room.id,
      details: { roomNumber: room.roomNumber, wardId: room.wardId },
      ipAddress: ip,
      userAgent,
    });

    return room;
  }

  // ---------------------------------------------------------------------------
  // Beds
  // ---------------------------------------------------------------------------

  static async listBeds(
    hospitalId: string,
    filters: { wardId?: string; roomId?: string; status?: BedStatus } = {}
  ) {
    const where: any = { hospitalId };
    if (filters.wardId) where.wardId = filters.wardId;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.status) where.status = filters.status;

    return prisma.bed.findMany({
      where,
      include: {
        ward: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, roomNumber: true, roomType: true } },
        assignments: {
          where: { status: AdmissionStatus.ACTIVE },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, medicalRecordNumber: true } },
          },
        },
      },
      orderBy: { bedNumber: 'asc' },
    });
  }

  static async createBed(
    hospitalId: string,
    actorId: string,
    input: CreateBedInput,
    ip?: string,
    userAgent?: string
  ) {
    const room = await prisma.room.findFirst({
      where: { id: input.roomId, hospitalId, wardId: input.wardId },
    });
    if (!room) throw new NotFoundError('Room not found in specified ward');

    const existing = await prisma.bed.findUnique({
      where: {
        hospitalId_roomId_bedNumber: {
          hospitalId,
          roomId: input.roomId,
          bedNumber: input.bedNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictError(`Bed "${input.bedNumber}" already exists in this room`);
    }

    const bed = await prisma.bed.create({
      data: {
        hospitalId,
        wardId: input.wardId,
        roomId: input.roomId,
        bedNumber: input.bedNumber,
        dailyRate: input.dailyRate,
        status: BedStatus.AVAILABLE,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'BED_CREATE',
      entity: 'Bed',
      entityId: bed.id,
      details: { bedNumber: bed.bedNumber, roomId: bed.roomId },
      ipAddress: ip,
      userAgent,
    });

    return bed;
  }

  static async updateBedStatus(
    hospitalId: string,
    actorId: string,
    bedId: string,
    input: UpdateBedStatusInput,
    ip?: string,
    userAgent?: string
  ) {
    const bed = await prisma.bed.findFirst({
      where: { id: bedId, hospitalId },
      include: { assignments: { where: { status: AdmissionStatus.ACTIVE } } },
    });
    if (!bed) throw new NotFoundError('Bed not found');

    if (input.status === BedStatus.AVAILABLE && bed.assignments.length > 0) {
      throw new BadRequestError('Cannot mark bed as AVAILABLE while an active patient is admitted to it');
    }

    const updated = await prisma.bed.update({
      where: { id: bedId },
      data: { status: input.status },
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'BED_STATUS_UPDATE',
      entity: 'Bed',
      entityId: bedId,
      details: { previousStatus: bed.status, newStatus: input.status },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Patient Inpatient Admission, Transfer & Discharge Workflows
  // ---------------------------------------------------------------------------

  static async admitPatient(
    hospitalId: string,
    actorId: string,
    input: AdmitPatientInput,
    ip?: string,
    userAgent?: string
  ) {
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, hospitalId },
    });
    if (!patient) throw new NotFoundError('Patient not found in this hospital');

    const activeAdmission = await prisma.bedAssignment.findFirst({
      where: { hospitalId, patientId: input.patientId, status: AdmissionStatus.ACTIVE },
    });
    if (activeAdmission) {
      throw new ConflictError('Patient is already admitted to another bed. Please transfer or discharge first.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findFirst({
        where: { id: input.bedId, hospitalId },
      });

      if (!bed) {
        throw new NotFoundError('Target bed not found');
      }

      if (bed.status !== BedStatus.AVAILABLE) {
        throw new ConflictError(`Bed is not available for admission (current status: ${bed.status})`);
      }

      await tx.bed.update({
        where: { id: input.bedId },
        data: { status: BedStatus.OCCUPIED },
      });

      const assignment = await tx.bedAssignment.create({
        data: {
          hospitalId,
          bedId: input.bedId,
          patientId: input.patientId,
          admittedAt: new Date(),
          status: AdmissionStatus.ACTIVE,
          admissionReason: input.admissionReason,
          attendingDoctor: input.attendingDoctor || null,
        },
        include: {
          bed: { include: { ward: true, room: true } },
          patient: true,
        },
      });

      return assignment;
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PATIENT_ADMIT',
      entity: 'BedAssignment',
      entityId: result.id,
      details: { patientId: input.patientId, bedId: input.bedId, reason: input.admissionReason },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  static async transferPatient(
    hospitalId: string,
    actorId: string,
    assignmentId: string,
    input: TransferPatientInput,
    ip?: string,
    userAgent?: string
  ) {
    const currentAssignment = await prisma.bedAssignment.findFirst({
      where: { id: assignmentId, hospitalId },
      include: { bed: true },
    });

    if (!currentAssignment || currentAssignment.status !== AdmissionStatus.ACTIVE) {
      throw new NotFoundError('Active bed assignment not found');
    }

    if (currentAssignment.bedId === input.newBedId) {
      throw new BadRequestError('Cannot transfer patient to the exact same bed');
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetBed = await tx.bed.findFirst({
        where: { id: input.newBedId, hospitalId },
      });

      if (!targetBed) throw new NotFoundError('Target bed not found');
      if (targetBed.status !== BedStatus.AVAILABLE) {
        throw new ConflictError(`Target bed is not available for transfer (current status: ${targetBed.status})`);
      }

      // Free previous bed
      await tx.bed.update({
        where: { id: currentAssignment.bedId },
        data: { status: BedStatus.AVAILABLE },
      });

      // Mark old assignment as transferred
      await tx.bedAssignment.update({
        where: { id: assignmentId },
        data: {
          status: AdmissionStatus.TRANSFERRED,
          dischargeSummary: input.transferReason ? `Transferred: ${input.transferReason}` : 'Transferred to another bed',
        },
      });

      // Occupy new bed
      await tx.bed.update({
        where: { id: input.newBedId },
        data: { status: BedStatus.OCCUPIED },
      });

      // Create new active assignment
      const newAssignment = await tx.bedAssignment.create({
        data: {
          hospitalId,
          bedId: input.newBedId,
          patientId: currentAssignment.patientId,
          admittedAt: new Date(),
          status: AdmissionStatus.ACTIVE,
          admissionReason: `Transferred from Bed ${currentAssignment.bed.bedNumber}. Reason: ${input.transferReason || 'Routine care transfer'}`,
          attendingDoctor: currentAssignment.attendingDoctor,
        },
        include: {
          bed: { include: { ward: true, room: true } },
          patient: true,
        },
      });

      return newAssignment;
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PATIENT_TRANSFER',
      entity: 'BedAssignment',
      entityId: result.id,
      details: { previousBedId: currentAssignment.bedId, newBedId: input.newBedId },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  static async dischargePatient(
    hospitalId: string,
    actorId: string,
    assignmentId: string,
    input: DischargePatientInput,
    ip?: string,
    userAgent?: string
  ) {
    const currentAssignment = await prisma.bedAssignment.findFirst({
      where: { id: assignmentId, hospitalId },
    });

    if (!currentAssignment || currentAssignment.status !== AdmissionStatus.ACTIVE) {
      throw new NotFoundError('Active bed assignment not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Free bed
      await tx.bed.update({
        where: { id: currentAssignment.bedId },
        data: { status: BedStatus.AVAILABLE },
      });

      // Finalize assignment
      const updated = await tx.bedAssignment.update({
        where: { id: assignmentId },
        data: {
          status: AdmissionStatus.DISCHARGED,
          dischargedAt: new Date(),
          dischargeSummary: input.dischargeSummary.trim(),
        },
      });

      return updated;
    });

    await recordAuditEvent({
      hospitalId,
      userId: actorId,
      action: 'PATIENT_DISCHARGE',
      entity: 'BedAssignment',
      entityId: assignmentId,
      details: { dischargeSummary: input.dischargeSummary },
      ipAddress: ip,
      userAgent,
    });

    return result;
  }

  // ---------------------------------------------------------------------------
  // Inpatient Analytics & Bed Occupancy
  // ---------------------------------------------------------------------------

  static async getInpatientMetrics(hospitalId: string) {
    const [totalWards, totalRooms, totalBeds, statusCounts] = await Promise.all([
      prisma.ward.count({ where: { hospitalId, isActive: true } }),
      prisma.room.count({ where: { hospitalId, isActive: true } }),
      prisma.bed.count({ where: { hospitalId } }),
      prisma.bed.groupBy({
        by: ['status'],
        where: { hospitalId },
        _count: { id: true },
      }),
    ]);

    const statusMap: Record<string, number> = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      MAINTENANCE: 0,
      RESERVED: 0,
    };

    statusCounts.forEach((s) => {
      statusMap[s.status] = s._count.id;
    });

    const occupancyRate = totalBeds > 0 ? Math.round((statusMap.OCCUPIED / totalBeds) * 100) : 0;

    return {
      totalWards,
      totalRooms,
      totalBeds,
      statusCounts: statusMap,
      occupancyRate,
    };
  }
}
