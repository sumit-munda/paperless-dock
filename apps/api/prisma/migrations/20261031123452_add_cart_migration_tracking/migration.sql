-- CreateTable
CREATE TABLE "CartMigration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "migrationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartMigration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartMigration_userId_idx" ON "CartMigration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartMigration_userId_migrationId_key" ON "CartMigration"("userId", "migrationId");

-- AddForeignKey
ALTER TABLE "CartMigration" ADD CONSTRAINT "CartMigration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
