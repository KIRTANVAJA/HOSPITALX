import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { UserRole } from '@prisma/client';

async function seedAdmin() {
  logger.info('Starting HospitalX Initial Administrator Provisioning...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hospitalx.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'HospitalXAdminSecure2026!';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Chief';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';
  const hospitalCode = env.DEFAULT_HOSPITAL_CODE;
  const hospitalName = env.DEFAULT_HOSPITAL_NAME;

  // 1. Ensure Hospital exists
  let hospital = await prisma.hospital.findUnique({
    where: { code: hospitalCode },
  });

  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        code: hospitalCode,
        name: hospitalName,
        isActive: true,
      },
    });
    logger.info(`Created default hospital: "${hospital.name}" (${hospital.code})`);
  } else {
    logger.info(`Found existing hospital: "${hospital.name}" (${hospital.code})`);
  }

  // 2. Ensure initial departments exist
  const defaultDepartments = [
    { code: 'CARDIO', name: 'Cardiology', description: 'Advanced cardiovascular diagnostics and interventional cath labs.' },
    { code: 'NEURO', name: 'Neurology', description: 'Comprehensive brain, spine, and neuro-rehabilitation division.' },
    { code: 'ORTHO', name: 'Orthopedics', description: 'Joint replacement, trauma surgery, and sports medicine.' },
    { code: 'EMERGENCY', name: 'Emergency & Trauma', description: '24/7 Level-1 crisis trauma triage and life support.' },
  ];

  for (const dept of defaultDepartments) {
    const existing = await prisma.department.findFirst({
      where: { hospitalId: hospital.id, code: dept.code },
    });
    if (!existing) {
      await prisma.department.create({
        data: {
          hospitalId: hospital.id,
          code: dept.code,
          name: dept.name,
          description: dept.description,
          isActive: true,
        },
      });
      logger.info(`Provisioned clinical department: ${dept.name}`);
    }
  }

  // 3. Ensure Admin User exists
  const existingAdmin = await prisma.user.findUnique({
    where: {
      hospitalId_email: {
        hospitalId: hospital.id,
        email: adminEmail.toLowerCase().trim(),
      },
    },
  });

  if (existingAdmin) {
    logger.info(`Administrator account "${adminEmail}" already exists for hospital ${hospital.code}.`);
  } else {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          hospitalId: hospital.id,
          email: adminEmail.toLowerCase().trim(),
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: UserRole.HOSPITAL_ADMIN,
        },
      });

      await tx.staffProfile.create({
        data: {
          hospitalId: hospital.id,
          userId: user.id,
          employeeId: 'EMP-ADM-001',
          department: 'Hospital Administration',
          jobTitle: 'Chief Hospital Administrator',
        },
      });
    });

    logger.info(`Successfully created Administrator account: "${adminEmail}".`);
    logger.info('Please ensure ADMIN_PASSWORD is changed immediately upon first login.');
  }

  await prisma.$disconnect();
}

seedAdmin().catch((err) => {
  logger.error('Failed to seed administrator', err);
  process.exit(1);
});
