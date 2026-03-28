-- ============================================================
-- Migration : Sécurité + comptes indépendants
-- ============================================================

-- 1. Table des tentatives de connexion (fail-to-ban + historique admin)
CREATE TABLE IF NOT EXISTS "login_attempts" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "ip"        TEXT,
    "success"   BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "login_attempts_email_idx"     ON "login_attempts"("email");
CREATE INDEX IF NOT EXISTS "login_attempts_ip_idx"        ON "login_attempts"("ip");
CREATE INDEX IF NOT EXISTS "login_attempts_createdAt_idx" ON "login_attempts"("createdAt");

-- 2. Table double-facteur (TOTP)
CREATE TABLE IF NOT EXISTS "two_factor" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "secret"     TEXT NOT NULL,
    "enabled"    BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "two_factor_userId_key" ON "two_factor"("userId");

DO $$ BEGIN
    ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Rendre les comptes indépendants
--    Avant : epargneActuelle = total (main + comptes spéciaux)
--    Après : epargneActuelle = solde du compte principal uniquement
--    On soustrait donc les soldes de tous les comptes spéciaux existants.
UPDATE "users" u
SET "epargneActuelle" = GREATEST(0, u."epargneActuelle" - COALESCE(
    (SELECT COALESCE(SUM(c."solde"), 0) FROM "comptes" c WHERE c."userId" = u."id"),
    0
));
