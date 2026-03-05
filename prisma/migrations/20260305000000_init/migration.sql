-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "objectifBase" DOUBLE PRECISION NOT NULL DEFAULT 400,
    "fondsSecurite" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "epargneActuelle" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epargne_mensuelles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epargne_mensuelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imprévus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "dureeRemboursement" INTEGER NOT NULL,
    "montantMensuel" DOUBLE PRECISION NOT NULL,
    "moisDebut" INTEGER NOT NULL,
    "anneeDebut" INTEGER NOT NULL,
    "montantRembourse" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estSolde" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imprévus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "epargne_mensuelles_userId_annee_mois_key" ON "epargne_mensuelles"("userId", "annee", "mois");

-- AddForeignKey
ALTER TABLE "epargne_mensuelles" ADD CONSTRAINT "epargne_mensuelles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imprévus" ADD CONSTRAINT "imprévus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
