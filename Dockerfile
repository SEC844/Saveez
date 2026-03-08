# ============================================================
# Stage 1 – deps : production dependencies only
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# Install ONLY production deps (skip devDependencies)
RUN npm ci --omit=dev

# ============================================================
# Stage 2 – builder : compile the Next.js application
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Prisma: generate the client (platform-specific binaries)
RUN npx prisma generate

# Build the Next.js app (standalone output for minimal image)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================================
# Stage 3 – runner : production image
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# ── Next.js standalone output ─────────────────────────────────
# (copies server.js + its minimal node_modules to /app)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ── Full production node_modules from deps stage ──────────────
# Must come AFTER standalone copy so Prisma CLI + WASM files
# are not overwritten by the standalone's minimal node_modules.
COPY --from=deps /app/node_modules ./node_modules

# ── Replace generated Prisma Client with the platform-correct one ──
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ── Prisma schema & migrations ────────────────────────────────
COPY --from=builder /app/prisma ./prisma
# ── Startup script ───────────────────────────────────────────────
COPY --from=builder /app/scripts ./scripts
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# scripts/start.js bâtit DATABASE_URL depuis les variables DB_*,
# exécute les migrations Prisma, puis démarre le serveur Next.js.
CMD ["node", "scripts/start.js"]
