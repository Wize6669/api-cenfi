/*
  Warnings:

  - You are about to drop the column `schedules` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "schedules",
ADD COLUMN     "inPersonSchedules" TEXT[],
ADD COLUMN     "vitualSchedules" TEXT[];
