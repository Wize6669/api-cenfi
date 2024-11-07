/*
  Warnings:

  - You are about to drop the column `vitualSchedules` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "vitualSchedules",
ADD COLUMN     "virtualSchedules" TEXT[];
