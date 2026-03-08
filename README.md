<div align="center">

# 💰 Saveez

**Application web personnelle de gestion d'épargne**

Suivez vos mises de côté, gérez les imprévus avec remboursement mensuel échelonné,  
et visualisez vos projections de fin d'année — le tout dans une interface Apple-like.

[![CI](https://github.com/SEC844/Saveez/actions/workflows/ci.yml/badge.svg)](https://github.com/SEC844/Saveez/actions/workflows/ci.yml)
[![CD](https://github.com/SEC844/Saveez/actions/workflows/cd.yml/badge.svg)](https://github.com/SEC844/Saveez/actions/workflows/cd.yml)
[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)](https://github.com/SEC844/Saveez/releases)

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

| Variable            | Description                                        |
| ------------------- | -------------------------------------------------- |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL (fort, ex : 24 caractères) |
| `NEXTAUTH_SECRET`   | Clé secrète JWT — `openssl rand -base64 32`        |
| `NEXTAUTH_URL`      | `http://localhost:3000` pour le local              |

### 3. Lancer

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

L'application est disponible sur **http://localhost:3000**.  
À la première visite, un wizard guide la configuration initiale.

### Commandes utiles

```bash
docker compose -f docker-compose.dev.yml down           # Arrêter (données conservées)
docker compose -f docker-compose.dev.yml down -v        # Arrêter et supprimer les données
docker compose -f docker-compose.dev.yml logs -f app    # Suivre les logs de l'app
```

---

## Déploiement en production

Un seul fichier `docker-compose.yml` — conçu pour Unraid et tout serveur disposant d’un PostgreSQL externe.

> Sur Unraid, installez PostgreSQL séparément (Apps → Community Applications → `PostgreSQL 16`) et créez la base Saveez :
> ```sql
> CREATE USER saveez_user WITH PASSWORD 'votre_mot_de_passe';
> CREATE DATABASE saveez_db OWNER saveez_user;
> ```

### 1. Télécharger le fichier Compose

```bash
curl -O https://raw.githubusercontent.com/SEC844/Saveez/main/docker-compose.yml
```

### 2. Éditer les 5 valeurs `CHANGE_ME` dans le fichier

```
DB_HOST:         192.168.1.100              ← IP ou hostname de votre PostgreSQL
DB_PASSWORD:     CHANGE_ME_DB_PASSWORD      ← mot de passe PostgreSQL
DB_USER:         saveez_user               ← utilisateur PostgreSQL (si différent)
NEXTAUTH_SECRET: CHANGE_ME_...             ← openssl rand -base64 32
NEXTAUTH_URL:    http://192.168.1.100:3000 ← URL publique de votre instance
```

`DATABASE_URL` **n’est pas à renseignier** : il est construit automatiquement par `scripts/start.js` depuis les variables `DB_*`.

### 3. Lancer

```bash
docker compose pull
docker compose up -d
```

### Commandes utiles

```bash
docker compose logs -f saveez         # Suivre les logs
docker compose pull && docker compose up -d  # Mettre à jour
docker compose down                   # Arrêter (données non affectées)
```

### Via `docker run` (sans Compose)

```bash
docker run -d \
  --name saveez \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DB_HOST="192.168.1.100" \
  -e DB_PORT="5432" \
  -e DB_USER="saveez_user" \
  -e DB_PASSWORD="VOTRE_MDP" \
  -e DB_NAME="saveez_db" \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXTAUTH_URL="http://192.168.1.100:3000" \
  -e NODE_ENV=production \
  ghcr.io/sec844/saveez:latest \
  node scripts/start.js
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

| Déclencheur     | Tags d'image produits               |
| --------------- | ----------------------------------- |
| Push sur `main` | `latest`, `sha-abc1234`             |
| Tag `v1.2.3`    | `1.2.3`, `1.2`, `latest`, `sha-...` |

> **Activer les permissions d'écriture** dans votre repo :  
> `Settings → Actions → General → Workflow permissions` → *Read and write permissions*

---

## Structure du projet

```
Saveez/
├── app/
├── components/
├── lib/
├── prisma/
├── scripts/
│   └── start.js                  # Startup Docker : construit DATABASE_URL depuis DB_*, lance migrations + serveur
├── .github/workflows/
│   ├── ci.yml                    # CI — type-check + build
│   └── cd.yml                    # CD — Docker build + push ghcr.io
├── Dockerfile                    # Multi-stage build (deps → builder → runner)
├── docker-compose.yml            # Production / Unraid — app seule (PostgreSQL externe)
├── docker-compose.dev.yml        # Développement local (build depuis sources + PostgreSQL intégré)
├── .env.example                  # Template variables (ne jamais committer .env)
├── auth.ts
├── proxy.ts
└── next.config.ts
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

| Version | Date       | Notes                                                                                      |
| ------- | ---------- | ------------------------------------------------------------------------------------------ |
| v1.0.3  | 2026-03-08 | Fix DATABASE_URL build (Node.js startup script), fix session auth sur HTTP, Docker cleanup |
| v1.0.2  | 2026-03-06 | Déploiement Unraid, docker-compose inline vars, README professionnel                      |
| v1.0.1  | 2026-03-06 | Projection, historique objectif global, ConfirmDialog, onboarding epargne                  |
| v1.0.0  | 2026-03-06 | Version initiale                                                                           |
