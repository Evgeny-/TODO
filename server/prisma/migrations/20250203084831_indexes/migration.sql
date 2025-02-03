-- CreateIndex
CREATE INDEX "Todo_collectionKey_idx" ON "Todo"("collectionKey");

-- CreateIndex
CREATE INDEX "Todo_createdById_idx" ON "Todo"("createdById");

-- CreateIndex
CREATE INDEX "TodoCollection_createdById_idx" ON "TodoCollection"("createdById");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");
