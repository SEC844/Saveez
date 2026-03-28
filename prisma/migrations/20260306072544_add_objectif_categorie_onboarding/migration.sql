-- AlterTable
ALTER TABLE "objectifs" ADD COLUMN     "categorie" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false;
