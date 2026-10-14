import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../utils/errors';
import { UpdateHospitalSettingsInput } from './hospital.schema';
import { recordAuditEvent } from '../../services/audit.service';

export class HospitalService {
  static async getCurrentHospital(hospitalId: string) {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        _count: {
          select: {
            departments: true,
            doctors: true,
            patients: true,
            appointments: true,
          },
        },
      },
    });

    if (!hospital) {
      throw new NotFoundError('Hospital context not found');
    }

    return hospital;
  }

  static async updateSettings(
    hospitalId: string,
    userId: string,
    input: UpdateHospitalSettingsInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'HOSPITAL_SETTINGS_UPDATE',
      entity: 'Hospital',
      entityId: hospitalId,
      ipAddress,
      userAgent,
      details: input,
    });

    return updated;
  }
}
