# agent.tools.config-manager

Production-grade configuration management tool with:

- Secure secret storage (AES-256-GCM encrypted payloads)
- Authentication + session management
- RBAC (Admin/Editor/Viewer)
- Audit logging
- API + UI
- CI + tests

## Secret storage model

- Secret values are encrypted before persistence using `CONFIG_ENCRYPTION_KEY`.
- Encryption happens server-side in `src/lib/crypto.ts`.
- Database only stores ciphertext (`iv.tag.data`).
- Runtime key is provided via environment variables (local `.env`, Vercel env vars in production).

## Local setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Required environment variables:

```bash
DATABASE_URL="postgresql://..."
CONFIG_ENCRYPTION_KEY="replace-with-long-random-string-at-least-32-chars"
SESSION_SECRET="replace-with-long-random-string-at-least-32-chars"
```

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET|POST /api/settings`
- `GET|PATCH /api/users` (admin)
- `GET /api/audit` (admin)

## Production deployment (Vercel + Neon)

1. Create Neon production project and store two credentials:
   - `app_rw` role (runtime app access)
   - `app_migrator` role (schema migrations only)
2. Configure Vercel production environment variables:
   - `DATABASE_URL` = `app_rw` connection string
   - `CONFIG_ENCRYPTION_KEY` = 32+ char secret
   - `SESSION_SECRET` = 32+ char secret
3. Configure GitHub Actions repository secret:
   - `DATABASE_URL_MIGRATOR` = `app_migrator` connection string
4. Keep Vercel GitHub integration enabled for deployments (no long-lived Vercel token in Actions).
5. Push to `main`; `production-migrate` runs `prisma migrate deploy` before/alongside Vercel production deploy.

## Security hardening

- Strict security headers (CSP, HSTS, frame deny, nosniff, permissions policy)
- Zod request validation with explicit 400 responses
- Rate limiting on auth endpoints
- Encryption key and session secret are required env vars
- Weekly dependency audit workflow (`security.yml`)
