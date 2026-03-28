#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# fix-failed-migration.sh
# Résout l'erreur P3009 : migration échouée 20260328000001_add_famille_profil
#
# Usage : bash scripts/fix-failed-migration.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

MIGRATION_NAME="20260328000001_add_famille_profil"
CONTAINER="saveez_db_dev"

echo "🔧  Résolution de la migration échouée : $MIGRATION_NAME"

# 1. Marquer la migration comme rolled_back dans _prisma_migrations
#    Cela permet à Prisma de la rejouer proprement
docker exec "$CONTAINER" psql -U saveez_user saveez_db -c \
  "UPDATE _prisma_migrations
   SET rolled_back_at = NOW(), finished_at = NULL
   WHERE migration_name = '$MIGRATION_NAME';"

echo "✅  Migration marquée comme annulée dans _prisma_migrations"

# 2. Nettoyer les tables partiellement créées (si elles existent)
#    La migration a peut-être créé certaines tables avant de planter
docker exec "$CONTAINER" psql -U saveez_user saveez_db -c \
  "DROP TABLE IF EXISTS contributions_famille CASCADE;
   DROP TABLE IF EXISTS comptes_famille CASCADE;
   DROP TABLE IF EXISTS invitations_famille CASCADE;
   DROP TABLE IF EXISTS membres_famille CASCADE;
   DROP TABLE IF EXISTS familles CASCADE;"

echo "✅  Tables partiellement créées supprimées"

# 3. Supprimer les colonnes ajoutées à users si elles existent
docker exec "$CONTAINER" psql -U saveez_user saveez_db -c \
  "ALTER TABLE users DROP COLUMN IF EXISTS \"avatarUrl\";
   ALTER TABLE users DROP COLUMN IF EXISTS bio;"

echo "✅  Colonnes users nettoyées"

echo ""
echo "🚀  Vous pouvez maintenant relancer le build :"
echo "    docker compose -f docker-compose.dev.yml up --build"
