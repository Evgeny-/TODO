/*
  Warnings:

  - You are about to drop the column `state` on the `Todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "state",
ADD COLUMN     "status" "TodoStatus" NOT NULL DEFAULT 'TODO';
