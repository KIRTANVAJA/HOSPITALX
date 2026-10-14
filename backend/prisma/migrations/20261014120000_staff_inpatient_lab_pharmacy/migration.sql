-- AlterTable: Modify UserRole enum
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING', 'PATIENT', 'LAB_TECHNICIAN', 'PHARMACIST', 'HR_MANAGER', 'INVENTORY_MANAGER') NOT NULL DEFAULT 'PATIENT';

-- AlterTable: StaffProfile additions
ALTER TABLE `staff_profiles` 
    ADD COLUMN `employeeCategory` ENUM('DOCTOR', 'SPECIALIST', 'SURGEON', 'NURSE', 'NURSING_SUPERVISOR', 'RECEPTIONIST', 'ADMINISTRATOR', 'HR', 'BILLING', 'LAB_TECHNICIAN', 'PHARMACIST', 'WARD_ATTENDANT', 'HOUSEKEEPING', 'SECURITY', 'MAINTENANCE', 'INVENTORY', 'IT_SUPPORT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    ADD COLUMN `employmentStatus` ENUM('ACTIVE', 'ON_LEAVE', 'PROBATION', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `joiningDate` DATETIME(3) NULL,
    ADD COLUMN `salary` DECIMAL(10, 2) NULL,
    ADD COLUMN `emergencyContact` VARCHAR(191) NULL;

CREATE INDEX `staff_profiles_hospitalId_employeeCategory_idx` ON `staff_profiles`(`hospitalId`, `employeeCategory`);
CREATE INDEX `staff_profiles_hospitalId_employmentStatus_idx` ON `staff_profiles`(`hospitalId`, `employmentStatus`);

-- CreateTable: staff_shifts
CREATE TABLE `staff_shifts` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL DEFAULT '#176B68',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_shifts_hospitalId_name_key`(`hospitalId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: staff_schedules
CREATE TABLE `staff_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `staffProfileId` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'SWAPPED') NOT NULL DEFAULT 'SCHEDULED',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_schedules_staffProfileId_date_shiftId_key`(`staffProfileId`, `date`, `shiftId`),
    INDEX `staff_schedules_hospitalId_date_idx`(`hospitalId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: staff_attendances
CREATE TABLE `staff_attendances` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `staffProfileId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `checkInTime` DATETIME(3) NOT NULL,
    `checkOutTime` DATETIME(3) NULL,
    `status` ENUM('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT') NOT NULL DEFAULT 'PRESENT',
    `verifiedById` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_attendances_staffProfileId_date_key`(`staffProfileId`, `date`),
    INDEX `staff_attendances_hospitalId_date_idx`(`hospitalId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: staff_leave_requests
CREATE TABLE `staff_leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `staffProfileId` VARCHAR(191) NOT NULL,
    `leaveType` ENUM('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID') NOT NULL DEFAULT 'ANNUAL',
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewerNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `staff_leave_requests_hospitalId_staffProfileId_idx`(`hospitalId`, `staffProfileId`),
    INDEX `staff_leave_requests_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wards
CREATE TABLE `wards` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `floor` VARCHAR(191) NULL,
    `genderAllocation` VARCHAR(191) NOT NULL DEFAULT 'MIXED',
    `capacity` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wards_hospitalId_code_key`(`hospitalId`, `code`),
    UNIQUE INDEX `wards_hospitalId_name_key`(`hospitalId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: rooms
CREATE TABLE `rooms` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `wardId` VARCHAR(191) NOT NULL,
    `roomNumber` VARCHAR(191) NOT NULL,
    `roomType` VARCHAR(191) NOT NULL DEFAULT 'STANDARD',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rooms_hospitalId_wardId_roomNumber_key`(`hospitalId`, `wardId`, `roomNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: beds
CREATE TABLE `beds` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `wardId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `bedNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED') NOT NULL DEFAULT 'AVAILABLE',
    `dailyRate` DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `beds_hospitalId_roomId_bedNumber_key`(`hospitalId`, `roomId`, `bedNumber`),
    INDEX `beds_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: bed_assignments
CREATE TABLE `bed_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `bedId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `admittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dischargedAt` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'TRANSFERRED', 'DISCHARGED') NOT NULL DEFAULT 'ACTIVE',
    `admissionReason` TEXT NULL,
    `dischargeSummary` TEXT NULL,
    `attendingDoctor` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bed_assignments_hospitalId_bedId_status_idx`(`hospitalId`, `bedId`, `status`),
    INDEX `bed_assignments_hospitalId_patientId_idx`(`hospitalId`, `patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: lab_tests
CREATE TABLE `lab_tests` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `sampleType` VARCHAR(191) NOT NULL DEFAULT 'BLOOD',
    `normalRange` VARCHAR(191) NULL,
    `units` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `turnaroundHours` INTEGER NOT NULL DEFAULT 24,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lab_tests_hospitalId_code_key`(`hospitalId`, `code`),
    INDEX `lab_tests_hospitalId_category_idx`(`hospitalId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: lab_orders
CREATE TABLE `lab_orders` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NULL,
    `status` ENUM('ORDERED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ORDERED',
    `priority` ENUM('ROUTINE', 'URGENT', 'STAT') NOT NULL DEFAULT 'ROUTINE',
    `notes` TEXT NULL,
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lab_orders_hospitalId_orderNumber_key`(`hospitalId`, `orderNumber`),
    INDEX `lab_orders_hospitalId_patientId_idx`(`hospitalId`, `patientId`),
    INDEX `lab_orders_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: lab_order_items
CREATE TABLE `lab_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `labOrderId` VARCHAR(191) NOT NULL,
    `labTestId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `resultValue` TEXT NULL,
    `resultNotes` TEXT NULL,
    `isAbnormal` BOOLEAN NOT NULL DEFAULT false,
    `performedAt` DATETIME(3) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lab_order_items_labOrderId_labTestId_idx`(`labOrderId`, `labTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: pharmacy_items
CREATE TABLE `pharmacy_items` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `genericName` VARCHAR(191) NULL,
    `sku` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `unitOfMeasure` VARCHAR(191) NOT NULL DEFAULT 'BOX',
    `reorderLevel` INTEGER NOT NULL DEFAULT 20,
    `unitPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pharmacy_items_hospitalId_sku_key`(`hospitalId`, `sku`),
    INDEX `pharmacy_items_hospitalId_category_idx`(`hospitalId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: pharmacy_batches
CREATE TABLE `pharmacy_batches` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `pharmacyItemId` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NOT NULL,
    `expiryDate` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `unitCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `receivedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pharmacy_batches_pharmacyItemId_batchNumber_key`(`pharmacyItemId`, `batchNumber`),
    INDEX `pharmacy_batches_hospitalId_expiryDate_idx`(`hospitalId`, `expiryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: stock_movements
CREATE TABLE `stock_movements` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `pharmacyItemId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `movementType` ENUM('PURCHASE', 'DISPENSE', 'ADJUSTMENT', 'RETURN', 'DAMAGED', 'EXPIRED') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `performedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_hospitalId_pharmacyItemId_idx`(`hospitalId`, `pharmacyItemId`),
    INDEX `stock_movements_hospitalId_createdAt_idx`(`hospitalId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign Keys
ALTER TABLE `staff_shifts` ADD CONSTRAINT `staff_shifts_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `staff_schedules` ADD CONSTRAINT `staff_schedules_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `staff_schedules` ADD CONSTRAINT `staff_schedules_staffProfileId_fkey` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `staff_schedules` ADD CONSTRAINT `staff_schedules_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `staff_shifts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `staff_attendances` ADD CONSTRAINT `staff_attendances_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `staff_attendances` ADD CONSTRAINT `staff_attendances_staffProfileId_fkey` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `staff_leave_requests` ADD CONSTRAINT `staff_leave_requests_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `staff_leave_requests` ADD CONSTRAINT `staff_leave_requests_staffProfileId_fkey` FOREIGN KEY (`staffProfileId`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `wards` ADD CONSTRAINT `wards_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `beds` ADD CONSTRAINT `beds_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `beds` ADD CONSTRAINT `beds_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `wards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `beds` ADD CONSTRAINT `beds_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `beds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bed_assignments` ADD CONSTRAINT `bed_assignments_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lab_tests` ADD CONSTRAINT `lab_tests_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lab_orders` ADD CONSTRAINT `lab_orders_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lab_orders` ADD CONSTRAINT `lab_orders_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lab_orders` ADD CONSTRAINT `lab_orders_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `lab_order_items` ADD CONSTRAINT `lab_order_items_labOrderId_fkey` FOREIGN KEY (`labOrderId`) REFERENCES `lab_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lab_order_items` ADD CONSTRAINT `lab_order_items_labTestId_fkey` FOREIGN KEY (`labTestId`) REFERENCES `lab_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pharmacy_items` ADD CONSTRAINT `pharmacy_items_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pharmacy_batches` ADD CONSTRAINT `pharmacy_batches_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `pharmacy_batches` ADD CONSTRAINT `pharmacy_batches_pharmacyItemId_fkey` FOREIGN KEY (`pharmacyItemId`) REFERENCES `pharmacy_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_pharmacyItemId_fkey` FOREIGN KEY (`pharmacyItemId`) REFERENCES `pharmacy_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `pharmacy_batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
