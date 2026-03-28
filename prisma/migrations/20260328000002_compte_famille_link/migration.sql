-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : lien Compte ↔ Famille (comptes familiaux partagés)
-- ─────────────────────────────────────────────────────────────────────────────

-- Ajouter la colonne familleId sur comptes
ALTER TABLE "comptes" ADD COLUMN IF NOT EXISTS "familleId" TEXT;

-- Clé étrangère (idempotente)
DO $$ BEGIN
    ALTER TABLE "comptes"
        ADD CONSTRAINT "comptes_familleId_fkey"
        FOREIGN KEY ("familleId") REFERENCES "familles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
