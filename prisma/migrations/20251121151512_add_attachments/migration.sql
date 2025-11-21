/*
  Warnings:

  - You are about to drop the column `completedAt` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the column `currentStatus` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `approval_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `approval_nodes` MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `approval_requests` DROP COLUMN `completedAt`,
    DROP COLUMN `currentStatus`,
    DROP COLUMN `submittedAt`,
    ADD COLUMN `completed_at` DATETIME(3) NULL,
    ADD COLUMN `current_status` ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    ADD COLUMN `submitted_at` DATETIME(3) NULL,
    MODIFY `approval_content` TEXT NULL;

-- CreateTable
CREATE TABLE `approval_attachments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `request_id` BIGINT NOT NULL,
    `attachment_type` ENUM('image', 'table') NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `mime_type` VARCHAR(191) NULL,
    `uploader_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `approval_attachments` ADD CONSTRAINT `approval_attachments_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `approval_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_attachments` ADD CONSTRAINT `approval_attachments_uploader_id_fkey` FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
