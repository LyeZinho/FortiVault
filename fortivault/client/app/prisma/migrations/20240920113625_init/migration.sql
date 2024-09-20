-- CreateTable
CREATE TABLE "Connection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acessId" TEXT NOT NULL,
    "acessKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Connection_acessId_key" ON "Connection"("acessId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_acessKey_key" ON "Connection"("acessKey");
