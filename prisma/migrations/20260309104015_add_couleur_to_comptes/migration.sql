-- AlterTable
-- Ajouter le champ "couleur" au modèle Compte (couleur hex pour l'interface utilisateur)

ALTER TABLE "comptes" ADD COLUMN "couleur" TEXT NOT NULL DEFAULT '#8B5CF6';

COMMENT ON COLUMN "comptes"."couleur" IS 'Couleur hexadécimale du compte (ex: #8B5CF6 pour violet)';

-- CreateTable
-- Créer la table "transactions" pour l'historique des retraits et transferts

CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "compteSourceId" TEXT,
    "compteDestinationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_compteSourceId_fkey" FOREIGN KEY ("compteSourceId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_compteDestinationId_fkey" FOREIGN KEY ("compteDestinationId") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

