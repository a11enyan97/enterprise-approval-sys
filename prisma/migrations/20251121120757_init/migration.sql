-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dept_code` VARCHAR(191) NOT NULL,
    `dept_name` VARCHAR(191) NOT NULL,
    `parent_id` INTEGER NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `full_path` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `manager_id` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_dept_code_key`(`dept_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('applicant', 'approver') NOT NULL,
    `real_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `employee_no` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `primary_dept_id` INTEGER NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_departments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `dept_id` INTEGER NOT NULL,
    `is_primary` INTEGER NOT NULL DEFAULT 1,
    `position` VARCHAR(191) NULL,
    `job_title` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_departments_user_id_dept_id_key`(`user_id`, `dept_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `form_schema` JSON NOT NULL,
    `approvers` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_requests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `request_no` VARCHAR(191) NOT NULL,
    `project_name` VARCHAR(191) NOT NULL,
    `approval_content` VARCHAR(191) NULL,
    `dept_full_path` VARCHAR(191) NULL,
    `dept_level1_id` INTEGER NULL,
    `dept_level2_id` INTEGER NULL,
    `dept_level3_id` INTEGER NULL,
    `execute_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `currentStatus` ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    `applicant_id` INTEGER NOT NULL,
    `type_id` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `approval_requests_request_no_key`(`request_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_nodes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `request_id` BIGINT NOT NULL,
    `node_type` ENUM('start', 'normal', 'end') NOT NULL,
    `step_number` INTEGER NOT NULL,
    `approver_id` INTEGER NOT NULL,
    `node_status` ENUM('waiting', 'processing', 'approved', 'rejected') NOT NULL,
    `comment` VARCHAR(191) NULL,
    `action_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `approval_nodes_request_id_step_number_key`(`request_id`, `step_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_primary_dept_id_fkey` FOREIGN KEY (`primary_dept_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_departments` ADD CONSTRAINT `user_departments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_departments` ADD CONSTRAINT `user_departments_dept_id_fkey` FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_types` ADD CONSTRAINT `approval_types_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `approval_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_dept_level1_id_fkey` FOREIGN KEY (`dept_level1_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_dept_level2_id_fkey` FOREIGN KEY (`dept_level2_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_dept_level3_id_fkey` FOREIGN KEY (`dept_level3_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_nodes` ADD CONSTRAINT `approval_nodes_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `approval_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_nodes` ADD CONSTRAINT `approval_nodes_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
