/*
  Warnings:

  - You are about to drop the column `entityId` on the `Imagen` table. All the data in the column will be lost.
  - Added the required column `questionId` to the `Imagen` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Imagen" DROP COLUMN "entityId",
ADD COLUMN     "questionId" INTEGER NOT NULL;
