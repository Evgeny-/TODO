/*
  Warnings:

  - You are about to drop the column `listKey` on the `Todo` table. All the data in the column will be lost.
  - You are about to drop the `TodoList` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `collectionKey` to the `Todo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_listKey_fkey";

-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "listKey",
ADD COLUMN     "collectionKey" TEXT NOT NULL;

-- DropTable
DROP TABLE "TodoList";

-- CreateTable
CREATE TABLE "TodoCollection" (
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TodoCollection_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_collectionKey_fkey" FOREIGN KEY ("collectionKey") REFERENCES "TodoCollection"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
