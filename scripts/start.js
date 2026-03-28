'use strict';
/**
 * scripts/start.js — Saveez Docker startup script
 *
 * Steps:
 *   1. Vérifier que DATABASE_URL est défini (requis).
 *   2. Synchroniser le schéma Prisma avec la base (prisma db push).
 *   3. Démarrer le serveur Next.js standalone.
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ── 1. Vérifier DATABASE_URL ────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
    console.error('[saveez] FATAL: DATABASE_URL is not set.');
    console.error('[saveez] Définissez DATABASE_URL dans docker-compose.yml ou votre environnement.');
    process.exit(1);
}

console.log('[saveez] DATABASE_URL detected, proceeding…');

// ── 2. Prisma db push ───────────────────────────────────────────────────────
const prismaBin = path.join(ROOT, 'node_modules', '.bin', 'prisma');

console.log('[saveez] Running prisma db push…');
const pushResult = spawnSync(
    prismaBin,
    ['db', 'push', '--accept-data-loss'],
    { stdio: 'inherit', env: process.env, cwd: ROOT }
);
if (pushResult.status !== 0) {
    console.error('[saveez] Schema push failed — aborting startup.');
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
