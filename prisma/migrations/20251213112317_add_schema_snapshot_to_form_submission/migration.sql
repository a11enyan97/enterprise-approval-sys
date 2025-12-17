/*
  Warnings:

  - Added the required column `schemaSnapshot` to the `form_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `form_submissions` ADD COLUMN `schemaSnapshot` JSON NOT NULL;
