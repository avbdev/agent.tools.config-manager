# syntax=docker/dockerfile:1

# ── Stage 1: Install production dependencies only ────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# --omit=dev keeps the production dependency tree lean;
# prisma generate runs in the builder stage where devDeps are present.
RUN npm ci --omit=dev

# ── Stage 2: Build Next.js application ───────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
# Re-use the production node_modules from deps stage, then add all deps for build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Generate Prisma client for the builder's platform before next build
RUN npx prisma generate
RUN npm run build

# ── Stage 3: Minimal production runner ───────────────────────────────────────
# IMPORTANT: next.config.ts must include `output: 'standalone'` for this
# CMD to work. Without it, .next/standalone/ is not emitted and the container
# will fail to start. See: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user — satisfies K8s securityContext runAsNonRoot: true / runAsUser: 1001
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
