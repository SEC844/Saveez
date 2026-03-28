-- Migration corrective: Supprimer les comptes système (standard et imprevus)
-- Ces concepts existent déjà (User.epargneActuelle et table Imprevu)
-- Seuls les comptes "vacances" et "autre" sont de vrais comptes

-- Supprimer les comptes de type "standard" et "imprevus"
DELETE FROM "comptes" WHERE "type" IN ('standard', 'imprevus');

-- Mise à jour du commentaire pour refléter les types valides
COMMENT ON COLUMN "comptes"."type" IS 'Type de compte: vacances | autre';
