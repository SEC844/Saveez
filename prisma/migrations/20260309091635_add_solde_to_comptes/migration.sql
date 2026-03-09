-- AlterTable: Ajouter la colonne solde aux comptes
ALTER TABLE "comptes" ADD COLUMN "solde" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Mise à jour du commentaire du type pour inclure "standard" et "imprevus"
COMMENT ON COLUMN "comptes"."type" IS 'Type de compte: standard | imprevus | vacances | autre';

-- Migration des données: Créer des comptes de base pour chaque utilisateur existant
-- Compte 1: Standard (solde = épargne actuelle)
INSERT INTO "comptes" ("id", "userId", "type", "label", "actif", "solde", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u.id,
  'standard'::text,
  'Épargne Standard'::text,
  true,
  u."epargneActuelle",
  NOW()
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "comptes" c 
  WHERE c."userId" = u.id AND c."type" = 'standard'
);

-- Compte 2: Imprévus (solde initial = 0)
INSERT INTO "comptes" ("id", "userId", "type", "label", "actif", "solde", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u.id,
  'imprevus'::text,
  'Imprévus'::text,
  true,
  0,
  NOW()
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "comptes" c 
  WHERE c."userId" = u.id AND c."type" = 'imprevus'
);
