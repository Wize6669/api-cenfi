/*
  Warnings:

  - You are about to drop the column `simulatorId` on the `Question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_simulatorId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "simulatorId";

-- CreateTable
CREATE TABLE "_SimulatorQuestions" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SimulatorQuestions_AB_unique" ON "_SimulatorQuestions"("A", "B");

-- CreateIndex
CREATE INDEX "_SimulatorQuestions_B_index" ON "_SimulatorQuestions"("B");

-- AddForeignKey
ALTER TABLE "_SimulatorQuestions" ADD CONSTRAINT "_SimulatorQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SimulatorQuestions" ADD CONSTRAINT "_SimulatorQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "Simulator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
