<div align="center">

# 💰 Saveez

**Application web personnelle de gestion d'épargne**

Suivez vos mises de côté, gérez les imprévus avec remboursement mensuel échelonné,  
et visualisez vos projections de fin d'année — le tout dans une interface Apple-like.

[![CI](https://github.com/SEC844/Saveez/actions/workflows/ci.yml/badge.svg)](https://github.com/SEC844/Saveez/actions/workflows/ci.yml)
[![CD](https://github.com/SEC844/Saveez/actions/workflows/cd.yml/badge.svg)](https://github.com/SEC844/Saveez/actions/workflows/cd.yml)
[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/SEC844/Saveez/releases)

</div>

---

## Fonctionnalités

- **Tableau de bord** — solde, objectif du mois, écart, graphique d'évolution
- **Épargne mensuelle** — saisie rapide, historique, écart objectif vs réel
- **Imprévus** — ajout d'une dépense exceptionnelle avec plan de remboursement mensuel automatique
- **Objectifs** — standard, vacances ou autre (dates, montants, répartition multi-comptes)
- **Projections** — simulation de fin d'année, mode "What If"
- **Comptes** — répartition de l'épargne sur plusieurs comptes
- **Onboarding** — wizard guidé à la première connexion
- **Thème clair / sombre** — avec switch fluide

---

## Stack technique

| Couche          | Technologie                                     |
| --------------- | ----------------------------------------------- |
| Framework       | Next.js 16 (App Router, TypeScript, standalone) |
| Base de données | PostgreSQL 16 + Prisma ORM                      |
| Auth            | Auth.js v5 (JWT, Credentials, bcrypt)           |
| UI              | Tailwind CSS v4 + shadcn/ui v3 + Framer Motion  |
| Container       | Docker + Docker Compose                         |
| CI/CD           | GitHub Actions → ghcr.io                        |

---

## Démarrage local (Docker Desktop)

> Pour tester sur votre machine avant tout déploiement.

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré

### 1. Cloner le repo

```bash
git clone https://github.com/SEC844/Saveez.git
cd Saveez
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` et renseignez les trois valeurs :

| Variable            | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL (fort, ex : 24 caractères)   |
| `NEXTAUTH_SECRET`   | Clé secrète JWT — `openssl rand -base64 32`          |
| `NEXTAUTH_URL`      | `http://localhost:3000` pour le local                |

### 3. Lancer

```bash
docker compose up --build -d
```

L'application est disponible sur **http://localhost:3000**.  
À la première visite, un wizard guide la configuration initiale.

### Commandes utiles

```bash
docker compose down          # Arrêter (données conservées)
docker compose down -v       # Arrêter et supprimer les données
docker compose logs -f app   # Suivre les logs de l'app
```

---

## Déploiement en production

Deux options selon votre infrastructure.

---

### Option A — Serveur Linux (PostgreSQL intégré)

> Base de données incluse dans le Compose. Idéal pour un VPS ou serveur dédié.

#### 1. Télécharger le fichier Compose

```bash
curl -O https://raw.githubusercontent.com/SEC844/Saveez/main/docker-compose.prod.yml
```

#### 2. Éditer les 3 valeurs `CHANGE_ME` directement dans le fichier

```
POSTGRES_PASSWORD: CHANGE_ME_STRONG_DB_PASSWORD    ← mot de passe DB
DATABASE_URL:      ...CHANGE_ME_STRONG_DB_PASSWORD...
NEXTAUTH_SECRET:   CHANGE_ME_GENERATE_WITH_OPENSSL  ← openssl rand -base64 32
NEXTAUTH_URL:      http://votre-ip-ou-domaine:3000   ← URL publique
```

#### 3. Lancer

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

#### Mise à jour (nouvelle version)

```bash
docker compose -f docker-compose.prod.yml pull && \
docker compose -f docker-compose.prod.yml up -d
```

---

### Option B — Unraid (base de données externe)

> Sur Unraid, installez PostgreSQL **séparément** (une seule instance pour tous vos projets),  
> puis déployez uniquement le conteneur Saveez.

#### Étape 1 — Installer PostgreSQL sur Unraid

Dans **Apps → Community Applications**, cherchez `PostgreSQL 16` et installez-le.  
Puis créez une base dédiée pour Saveez (via pgAdmin ou un terminal) :

```sql
CREATE USER saveez_user WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE saveez_db OWNER saveez_user;
```

#### Étape 2 — Déployer le conteneur Saveez

**Via Docker Compose (plugin Compose Manager) :**

```bash
curl -O https://raw.githubusercontent.com/SEC844/Saveez/main/docker-compose.unraid.yml
# Éditez les 4 valeurs CHANGE_ME dans le fichier
docker compose -f docker-compose.unraid.yml up -d
```

**Via l'interface graphique Unraid ou `docker run` :**

```bash
docker run -d \
  --name saveez \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://saveez_user:VOTRE_MDP@192.168.1.100:5432/saveez_db?schema=public" \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXTAUTH_URL="http://192.168.1.100:3000" \
  -e NODE_ENV=production \
  ghcr.io/sec844/saveez:latest \
  sh -c "./node_modules/.bin/prisma migrate deploy && node server.js"
```

Remplacez `192.168.1.100` par l'IP de votre serveur Unraid et adaptez les credentials.

#### Étape 3 — Accéder à l'application

Rendez-vous sur `http://IP_UNRAID:3000`.  
À la première visite, créez votre compte via le formulaire d'inscription.

#### Mise à jour

```bash
docker pull ghcr.io/sec844/saveez:latest
docker stop saveez && docker rm saveez
# Relancer la commande docker run (ou docker compose up -d)
```

---

## CI/CD — GitHub Actions

Deux workflows automatiques dans `.github/workflows/` :

### `ci.yml` — Intégration continue

Déclenché sur chaque **push** et **PR** vers `main` :
1. Type-check TypeScript (`tsc --noEmit`)
2. Build Next.js de validation

### `cd.yml` — Livraison continue

Déclenché sur **push vers `main`** et **tags `v*.*.*`** :
1. Build de l'image Docker multi-platform (`linux/amd64` + `linux/arm64`)
2. Push vers **GitHub Container Registry** (`ghcr.io/sec844/saveez`)

| Déclencheur      | Tags d'image produits               |
| ---------------- | ----------------------------------- |
| Push sur `main`  | `latest`, `sha-abc1234`             |
| Tag `v1.2.3`     | `1.2.3`, `1.2`, `latest`, `sha-...` |

> **Activer les permissions d'écriture** dans votre repo :  
> `Settings → Actions → General → Workflow permissions` → *Read and write permissions*

---

## Structure du projet

```
Saveez/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Page de connexion
│   ├── (setup)/setup/            # Formulaire de création de compte
│   ├── actions/                  # Server Actions (épargne, imprévus, objectifs, settings)
│   ├── api/auth/                 # Route handler Auth.js
│   ├── historique/               # Page historique mensuel
│   ├── imprevus/                 # Page gestion des imprévus
│   ├── objectifs/                # Page gestion des objectifs
│   ├── parametres/               # Page paramètres utilisateur
│   ├── projections/              # Page projections & "What If"
│   ├── page.tsx                  # Dashboard principal
│   └── layout.tsx                # Layout racine (thème, fonts)
│
├── components/
│   ├── dashboard/                # Composants métier (modals, cards, charts)
│   └── ui/                       # Composants base shadcn/ui
│
├── lib/
│   ├── epargne.ts                # Logique métier — calculs, projections
│   ├── queries.ts                # Queries Prisma réutilisables
│   ├── db.ts                     # Client Prisma singleton
│   └── utils.ts                  # Utilitaires (cn, formatters…)
│
├── prisma/
│   ├── schema.prisma             # Schéma de base de données
│   └── migrations/               # Migrations SQL versionnées
│
├── .github/workflows/
│   ├── ci.yml                    # CI — type-check + build
│   └── cd.yml                    # CD — Docker build + push ghcr.io
│
├── Dockerfile                    # Multi-stage build (deps → builder → runner)
├── docker-compose.yml            # Développement local (build depuis sources)
├── docker-compose.prod.yml       # Production serveur (app + PostgreSQL intégré)
├── docker-compose.unraid.yml     # Unraid / PostgreSQL externe (app uniquement)
├── .env.example                  # Template variables (ne jamais committer .env)
├── auth.ts                       # Configuration Auth.js
├── proxy.ts                      # Middleware Next.js (protection des routes)
└── next.config.ts                # Config Next.js (standalone, headers sécurité)
```

---

## Sécurité

- Mots de passe hachés avec **bcrypt** (salt rounds élevés)
- Sessions **JWT** en cookie `HttpOnly / Secure / SameSite=Strict`
- **Rate limiting** sur la route de login (protection brute-force)
- Protection **CSRF** via Auth.js
- Headers HTTP durcis (`X-Frame-Options`, `HSTS`, `Permissions-Policy`…)
- Aucune donnée sensible exposée côté client
- Variables d'environnement injectées au **runtime** (jamais baked dans l'image)
- Utilisateur non-root dans le conteneur (`nextjs:nodejs`)

---

## Releases

| Version | Date       | Notes                                                                         |
| ------- | ---------- | ----------------------------------------------------------------------------- |
| v1.0.2  | 2026-03-06 | Déploiement Unraid, docker-compose inline vars, README professionnel          |
| v1.0.1  | 2026-03-06 | Projection, historique objectif global, ConfirmDialog, onboarding epargne     |
| v1.0.0  | 2026-03-06 | Version initiale                                                              |
