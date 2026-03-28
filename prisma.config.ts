import { defineConfig } from "prisma/config";

// DATABASE_URL est construit dynamiquement depuis les variables DB_* au démarrage
// (voir lib/db.ts et scripts/start.js). Ce fichier est lu par les commandes
// Prisma CLI (migrate deploy, migrate dev, db push…).
//
// Le fallback "postgresql://localhost/placeholder" permet à `prisma generate`
// de s'exécuter pendant le build Docker sans avoir de base de données disponible.

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost/placeholder",
  },
});
