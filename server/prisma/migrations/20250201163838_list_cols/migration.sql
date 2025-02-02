/*
  Warnings:

  - Added the required column `createdById` to the `TodoCollection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TodoCollection" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TodoCollection" ADD CONSTRAINT "TodoCollection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
