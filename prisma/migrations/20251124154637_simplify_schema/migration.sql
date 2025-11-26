/*
  Warnings:

  - You are about to drop the column `type_id` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the `approval_nodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `approval_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `approval_nodes` DROP FOREIGN KEY `approval_nodes_approver_id_fkey`;

-- DropForeignKey
ALTER TABLE `approval_nodes` DROP FOREIGN KEY `approval_nodes_request_id_fkey`;

-- DropForeignKey
ALTER TABLE `approval_requests` DROP FOREIGN KEY `approval_requests_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `approval_types` DROP FOREIGN KEY `approval_types_created_by_fkey`;

-- DropIndex
DROP INDEX `approval_requests_type_id_fkey` ON `approval_requests`;

-- AlterTable
ALTER TABLE `approval_requests` DROP COLUMN `type_id`;

-- DropTable
DROP TABLE `approval_nodes`;

-- DropTable
DROP TABLE `approval_types`;
