/*
  Warnings:

  - Made the column `durationReview` on table `Simulator` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Simulator" ALTER COLUMN "durationReview" SET NOT NULL;
