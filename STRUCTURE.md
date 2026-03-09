# 📋 STRUCTURE.md — Référentiel Technique Saveez

> **Version :** 1.0.3  
> **Date :** Mars 2026  
> **Repo :** https://github.com/SEC844/Saveez.git  
> **Branches :** `dev` (développement) → `main` (production)

---

## 📖 TABLE DES MATIÈRES

1. [Vue d'ensemble](#-vue-densemble)
2. [Stack Technique](#-stack-technique)
3. [Architecture Applicative](#-architecture-applicative)
4. [Structure des Dossiers](#-structure-des-dossiers)
5. [Modèle de Données](#-modèle-de-données)
6. [Système de Sécurité](#-système-de-sécurité)
7. [Infrastructure Docker](#-infrastructure-docker)
8. [Système de Routage](#-système-de-routage)
9. [Composants UI](#-composants-ui)
10. [Logique Métier](#-logique-métier)
11. [Workflow de Développement](#-workflow-de-développement)
12. [Variables d'Environnement](#-variables-denvironnement)
13. [Points d'Attention](#-points-dattention)

---

## 🎯 VUE D'ENSEMBLE

**Saveez** est une application web de gestion d'épargne personnelle, conteneurisée avec Docker, offrant :
- Suivi des mises de côté mensuelles
- Gestion des imprévus avec remboursement mensualisé
- Définition d'objectifs temporels (vacances, projets)
- Système de comptes multiples (standard, vacances, autres)
- Projections financières et statistiques avancées
- Interface Apple-like (minimaliste, smooth, dark/light mode)

**Paradigme :** Application mono-utilisateur ultra-sécurisée, déployable sur Unraid ou tout serveur Docker.

---

## 🛠 STACK TECHNIQUE

### **Core Framework**
- **Next.js 16.1.6** (App Router + React Compiler activé)
- **React 19.2.3** + **React DOM 19.2.3**
- **TypeScript 5** (strict mode activé)
- **Node.js 22-alpine** (pour Docker)

### **Base de Données & ORM**
- **PostgreSQL 16** (via conteneur Docker)
- **Prisma 6.19.2** (Client + Migrations)
  - Mode : `postgresql`
  - URL : variable (construite dynamiquement)

### **Authentification & Sécurité**
- **NextAuth 5.0.0-beta.30** (Auth.js)
  - Provider : `Credentials`
  - Session : JWT (30 jours)
  - Cookies : HttpOnly, SameSite=lax, Secure conditionnel (HTTPS uniquement)
- **bcryptjs 3.0.3** (hachage de mots de passe)
- **rate-limiter-flexible 9.1.1** (protection brute-force)
  - Limite : 5 tentatives / 15 minutes par IP

### **UI/UX & Styling**
- **Tailwind CSS 4** (v4 @tailwindcss/postcss)
- **Shadcn/UI** (radix-ui 1.4.3 + composants customs)
- **Framer Motion 12.35.0** (animations fluides)
- **Lucide React 0.577.0** (icônes)
- **next-themes 0.4.6** (dark/light mode)
- **Recharts 3.7.0** (graphiques de données)

### **Tooling & Dev**
- **ESLint 9** + **eslint-config-next**
- **Babel React Compiler 1.0.0**
- **Turbopack** (build rapide)

### **Infrastructure**
- **Docker** + **Docker Compose**
- Multi-stage build (deps → builder → runner)
- Image finale : `node:22-alpine` (~minimal)
- PostgreSQL externe en production (Unraid)

---

## 🏗 ARCHITECTURE APPLICATIVE

### **Pattern Architectural**
- **Monolithe Next.js** (Frontend + Backend dans une seule app)
- **App Router** (Next.js 13+)
- **Server Components** par défaut
- **Server Actions** pour la logique métier (pas d'API REST classique)

### **Flux de Données**
```
Client (Browser)
    ↓
Next.js App Router (app/*)
    ↓
Server Components / Pages
    ↓
Server Actions (app/actions/*)
    ↓
Prisma Client (lib/db.ts)
    ↓
PostgreSQL Database
```

### **Gestion d'État**
- **Pas de Redux / Zustand** (Server Components + Server Actions suffisent)
- État client minimal (React useState pour modals/forms)
- Session gérée par NextAuth (JWT)

### **Render Patterns**
- **SSR** : Pages principales (dashboard, historique, etc.)
- **CSR** : Composants interactifs (modals, charts, forms)
- **Force Dynamic** : `export const dynamic = "force-dynamic"` sur pages nécessitant des données à jour

---

## 📂 STRUCTURE DES DOSSIERS

```
Saveez/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Route group (auth screens)
│   │   └── login/
│   │       ├── page.tsx              # Page de connexion
│   │       ├── actions.ts            # Server action loginAction
│   │       ├── LoginForm.tsx         # Formulaire client
│   │       └── ClearSession.tsx      # Clear session cookie
│   ├── (setup)/                      # Route group (onboarding)
│   │   └── setup/
│   │       ├── page.tsx              # Configuration initiale (obsolète ?)
│   │       ├── actions.ts
│   │       └── SetupForm.tsx
│   ├── actions/                      # Server Actions (logique métier)
│   │   ├── compte.ts                 # CRUD Comptes (vacances, autre)
│   │   ├── epargne-mensuelle.ts      # Ajout/modif épargne mensuelle
│   │   ├── imprevu.ts                # CRUD Imprévus
│   │   ├── objectif.ts               # CRUD Objectifs temporels
│   │   └── user-settings.ts          # Modif paramètres utilisateur
│   ├── api/                          # API Routes (NextAuth uniquement)
│   │   └── auth/[...nextauth]/
│   │       └── route.ts              # Handlers NextAuth
│   ├── historique/                   # Page historique des mois
│   │   ├── page.tsx
│   │   └── HistoriqueClient.tsx
│   ├── imprevus/                     # Page liste imprévus actifs
│   │   └── page.tsx
│   ├── objectifs/                    # Page gestion objectifs
│   │   ├── page.tsx
│   │   └── ObjectifsList.tsx
│   ├── parametres/                   # Page paramètres utilisateur
│   │   ├── page.tsx
│   │   ├── SettingsForm.tsx
│   │   ├── CompteSettings.tsx        # Gestion comptes spéciaux
│   │   └── DangerZoneCard.tsx        # Reset données
│   ├── projections/                  # Page projections fin d'année
│   │   ├── page.tsx
│   │   └── ProjectionsClient.tsx
│   ├── globals.css                   # Styles globaux (Tailwind v4)
│   ├── layout.tsx                    # Root layout (Providers, fonts)
│   └── page.tsx                      # Dashboard principal (/)
│
├── components/                       # Composants React
│   ├── dashboard/                    # Composants spécifiques dashboard
│   │   ├── AddEpargneModal.tsx       # Modal ajout épargne mensuelle
│   │   ├── AddImprevuModal.tsx       # Modal ajout imprévu
│   │   ├── AddObjectifModal.tsx      # Modal création objectif
│   │   ├── DashboardShell.tsx        # Layout dashboard (Sidebar + main)
│   │   ├── EpargneChart.tsx          # Graphique Recharts
│   │   ├── FondsGauge.tsx            # Jauge fonds de sécurité
│   │   ├── ImprevuProgressCard.tsx   # Carte progression imprévu
│   │   ├── MobileNav.tsx             # Navigation mobile (drawer)
│   │   ├── OnboardingModal.tsx       # Popup première connexion
│   │   ├── Sidebar.tsx               # Barre latérale desktop
│   │   ├── StatCard.tsx              # Carte statistique animée
│   │   └── WhatIfModal.tsx           # Mode simulation
│   ├── ui/                           # Shadcn/UI composants
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── ConfirmDialog.tsx         # Dialog de confirmation
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   └── tooltip.tsx
│   ├── Providers.tsx                 # SessionProvider + ThemeProvider + TooltipProvider
│   └── ThemeToggle.tsx               # Switch dark/light mode
│
├── lib/                              # Utilitaires & logique métier
│   ├── db.ts                         # Instance Prisma Client (singleton)
│   ├── epargne.ts                    # Calculs métier (objectifs, écarts, projections)
│   ├── queries.ts                    # Requêtes Prisma réutilisables
│   ├── rate-limit.ts                 # Rate limiter (login)
│   └── utils.ts                      # Helpers (clsx, cn, etc.)
│
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                 # Schéma de BDD (7 models)
│   └── migrations/                   # Historique migrations SQL
│       ├── migration_lock.toml
│       ├── 20260305000000_init/
│       ├── 20260305154827_add_objectifs_actionlogs_revenu/
│       ├── 20260306072544_add_objectif_categorie_onboarding/
│       └── 20260306080123_add_comptes_repartition/
│
├── public/                           # Assets statiques
│
├── scripts/                          # Scripts utilitaires
│   └── start.js                      # Startup Docker (build DATABASE_URL + migrate + start)
│
├── auth.ts                           # Configuration NextAuth (handlers, callbacks)
├── Dockerfile                        # Multi-stage build (deps → builder → runner)
├── docker-compose.yml                # Config prod (app + PostgreSQL externe)
├── docker-compose.dev.yml            # Config dev (app + PostgreSQL local)
├── components.json                   # Config Shadcn/UI
├── next.config.ts                    # Config Next.js (standalone, headers, turbopack)
├── tsconfig.json                     # Config TypeScript
├── eslint.config.mjs                 # Config ESLint
├── postcss.config.mjs                # Config PostCSS (Tailwind v4)
├── package.json                      # Dépendances NPM
├── CLAUDE.md                         # Brief initial du projet
└── STRUCTURE.md                      # 🔥 Ce document
```

---

## 🗄 MODÈLE DE DONNÉES

### **Schéma Prisma** (`prisma/schema.prisma`)

#### **1. User** (Utilisateur unique)
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  name            String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Paramètres
  objectifBase    Float    @default(400)   // Objectif de repli (€)
  fondsSecurite   Float    @default(5000)  // Seuil fonds de sécurité (€)
  epargneActuelle Float    @default(0)     // Solde courant (€)
  revenuNet       Float?                   // Revenu mensuel net (€)
  onboardingDone  Boolean  @default(false) // Premier paramétrage effectué
  
  // Relations
  epargneMensuelles EpargneMensuelle[]
  imprévus          Imprevu[]
  objectifs         Objectif[]
  actionLogs        ActionLog[]
  comptes           Compte[]
}
```

#### **2. EpargneMensuelle** (Entrée mensuelle d'épargne)
```prisma
model EpargneMensuelle {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  annee       Int
  mois        Int      // 1–12
  montant     Float    // Somme réellement mise de côté (€)
  note        String?  // Note libre
  repartition Json?    // { standard: X, [compteId]: X } répartition par compte
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, annee, mois])
}
```

#### **3. Imprevu** (Dépenses exceptionnelles à rembourser)
```prisma
model Imprevu {
  id                 String   @id @default(cuid())
  userId             String
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  nom                String   // Ex: "Machine à laver"
  montantTotal       Float    // Montant prélevé (€)
  dureeRemboursement Int      // Durée en mois
  montantMensuel     Float    // = montantTotal / dureeRemboursement
  
  moisDebut          Int      // 1–12
  anneeDebut         Int
  
  // Progression
  montantRembourse   Float    @default(0)
  estSolde           Boolean  @default(false)
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

#### **4. Objectif** (Objectifs d'épargne temporels)
```prisma
model Objectif {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  montant   Float     // Montant mensuel cible (€)
  label     String?   // Description
  categorie String    @default("standard") // "standard" | "vacances" | "autre"
  compteId  String?   // FK → Compte (pour objectifs spéciaux)
  compte    Compte?   @relation(fields: [compteId], references: [id], onDelete: SetNull)
  
  dateDebut DateTime  // Début de période
  dateFin   DateTime? // Fin de période (null = sans fin)
  preset    String?   // "1m" | "3m" | "6m" | "1y" | "custom"
  
  createdAt DateTime  @default(now())
}
```

#### **5. Compte** (Comptes spéciaux : vacances, autre)
```prisma
model Compte {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      String     // "vacances" | "autre"
  label     String     // Nom du compte
  actif     Boolean    @default(true)
  
  objectifs Objectif[]
  createdAt DateTime   @default(now())
}
```

#### **6. ActionLog** (Journal d'historique)
```prisma
model ActionLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      String   // "add_epargne" | "add_imprevu" | "delete_imprevu" | etc.
  label     String   // Description lisible
  montant   Float?   // Montant associé
  meta      String?  // JSON pour données supplémentaires
  
  createdAt DateTime @default(now())
}
```

### **Relations Clés**
- **User** → `1:N` → **EpargneMensuelle** (une entrée par mois maximum)
- **User** → `1:N` → **Imprevu** (liste des dépenses exceptionnelles)
- **User** → `1:N` → **Objectif** (objectifs temporels)
- **User** → `1:N` → **Compte** (comptes séparés : vacances, autre)
- **Compte** → `1:N` → **Objectif** (un objectif peut être lié à un compte)

---

## 🔒 SYSTÈME DE SÉCURITÉ

### **Authentification**
- **Provider :** NextAuth Credentials (email + password)
- **Hachage :** bcryptjs (salt rounds élevé)
- **Session :** JWT (30 jours, stocké en cookie)

### **Cookies**
```typescript
cookies: {
  sessionToken: {
    options: {
      httpOnly: true,           // Non accessible via JavaScript
      sameSite: "lax",          // Protection CSRF
      secure: HTTPS_ONLY,       // Conditionnel (false en HTTP local)
      path: "/",
    },
  },
}
```

### **Rate Limiting**
- **Librairie :** rate-limiter-flexible (in-memory)
- **Limite :** 5 tentatives / 15 minutes par IP
- **Implémentation :** `lib/rate-limit.ts` → appelé dans `loginAction`

### **Headers de Sécurité** (`next.config.ts`)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000 (HTTPS uniquement)
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### **Protection XSS / CSRF**
- **XSS :** React auto-échappe les variables (pas de dangerouslySetInnerHTML)
- **CSRF :** SameSite=lax + NextAuth intégré

### **Bonnes Pratiques**
- Aucun secret en code dur (tout en variables d'environnement)
- `process.env.NEXTAUTH_SECRET` obligatoire (généré via `openssl rand -base64 32`)
- Pas de données sensibles exposées côté client

---

## 🐳 INFRASTRUCTURE DOCKER

### **1. Dockerfile** (Multi-stage Build)

#### **Stage 1 : deps** (production dependencies)
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
```

#### **Stage 2 : builder** (compilation)
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate       # Génère le client Prisma
RUN npm run build             # Build Next.js (standalone)
```

#### **Stage 3 : runner** (image finale)
```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Copie fichiers standalone + static + node_modules prod + Prisma
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

USER nextjs
EXPOSE 3000
CMD ["node", "scripts/start.js"]
```

### **2. docker-compose.yml** (Production)
```yaml
services:
  saveez:
    image: ghcr.io/sec844/saveez:latest
    container_name: saveez
    restart: unless-stopped
    environment:
      DB_HOST: 192.168.1.100    # PostgreSQL externe
      DB_PORT: 5432
      DB_USER: saveez_user
      DB_PASSWORD: CHANGE_ME
      DB_NAME: saveez_db
      NEXTAUTH_SECRET: CHANGE_ME
      NEXTAUTH_URL: http://192.168.1.100:3000
      NODE_ENV: production
      LOG_LEVEL: info
    ports:
      - "3000:3000"
    command: ["node", "scripts/start.js"]
```

### **3. docker-compose.dev.yml** (Développement local)
```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: saveez_db_dev
    environment:
      POSTGRES_USER: saveez_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: saveez_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://saveez_user:${POSTGRES_PASSWORD}@db:5432/saveez_db
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: http://localhost:3000
```

### **4. scripts/start.js** (Startup Script)
**Pourquoi il existe :**  
Docker Compose substitue `${VAR}` au moment du parsing (environnement hôte), pas au runtime. Impossible de construire `DATABASE_URL` avec des variables d'environnement Docker. Ce script Node.js tourne **dans le conteneur** et a accès à tous les `process.env`.

**Étapes :**
1. Construit `DATABASE_URL` à partir de `DB_HOST`, `DB_USER`, etc.
2. Lance `prisma migrate deploy` (applique les migrations)
3. Démarre le serveur Next.js (`node server.js`)

---

## 🧭 SYSTÈME DE ROUTAGE

### **App Router (Next.js 13+)**
| Route | Fichier | Type | Protection | Description |
|-------|---------|------|------------|-------------|
| `/` | `app/page.tsx` | SSR | ✅ Auth | Dashboard principal |
| `/login` | `app/(auth)/login/page.tsx` | SSR | ❌ Public | Page de connexion |
| `/setup` | `app/(setup)/setup/page.tsx` | SSR | ✅ Auth | Configuration initiale (obsolète ?) |
| `/historique` | `app/historique/page.tsx` | SSR | ✅ Auth | Historique des mois passés |
| `/imprevus` | `app/imprevus/page.tsx` | SSR | ✅ Auth | Liste des imprévus actifs |
| `/objectifs` | `app/objectifs/page.tsx` | SSR | ✅ Auth | Gestion des objectifs temporels |
| `/parametres` | `app/parametres/page.tsx` | SSR | ✅ Auth | Paramètres utilisateur |
| `/projections` | `app/projections/page.tsx` | SSR | ✅ Auth | Projections fin d'année |
| `/api/auth/[...nextauth]` | `app/api/auth/[...nextauth]/route.ts` | API | ❌ Public | Handlers NextAuth |

### **Protection des Routes**
Toutes les pages protégées utilisent le pattern suivant :
```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  
  // ... reste de la page
}
```

---

## 🎨 COMPOSANTS UI

### **Design System**
- **Palette :** Variables CSS (`--color-*`) définies dans `globals.css`
- **Thème :** Dark/Light (via `next-themes` + classe `.dark`)
- **Typographie :** Inter (font-sans, variable `--font-inter`)
- **Animations :** Framer Motion (motion.div, AnimatePresence)

### **Composants Shadcn/UI Utilisés**
- `Button` : Boutons avec variants (default, outline, ghost, destructive)
- `Card` : Cartes de contenu
- `Dialog` : Modals
- `Sheet` : Drawer mobile
- `Badge` : Badges de statut
- `Progress` : Barres de progression
- `Separator` : Séparateurs horizontaux
- `Tooltip` : Info-bulles

### **Composants Customs Clés**
| Composant | Chemin | Rôle |
|-----------|--------|------|
| `DashboardShell` | `components/dashboard/` | Layout global (Sidebar + main) |
| `StatCard` | `components/dashboard/` | Carte statistique animée (Framer Motion) |
| `EpargneChart` | `components/dashboard/` | Graphique Recharts (courbes épargne) |
| `FondsGauge` | `components/dashboard/` | Jauge fonds de sécurité (CircularProgressbar) |
| `ImprevuProgressCard` | `components/dashboard/` | Carte progression imprévu individuelle |
| `AddEpargneModal` | `components/dashboard/` | Modal ajout épargne mensuelle (+ répartition) |
| `AddImprevuModal` | `components/dashboard/` | Modal ajout imprévu |
| `WhatIfModal` | `components/dashboard/` | Mode simulation ("What If") |
| `OnboardingModal` | `components/dashboard/` | Popup première connexion |
| `Sidebar` | `components/dashboard/` | Navigation desktop |
| `MobileNav` | `components/dashboard/` | Navigation mobile (drawer) |
| `ThemeToggle` | `components/` | Switch dark/light mode |
| `Providers` | `components/` | Providers React (Session, Theme, Tooltip) |

---

## 🧮 LOGIQUE MÉTIER

### **Fichiers Clés**
| Fichier | Rôle |
|---------|------|
| `lib/epargne.ts` | **CŒUR DE LA LOGIQUE MÉTIER** : Calculs objectifs, écarts, projections |
| `lib/queries.ts` | Requêtes Prisma réutilisables (getDashboardData, getGraphData) |
| `app/actions/*.ts` | Server Actions (CRUD épargne, imprévus, objectifs, paramètres) |

### **Fonctions Principales** (`lib/epargne.ts`)

#### **1. getObjectifBaseForMonth(objectifBase, objectifs, annee, mois)**
Retourne l'objectif **standard** actif pour un mois donné.  
Priorité : Objectif temporel standard actif → sinon `objectifBase` (fallback).

#### **2. getRemboursementActif(imprévus, annee, mois)**
Calcule le montant total de remboursement d'imprévus pour un mois donné.  
Filtre les imprévus dont le remboursement est en cours pendant ce mois.

#### **3. getObjectifBreakdownForMonth(objectifBase, imprévus, annee, mois, objectifs)**
Décompose l'objectif mensuel total par catégorie :
```typescript
{
  standard: number,          // Objectif de base (ou temporel standard)
  remboursements: number,    // Somme des remboursements imprévus
  total: number,             // standard + remboursements + speciaux
}
```

#### **4. getObjectifDynamique(objectifBase, imprévus, annee, mois, objectifs)**
**OBSOLÈTE** — Remplacé par `getObjectifBreakdownForMonth`.  
Retournait l'objectif total du mois (base + remboursements).

#### **5. getEcart(montantReel, objectifMois)**
Calcule l'écart entre le montant réellement épargné et l'objectif du mois.  
Retour : `+200` (bonus) ou `-100` (déficit).

#### **6. getProjectionFinAnnee(epargneActuelle, objectifBase, imprévus, epargneMensuelles, currentYear, objectifs, currentMonth)**
Calcule la projection de fin d'année :
- Part 1 : Épargne déjà enregistrée cette année (somme des `EpargneMensuelle`)
- Part 2 : Projection des mois restants (objectif moyen × mois restants)
- Total : `epargneActuelle + somme enregistrée + projection`

Retour :
```typescript
{
  projection: number,              // Épargne estimée au 31/12
  totalEpargnéCetteAnnee: number, // Déjà enregistré cette année
}
```

---

## 🔄 WORKFLOW DE DÉVELOPPEMENT

### **Branches Git**
- `dev` : Branche de développement (commits quotidiens)
- `main` : Branche de production (merges après tests OK)

### **Cycle de Développement**
```bash
# 1. Travailler sur dev
git checkout dev
git pull origin dev

# 2. Développer / tester localement
# (Docker Desktop + docker-compose.dev.yml)
docker compose -f docker-compose.dev.yml up --build

# 3. Commit & push sur dev
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin dev

# 4. Tests OK → merge sur main
git checkout main
git merge dev
git push origin main

# 5. CI/CD (GitHub Actions) → build image Docker → push sur GHCR
# (Image : ghcr.io/sec844/saveez:latest)
```

### **Commandes Docker Utiles**
```bash
# Dev local (PostgreSQL + App)
docker compose -f docker-compose.dev.yml up --build

# Prod (App uniquement, PostgreSQL externe)
docker compose pull
docker compose up -d

# Logs
docker logs -f saveez

# Shell dans le conteneur
docker exec -it saveez sh

# Rebuild complet
docker compose down -v
docker compose -f docker-compose.dev.yml up --build
```

### **Migrations Prisma**
```bash
# Créer une migration (dev)
npx prisma migrate dev --name nom_migration

# Appliquer les migrations (prod, automatique via start.js)
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio
```

---

## 🔧 VARIABLES D'ENVIRONNEMENT

### **Développement Local** (`.env`)
```bash
# Base de données
DATABASE_URL="postgresql://saveez_user:password@localhost:5432/saveez_db?schema=public"
POSTGRES_USER=saveez_user
POSTGRES_PASSWORD=password
POSTGRES_DB=saveez_db

# Auth
NEXTAUTH_SECRET="votre_secret_genere_avec_openssl"
NEXTAUTH_URL="http://localhost:3000"

# Optionnel
LOG_LEVEL=info
NODE_ENV=development
```

### **Production Docker** (docker-compose.yml)
```yaml
environment:
  # Base de données (construite dynamiquement par start.js)
  DB_HOST: 192.168.1.100
  DB_PORT: 5432
  DB_USER: saveez_user
  DB_PASSWORD: votre_mot_de_passe
  DB_NAME: saveez_db
  
  # Auth
  NEXTAUTH_SECRET: votre_secret_openssl
  NEXTAUTH_URL: http://192.168.1.100:3000
  
  # App
  NODE_ENV: production
  LOG_LEVEL: info
```

### **Génération NEXTAUTH_SECRET**
```bash
openssl rand -base64 32
```

---

## ⚠️ POINTS D'ATTENTION

### **1. Sécurité**
- ✅ **Passwords hachés** (bcryptjs) — JAMAIS en clair
- ✅ **Rate limiting** activé (5 tentatives / 15 min)
- ✅ **Headers sécurisés** (X-Frame-Options, CSP, etc.)
- ⚠️ **Rate limiter in-memory** : Resets à chaque redémarrage. Considérer Redis/ioredis pour production multi-instances.

### **2. Base de Données**
- ⚠️ **Pas de backup automatique** : Mettre en place une sauvegarde régulière de PostgreSQL (cron).
- ✅ **Migrations versionnées** : Ne jamais modifier les migrations existantes, toujours créer une nouvelle.

### **3. Docker**
- ✅ **Multi-stage build** : Image finale ~150MB (ultra-légère)
- ⚠️ **PostgreSQL externe en prod** : S'assurer que le conteneur Saveez peut joindre PostgreSQL (réseau Docker).
- ⚠️ **Volumes persistants** : En dev, `postgres_data_dev` volume est créé (données conservées).

### **4. Performance**
- ✅ **Standalone output** : Next.js génère un serveur minimal (pas de node_modules complets).
- ✅ **React Compiler** activé (optimisations).
- ⚠️ **Recharts** peut être lourd : Limiter le nombre de points sur les graphiques (max 12 mois recommandé).

### **5. UI/UX**
- ✅ **Animations Framer Motion** : Smooth, mais éviter d'en abuser (surcharge).
- ✅ **Dark/Light mode** : Natif via `next-themes` (pas de flash).
- ⚠️ **Mobile-first** : Tester sur mobile (MobileNav activé < 768px).

### **6. Logique Métier**
- ⚠️ **Projections basées sur objectif moyen** : Si l'utilisateur change souvent ses objectifs, la projection peut être imprécise.
- ⚠️ **Unicité EpargneMensuelle** : Une seule entrée par mois/année (@@unique). Si l'utilisateur modifie, c'est un UPDATE, pas un INSERT.

### **7. CI/CD**
- ✅ **GitHub Actions** : À mettre en place pour auto-build l'image Docker sur push `main`.
- ⚠️ **GHCR** (GitHub Container Registry) : Nécessite un token GitHub avec permissions adéquates.

---

## 📚 RÉFÉRENCES TECHNIQUES

### **Documentation Officielle**
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://authjs.dev)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/en-US/)
- [Shadcn/UI](https://ui.shadcn.com/)

### **Concepts Clés**
- **App Router** : Routing basé fichiers, Server Components par défaut, Server Actions.
- **Server Components** : Composants React qui s'exécutent côté serveur (pas de JavaScript envoyé au client).
- **Server Actions** : Fonctions serveur appelables depuis le client (via `"use server"`).
- **JWT Session** : Session stockée en cookie (pas de BDD de sessions).

---

## ✅ CHECKLIST PRÉ-PRODUCTION

Avant de déployer sur `main` :

- [ ] Toutes les migrations Prisma appliquées et testées
- [ ] `NEXTAUTH_SECRET` généré avec `openssl` (32 caractères min)
- [ ] Variables `DB_*` correctement renseignées dans `docker-compose.yml`
- [ ] PostgreSQL externe accessible depuis le conteneur Saveez
- [ ] Tests manuels : Login, ajout épargne, ajout imprévu, objectifs, projections
- [ ] Dark/Light mode fonctionnels
- [ ] Responsive mobile testé
- [ ] Logs Docker propres (pas d'erreurs critiques)
- [ ] Image Docker buildée et pushée sur GHCR
- [ ] Sauvegarde PostgreSQL configurée (cron)

---

## 🎯 PROCHAINES ÉVOLUTIONS POSSIBLES

### **Fonctionnalités Bonus** (Roadmap)
1. **Gamification** : Badges, confettis lors du remboursement complet d'un imprévu
2. **Notifications** : Rappels mensuels (email/push) pour saisir l'épargne
3. **Export PDF** : Génération de rapports mensuels/annuels
4. **Multi-devises** : Support EUR, USD, GBP, etc.
5. **API REST** : Exposer une API pour intégrations tierces
6. **Dashboard mobile** : Application React Native

### **Améliorations Techniques**
1. **Redis pour rate-limiting** : Remplacer in-memory par Redis (persistant)
2. **Healthcheck endpoint** : `/api/health` pour monitoring (ex: Uptime Kuma)
3. **Logging avancé** : Winston/Pino pour logs structurés
4. **Tests E2E** : Playwright/Cypress pour automatiser les tests
5. **Storybook** : Documentation des composants UI

---

## 📞 CONTACT & SUPPORT

**Repo :** https://github.com/SEC844/Saveez.git  
**Branches :** `dev` (dev) | `main` (prod)  
**Docker Image :** `ghcr.io/sec844/saveez:latest`

---

**📋 Fin du Document — Structure.md v1.0.3**  
*Dernière mise à jour : Mars 2026*
