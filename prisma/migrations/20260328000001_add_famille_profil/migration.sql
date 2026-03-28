-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : profil enrichi + feature Famille
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Profil utilisateur enrichi
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- 2. Table Famille
CREATE TABLE IF NOT EXISTS "familles" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "familles_pkey" PRIMARY KEY ("id")
);

-- 3. Table MembreFamille (table de jonction user ↔ famille)
CREATE TABLE IF NOT EXISTS "membres_famille" (
    "familleId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "role"      TEXT NOT NULL DEFAULT 'membre',
    "joinedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membres_famille_pkey" PRIMARY KEY ("familleId", "userId")
);

-- 4. Table InvitationFamille
CREATE TABLE IF NOT EXISTS "invitations_famille" (
    "id"        TEXT NOT NULL,
    "familleId" TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_famille_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "invitations_famille_token_key" ON "invitations_famille"("token");

-- 5. Table CompteFamille
CREATE TABLE IF NOT EXISTS "comptes_famille" (
    "id"        TEXT NOT NULL,
    "familleId" TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "type"      TEXT NOT NULL DEFAULT 'epargne_commune',
    "solde"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "couleur"   TEXT NOT NULL DEFAULT '#10B981',
    "actif"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comptes_famille_pkey" PRIMARY KEY ("id")
);

-- 6. Table ContributionFamille
CREATE TABLE IF NOT EXISTS "contributions_famille" (
    "id"        TEXT NOT NULL,
    "compteId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "montant"   DOUBLE PRECISION NOT NULL,
    "note"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contributions_famille_pkey" PRIMARY KEY ("id")
);

-- 7. Clés étrangères (idempotentes via DO blocks)
DO $$ BEGIN
    ALTER TABLE "membres_famille"
        ADD CONSTRAINT "membres_famille_familleId_fkey"
        FOREIGN KEY ("familleId") REFERENCES "familles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "membres_famille"
        ADD CONSTRAINT "membres_famille_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "invitations_famille"
        ADD CONSTRAINT "invitations_famille_familleId_fkey"
        FOREIGN KEY ("familleId") REFERENCES "familles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "comptes_famille"
        ADD CONSTRAINT "comptes_famille_familleId_fkey"
        FOREIGN KEY ("familleId") REFERENCES "familles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "contributions_famille"
        ADD CONSTRAINT "contributions_famille_compteId_fkey"
        FOREIGN KEY ("compteId") REFERENCES "comptes_famille"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "contributions_famille"
        ADD CONSTRAINT "contributions_famille_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
