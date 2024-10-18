/*
  Warnings:

  - You are about to drop the column `answer` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "isCorrect" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "answer";
