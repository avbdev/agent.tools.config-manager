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
DATABASE_URL="file:./dev.db"
CONFIG_ENCRYPTION_KEY="replace-with-long-random-string-at-least-32-chars"
```

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET|POST /api/settings`
- `GET|PATCH /api/users` (admin)
- `GET /api/audit` (admin)

## Production deployment (Vercel)

1. Import repo in Vercel.
2. Set env vars:
   - `DATABASE_URL` (recommended free Neon Postgres URL)
   - `CONFIG_ENCRYPTION_KEY` (strong random key)
3. Run a one-time migrate/push against prod DB.
4. Deploy.
