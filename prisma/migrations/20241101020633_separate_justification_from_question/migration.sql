/*
  Warnings:

  - You are about to drop the column `justification` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "justification";

-- CreateTable
CREATE TABLE "Justification" (
    "id" SERIAL NOT NULL,
    "content" JSONB,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "Justification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Justification_questionId_key" ON "Justification"("questionId");

-- AddForeignKey
ALTER TABLE "Justification" ADD CONSTRAINT "Justification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
