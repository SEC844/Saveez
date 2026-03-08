import { PrismaClient } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// Build DATABASE_URL from granular DB_* env vars when not explicitly provided.
// This supports Docker / Unraid deployments where each credential is set as an
// individual environment variable (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
// If DATABASE_URL is already set (e.g. local dev via .env), it takes precedence.
// ──────────────────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const user = process.env.DB_USER ?? "saveez_user";
  const pwd = encodeURIComponent(process.env.DB_PASSWORD ?? ""); // encode special chars
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? "5432";
  const db = process.env.DB_NAME ?? "saveez_db";
  process.env.DATABASE_URL = `postgresql://${user}:${pwd}@${host}:${port}/${db}?schema=public`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Determine Prisma log level from LOG_LEVEL environment variable.
// Supports: error | warn | info | verbose | debug (maps to Prisma log events)
// ──────────────────────────────────────────────────────────────────────────────
type PrismaLogLevel = "query" | "info" | "warn" | "error";

function getPrismaLogLevels(): PrismaLogLevel[] {
  const level = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (process.env.NODE_ENV === "development") return ["query", "error", "warn"];
  if (level === "debug" || level === "verbose") return ["query", "info", "warn", "error"];
  if (level === "info") return ["info", "warn", "error"];
  if (level === "warn") return ["warn", "error"];
  return ["error"];
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: getPrismaLogLevels(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
