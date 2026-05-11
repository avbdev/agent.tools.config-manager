# agent.tools.config-manager

Production-grade configuration and secrets management with:

- Azure AD OAuth via next-auth v5 (no password auth)
- Multi-tenant org model (personal + enterprise orgs)
- AES-256-GCM encrypted secret storage
- RBAC (Admin / Editor / Viewer) enforced at both API and UI layers
- Cursor-paginated REST API (`/api/configs`)
- Environment namespacing (DEV / STAGING / PROD)
- Redis Sentinel HA rate limiting + audit logging
- OTel traces, Prometheus metrics, Grafana dashboards
- Docker + Kustomize + ArgoCD GitOps to homelab K8s

---

## Local Development

### Prerequisites

- Docker Desktop 20.10+ (or Docker Engine with Compose plugin)
- Node.js 20+
- An Azure AD App Registration (for OAuth)

### 1. Start local services

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL 16 and Redis 7 with dev-safe credentials on localhost.

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local — fill in your Azure AD TENANT_ID, CLIENT_ID, CLIENT_SECRET
```

### 3. Install dependencies and generate Prisma client

```bash
npm install
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the app

```bash
npm run dev
```

App is available at `http://localhost:3000`. Sign in with your Microsoft account.

---

## Environment Variables

See `.env.example` for the full production variable reference, and `.env.local.example` for local development overrides.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (PgBouncer port 6432 in prod) |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection for Prisma migrations (port 5432) |
| `AUTH_SECRET` | Yes | next-auth v5 session secret — generate with `openssl rand -hex 32` |
| `AZURE_AD_TENANT_ID` | Yes | Azure AD tenant ID |
| `AZURE_AD_CLIENT_ID` | Yes | Azure AD app client ID |
| `AZURE_AD_CLIENT_SECRET` | Yes | Azure AD app client secret |
| `CONFIG_ENCRYPTION_KEY` | Yes | AES-256-GCM key for secret values — min 32 chars |
| `REDIS_URL` | Dev | Single Redis instance (local dev / Vercel preview) |
| `REDIS_SENTINEL_HOSTS` | Prod | Comma-separated sentinel hosts (takes precedence over REDIS_URL) |
| `REDIS_SENTINEL_MASTER` | Prod | Sentinel master name (default: `mymaster`) |
| `REDIS_PASSWORD` | Prod | Redis auth password |

---

## API

### Configs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/configs` | Any role | List configs with cursor pagination |
| `POST` | `/api/configs` | EDITOR+ | Create or upsert a config |
| `PATCH` | `/api/configs/:id` | EDITOR+ | Update a config |
| `DELETE` | `/api/configs/:id` | ADMIN | Soft-delete a config |
| `POST` | `/api/configs/:id/reveal` | EDITOR+ | Decrypt and return secret value |

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | None | DB + Redis readiness check |

---

## Secret Storage

- All values pass through `src/lib/crypto.ts` before persistence
- Secrets (`isSecret: true`) → AES-256-GCM encrypted: `iv.tag.ciphertext` stored in `valueCipher`
- Non-secrets (`isSecret: false`) → plaintext stored in `valueCipher`
- The reveal endpoint (`POST /api/configs/:id/reveal`) decrypts on demand; rate-limited to 5/min per user
- Reveal actions are always audit-logged; the revealed value is NEVER written to the audit log

---

## Production Deployment (Homelab K8s via ArgoCD)

See `apps/custom/config-manager/` in the `homelab.platform.k8s` GitOps repo.

CI pushes to `ghcr.io/avbdev/config-manager`, then the `gitops-promote` job bumps the image tag
in the GitOps repo. ArgoCD detects the change and rolls the Deployment.
