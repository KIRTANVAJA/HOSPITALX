import { prisma } from '../../db/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  UpdateDepartmentStatusInput,
} from './department.schema';
import { recordAuditEvent } from '../../services/audit.service';

export class DepartmentService {
  static async listDepartments(hospitalId: string, onlyActive: boolean = true) {
    return prisma.department.findMany({
      where: {
        hospitalId,
        ...(onlyActive && { isActive: true }),
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { doctors: true, appointments: true },
        },
      },
    });
  }

  static async createDepartment(
    hospitalId: string,
    userId: string,
    input: CreateDepartmentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.department.findFirst({
      where: {
        hospitalId,
        OR: [
          { code: input.code.trim().toUpperCase() },
          { name: input.name.trim() },
        ],
      },
    });

    if (existing) {
      throw new ConflictError('A department with this code or name already exists in this hospital');
    }

    const dept = await prisma.department.create({
      data: {
        hospitalId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        isActive: true,
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'DEPARTMENT_CREATE',
      entity: 'Department',
      entityId: dept.id,
      ipAddress,
      userAgent,
      details: { name: dept.name, code: dept.code },
    });

    return dept;
  }

  static async updateDepartment(
    hospitalId: string,
    departmentId: string,
    userId: string,
    input: UpdateDepartmentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.department.findFirst({
      where: { id: departmentId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Department not found in this hospital');
    }

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.code && { code: input.code.trim().toUpperCase() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
      },
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'DEPARTMENT_UPDATE',
      entity: 'Department',
      entityId: departmentId,
      ipAddress,
      userAgent,
      details: input,
    });

    return updated;
  }

  static async updateStatus(
    hospitalId: string,
    departmentId: string,
    userId: string,
    input: UpdateDepartmentStatusInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await prisma.department.findFirst({
      where: { id: departmentId, hospitalId },
    });

    if (!existing) {
      throw new NotFoundError('Department not found in this hospital');
    }

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: { isActive: input.isActive },
    });

    await recordAuditEvent({
      hospitalId,
      userId,
      action: 'DEPARTMENT_STATUS_CHANGE',
      entity: 'Department',
      entityId: departmentId,
      ipAddress,
      userAgent,
      details: { isActive: input.isActive },
    });

    return updated;
  }
}
