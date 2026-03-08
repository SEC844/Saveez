'use strict';
/**
 * scripts/start.js — Saveez Docker startup script
 *
 * Why this exists:
 *   Docker Compose substitutes ${VAR} in `command:` at PARSE TIME using the HOST
 *   environment, not the container's `environment:` block. This makes it impossible
 *   to build DATABASE_URL from DB_* vars using shell syntax in docker-compose.yml.
 *
 *   This script runs as a Node.js process INSIDE the container, where process.env
 *   already contains all variables from the `environment:` block — no substitution
 *   issues, no shell escaping, works 100% of the time.
 *
 * Steps:
 *   1. Build DATABASE_URL from granular DB_* env vars (if not already set).
 *   2. Run `prisma migrate deploy` with the resolved DATABASE_URL.
 *   3. Hand over to the Next.js standalone server (node server.js).
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── 1. Build DATABASE_URL from granular DB_* vars ─────────────────────────────
if (!process.env.DATABASE_URL) {
    const {
        DB_HOST,
        DB_USER = 'saveez_user',
        DB_PASSWORD = '',
        DB_PORT = '5432',
        DB_NAME = 'saveez_db',
    } = process.env;

    if (!DB_HOST) {
        console.error('[saveez] FATAL: DB_HOST is not set.');
        console.error('[saveez] Set DB_HOST (and DB_USER, DB_PASSWORD, DB_NAME) in your docker-compose environment block.');
        process.exit(1);
    }

    // encodeURIComponent handles special chars in passwords (@, :, /, etc.)
    process.env.DATABASE_URL =
        `postgresql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

    console.log(`[saveez] DATABASE_URL built from DB_* vars (${DB_HOST}:${DB_PORT}/${DB_NAME})`);
}

// ── 2. Prisma migrations ───────────────────────────────────────────────────────
const prismaBin = path.join(ROOT, 'node_modules', '.bin', 'prisma');

console.log('[saveez] Running prisma migrate deploy…');
try {
    execSync(`${prismaBin} migrate deploy`, {
        stdio: 'inherit',
        env: process.env,
        cwd: ROOT,
    });
} catch (err) {
    console.error('[saveez] Migration failed — aborting startup.');
    process.exit(1);
}

// ── 3. Start Next.js standalone server ────────────────────────────────────────
console.log('[saveez] Starting Next.js server…');

const server = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: ROOT,
});

server.on('error', (err) => {
    console.error('[saveez] Failed to start server:', err.message);
    process.exit(1);
});

server.on('close', (code) => {
    process.exit(code ?? 0);
});

// Forward SIGTERM / SIGINT to the child so graceful shutdown works
['SIGTERM', 'SIGINT'].forEach((sig) =>
    process.on(sig, () => server.kill(sig))
);
