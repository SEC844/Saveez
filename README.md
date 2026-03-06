# Épargne App

Application web personnelle de gestion d'épargne. Suivez vos mises de côté mensuelles, gérez les imprévus avec remboursement mensuel échelonné, et visualisez vos projections de fin d'année.

## Stack

- **Next.js 16** (App Router, TypeScript, `output: "standalone"`)
- **PostgreSQL 16** (via Prisma ORM)
- **NextAuth v5** (JWT, Credentials provider, bcrypt)
- **Tailwind CSS v4 + Shadcn/UI v3 + Framer Motion**
- **Docker & Docker Compose**
- **GitHub Actions** (CI/CD → ghcr.io)

---

## Démarrage local (Docker Desktop)

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré

### 1. Cloner le repo

```bash
git clone https://github.com/VOTRE_USER/epargne-app.git
cd epargne-app
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` et remplir :

| Variable            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `POSTGRES_PASSWORD` | Mot de passe fort pour PostgreSQL                 |
| `NEXTAUTH_SECRET`   | Clé secrète aléatoire (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`      | `http://localhost:3000` en local                  |

### 3. Lancer avec Docker Compose

```bash
docker compose up --build -d
```

L'application sera disponible sur **http://localhost:3000**.

La première fois, elle redirige vers `/setup` pour créer votre compte utilisateur.

### Arrêter

```bash
docker compose down          # Arrêter (données conservées)
docker compose down -v       # Arrêter + supprimer les données
```

---

## CI/CD avec GitHub Actions

Deux workflows sont inclus dans `.github/workflows/` :

### `ci.yml` — Intégration continue

Déclenché sur chaque **push** et **Pull Request** vers `main` :
- Vérification TypeScript (`tsc --noEmit`)
- Build Next.js de vérification

### `cd.yml` — Livraison continue

Déclenché sur **push vers `main`** et **création de tags `v*.*.*`** :
- Build de l'image Docker multi-platform (`linux/amd64` + `linux/arm64`)
- Push vers **GitHub Container Registry** (`ghcr.io`)

Tags générés automatiquement :
- `latest` (sur chaque push main)
- `v1.2.3` (sur tag git)
- `sha-abc1234` (SHA court du commit)

### Configuration requise

Le workflow CD utilise le `GITHUB_TOKEN` intégré — **aucun secret supplémentaire** n'est nécessaire.

Activer les permissions d'écriture dans votre repo :  
`Settings → Actions → General → Workflow permissions` → **"Read and write permissions"**

---

## Déploiement en production

Utilisez `docker-compose.prod.yml` sur votre serveur.

### 1. Créer `.env` sur le serveur

```bash
cp .env.example .env
# Éditer .env : mot de passe fort, NEXTAUTH_SECRET, et NEXTAUTH_URL avec votre domaine
```

### 2. Authentification ghcr.io (première fois)

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u VOTRE_GITHUB_USER --password-stdin
```

### 3. Adapter `docker-compose.prod.yml`

Remplacer `VOTRE_GITHUB_USER` par votre nom d'utilisateur GitHub dans le champ `image`.

### 4. Lancer

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 5. Mettre à jour (après un nouveau push sur main)

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Structure du projet

```
epargne-app/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Pages login & setup
│   ├── (dashboard)/        # Pages protégées (dashboard, imprévus, projections, paramètres)
│   └── api/                # Route handlers
├── components/
│   ├── dashboard/          # Composants UI du dashboard
│   └── ui/                 # Composants Shadcn/UI
├── lib/
│   ├── epargne.ts          # Logique métier (calculs, projections)
│   ├── queries.ts          # Queries Prisma + Server Actions
│   └── auth.ts             # Config NextAuth
├── prisma/
│   └── schema.prisma       # Schéma de base de données
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI (tsc + build)
│       └── cd.yml          # CD (Docker push → ghcr.io)
├── Dockerfile              # Multi-stage build (builder → runner)
├── docker-compose.yml      # Dev local (build depuis sources)
├── docker-compose.prod.yml # Production (image ghcr.io)
└── proxy.ts                # Middleware d'authentification Next.js
```

---

## Sécurité

- Mots de passe hachés avec **bcrypt** (salt rounds élevés)
- Sessions **JWT** stockées en cookie `HttpOnly / Secure / SameSite=Strict`
- **Rate limiting** sur la route de login (protection brute-force)
- Protection **CSRF** via NextAuth
- Aucune donnée sensible exposée côté client
- Variables d'environnement injectées au runtime (jamais baked dans l'image)
