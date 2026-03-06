-- AlterTable
ALTER TABLE "epargne_mensuelles" ADD COLUMN     "repartition" JSONB;

-- AlterTable
ALTER TABLE "objectifs" ADD COLUMN     "compteId" TEXT;

-- CreateTable
CREATE TABLE "comptes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comptes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "objectifs" ADD CONSTRAINT "objectifs_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comptes" ADD CONSTRAINT "comptes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
