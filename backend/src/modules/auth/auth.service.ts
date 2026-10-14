import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../utils/errors';
import { LoginInput, RegisterPatientInput } from './auth.schema';
import { UserRole, UserStatus } from '@prisma/client';
import { recordAuditEvent } from '../../services/audit.service';

export class AuthService {
  private static async getHospital(hospitalCode?: string) {
    const code = hospitalCode || env.DEFAULT_HOSPITAL_CODE;
    let hospital = await prisma.hospital.findUnique({
      where: { code },
    });

    if (!hospital) {
      // Auto-provision initial default hospital if not present
      hospital = await prisma.hospital.create({
        data: {
          code,
          name: env.DEFAULT_HOSPITAL_NAME,
          isActive: true,
        },
      });
    }
    return hospital;
  }

  static async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const hospital = await this.getHospital(input.hospitalCode);

    const user = await prisma.user.findUnique({
      where: {
        hospitalId_email: {
          hospitalId: hospital.id,
          email: input.email.toLowerCase().trim(),
        },
      },
      include: {
        hospital: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}. Please contact administration.`);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record audit event
    await recordAuditEvent({
      hospitalId: hospital.id,
      userId: user.id,
      action: 'AUTH_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      details: { role: user.role, email: user.email },
    });

    const token = jwt.sign(
      {
        id: user.id,
        hospitalId: user.hospitalId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hospital: user.hospital,
      },
    };
  }

  static async registerPatient(input: RegisterPatientInput, ipAddress?: string, userAgent?: string) {
    const hospital = await this.getHospital(input.hospitalCode);
    const cleanEmail = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: {
        hospitalId_email: {
          hospitalId: hospital.id,
          email: cleanEmail,
        },
      },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email address already exists for this hospital');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Generate MRN (Medical Record Number): MRN-YYYY-RANDOM
    const mrn = `MRN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          hospitalId: hospital.id,
          email: cleanEmail,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: UserRole.PATIENT,
          phone: input.phone.trim(),
        },
      });

      await tx.patient.create({
        data: {
          hospitalId: hospital.id,
          userId: user.id,
          medicalRecordNumber: mrn,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: cleanEmail,
          phone: input.phone.trim(),
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          bloodGroup: input.bloodGroup,
          emergencyContact: input.emergencyContact,
          insuranceProvider: input.insuranceProvider,
          insurancePolicyNumber: input.insurancePolicyNumber,
        },
      });

      return user;
    });

    await recordAuditEvent({
      hospitalId: hospital.id,
      userId: newUser.id,
      action: 'AUTH_REGISTER_PATIENT',
      entity: 'Patient',
      entityId: newUser.id,
      ipAddress,
      userAgent,
      details: { mrn, email: cleanEmail },
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        hospitalId: newUser.hospitalId,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        mrn,
        hospital: { id: hospital.id, code: hospital.code, name: hospital.name },
      },
    };
  }

  static async getCurrentUser(userId: string, hospitalId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        hospitalId: true,
        lastLoginAt: true,
        createdAt: true,
        hospital: {
          select: { id: true, code: true, name: true },
        },
        doctorProfile: {
          select: { id: true, specialty: true, licenseNumber: true, departmentId: true },
        },
        patientProfile: {
          select: { id: true, medicalRecordNumber: true, bloodGroup: true, insuranceProvider: true },
        },
        staffProfile: {
          select: { id: true, employeeId: true, jobTitle: true, department: true },
        },
      },
    });

    if (!user || user.hospitalId !== hospitalId) {
      throw new UnauthorizedError('User profile not found or tenant mismatch');
    }

    return user;
  }
}
