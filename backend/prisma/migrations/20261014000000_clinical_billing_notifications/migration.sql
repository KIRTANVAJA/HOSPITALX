-- CreateTable
CREATE TABLE `consultations` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NOT NULL,
    `symptoms` TEXT NULL,
    `examinationNotes` TEXT NULL,
    `vitalSigns` TEXT NULL,
    `status` ENUM('DRAFT', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
    `finalizedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `consultations_appointmentId_key`(`appointmentId`),
    INDEX `consultations_hospitalId_patientId_idx`(`hospitalId`, `patientId`),
    INDEX `consultations_hospitalId_doctorId_idx`(`hospitalId`, `doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `consultationId` VARCHAR(191) NULL,
    `medications` TEXT NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'DISCONTINUED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prescriptions_hospitalId_patientId_idx`(`hospitalId`, `patientId`),
    INDEX `prescriptions_hospitalId_doctorId_idx`(`hospitalId`, `doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_reports` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `reportType` ENUM('LAB_TEST', 'RADIOLOGY', 'PATHOLOGY', 'DISCHARGE_SUMMARY', 'OTHER') NOT NULL DEFAULT 'LAB_TEST',
    `fileUrl` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `summary` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `medical_reports_hospitalId_patientId_idx`(`hospitalId`, `patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED') NOT NULL DEFAULT 'ISSUED',
    `dueDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `invoices_hospitalId_patientId_idx`(`hospitalId`, `patientId`),
    INDEX `invoices_hospitalId_status_idx`(`hospitalId`, `status`),
    UNIQUE INDEX `invoices_hospitalId_invoiceNumber_key`(`hospitalId`, `invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_line_items` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` ENUM('CASH', 'CARD', 'INSURANCE', 'BANK_TRANSFER') NOT NULL DEFAULT 'CASH',
    `transactionRef` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_hospitalId_invoiceId_idx`(`hospitalId`, `invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('APPOINTMENT', 'CLINICAL', 'BILLING', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_hospitalId_userId_isRead_idx`(`hospitalId`, `userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `consultations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_reports` ADD CONSTRAINT `medical_reports_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `medical_reports` ADD CONSTRAINT `medical_reports_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `medical_reports` ADD CONSTRAINT `medical_reports_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_line_items` ADD CONSTRAINT `invoice_line_items_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
