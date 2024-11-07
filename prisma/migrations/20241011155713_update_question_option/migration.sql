/*
  Warnings:

  - You are about to drop the column `imageName` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `statement` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `imageName` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `statement` on the `Question` table. All the data in the column will be lost.
  - The `justification` column on the `Question` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `content` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Option" DROP COLUMN "imageName",
DROP COLUMN "statement",
ADD COLUMN     "content" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "imageName",
DROP COLUMN "statement",
ADD COLUMN     "content" JSONB NOT NULL,
DROP COLUMN "justification",
ADD COLUMN     "justification" JSONB;
