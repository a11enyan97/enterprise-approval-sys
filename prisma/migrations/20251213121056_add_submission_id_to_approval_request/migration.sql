-- AlterTable
ALTER TABLE `approval_requests` ADD COLUMN `submission_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
