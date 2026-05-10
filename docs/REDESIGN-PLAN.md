# ConfigVault — Product & Delivery Plan v2.0

> **Branch:** `feat/dashboard-redesign`
> **Status:** Active — Phase 1 build in progress
> **Last updated:** 2026-05-10
> **Owners:** AppBuilderAgent (delivery) · SoftwareEngineerAgent (implementation)

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Feature Module Registry](#2-feature-module-registry)
3. [Phase Breakdown](#3-phase-breakdown)
4. [UX & Navigation Architecture](#4-ux--navigation-architecture)
5. [Design System Tokens](#5-design-system-tokens)
6. [Security Architecture](#6-security-architecture)
7. [Prisma Schema v2](#7-prisma-schema-v2)
8. [API Surface](#8-api-surface)
9. [File Structure](#9-file-structure)
10. [Component Conventions](#10-component-conventions)
11. [Handoff Notes for SoftwareEngineerAgent](#11-handoff-notes-for-softwareengineeragent)
12. [Constitution Compliance](#12-constitution-compliance)
13. [Branch Protection Confirmation](#13-branch-protection-confirmation)

---

## 1. Product Vision

**ConfigVault** is the single pane of glass for all infrastructure config, app config, service config, secrets, API keys, certificates, and environment variables across an enterprise's entire fleet. It is a Doppler / HashiCorp Vault / Vercel Env competitor — built with enterprise-grade security, premium UX, and zero architectural compromises.

**North Star Metrics:**
- Time-to-first-secret-stored: < 60 seconds from signup
- Audit coverage: 100% of mutations traced
- Secret exposure window: zero (masked by default, explicit reveal only, logged always)
- P95 page load: < 1.2 seconds (UI shell), < 2.5 seconds (data-heavy views)

---

## 2. Feature Module Registry

Ranked by delivery priority (P1 = Phase 1 MVP, P2 = Phase 2, P3 = Phase 3).

| # | Module | Priority | Description |
|---|--------|----------|-------------|
| 1 | **Auth & Sessions** | P1 | Email/password login, session cookies, CSRF, rate-limiting |
| 2 | **Org → Project → Environment Hierarchy** | P1 | Multi-tenant resource hierarchy; every config scoped to env |
| 3 | **Config Key-Value Store** | P1 | Typed (string/number/boolean/JSON), versioned, taggable |
| 4 | **Secrets Vault** | P1 | AES-256-GCM encrypted, masked by default, reveal with audit |
| 5 | **Audit Log Timeline** | P1 | Immutable append-only log; filterable by actor/resource/action |
| 6 | **Dashboard Overview** | P1 | Health cards, expiry warnings, recent activity feed |
| 7 | **Premium Sidebar Navigation** | P1 | Collapsible, keyboard-navigable, cmd+K command palette |
| 8 | **Environment Variable Bundles** | P2 | Import/export .env, JSON, YAML; diff view on import |
| 9 | **API Key / Token Management** | P2 | Issuance, scoping, rotation, revocation; service fetch tokens |
| 10 | **Certificates Manager** | P2 | Upload PEM/PFX, expiry tracking, rotation alerts |
| 11 | **Change History + Rollback** | P2 | Per-config version history; one-click rollback |
| 12 | **Read-only Service Fetch API** | P2 | Scoped bearer token auth; JSON/env format responses |
| 13 | **User Management + RBAC** | P2 | Invite by email, role assignment (Owner/Admin/Editor/Viewer) |
| 14 | **Search, Filter, Bulk Ops** | P2 | Global search, tag filter, bulk delete/move/export |
| 15 | **Feature Flags** | P3 | Boolean and multi-variant flags with environment overrides |
| 16 | **Webhooks & Notifications** | P3 | Expiry alerts, change events via webhook/email |
| 17 | **SSO / OAuth** | P3 | GitHub OAuth, Google OAuth, SAML for enterprise |
| 18 | **SDK / CLI** | P3 | TypeScript SDK + Node CLI for CI/CD integration |

---

## 3. Phase Breakdown

### Phase 1 — Foundation & Core Vault (this task)

**Goal:** A production-quality, fully deployable MVP that enterprise clients can onboard to immediately.

**Deliverables:**
- [ ] Prisma schema v2 migration applied
- [ ] Premium sidebar shell layout (dark mode, glass morphism)
- [ ] Org → Project → Environment context switcher
- [ ] Config key-value CRUD (typed, versioned)
- [ ] Secrets vault (AES-256-GCM, masked, reveal + audit)
- [ ] Dashboard overview page
- [ ] Audit log timeline page (filterable)
- [ ] Auth flows (login, logout, protected routes)
- [ ] Design system CSS tokens (full token set)
- [ ] Cmd+K command palette (search + navigation)
- [ ] Responsive layout (desktop + tablet)

**Phase 1 excludes:** import/export bundles, certificate management, API token issuance, webhooks, SSO, SDK.

---

### Phase 2 — Power Features

**Goal:** Full enterprise feature parity with Doppler/Vault.

**Deliverables:**
- [ ] Environment variable bundle import/export
- [ ] API key / service token management
- [ ] Certificate upload + expiry tracking
- [ ] Change history + rollback per config item
- [ ] Read-only service fetch API (`/api/v1/fetch`)
- [ ] User invite + RBAC (Owner/Admin/Editor/Viewer)
- [ ] Global search with filter/sort
- [ ] Bulk operations (delete, move, export)

---

### Phase 3 — Growth & Ecosystem

**Goal:** Moat-building features and enterprise integrations.

**Deliverables:**
- [ ] Feature flags with env overrides
- [ ] Webhook notifications (expiry, changes)
- [ ] GitHub OAuth + Google OAuth
- [ ] TypeScript SDK (`@configvault/sdk`)
- [ ] Node CLI (`npx configvault`)
- [ ] SAML SSO

---

## 4. UX & Navigation Architecture

### Page Structure

```
/                           → redirect to /dashboard
/login                      → auth: email/password form
/register                   → auth: create account

/dashboard                  → overview (health cards, activity, expiry warnings)
/dashboard/[orgSlug]        → org-level overview
/dashboard/[orgSlug]/[projectSlug]                  → project overview
/dashboard/[orgSlug]/[projectSlug]/[env]            → environment config list
/dashboard/[orgSlug]/[projectSlug]/[env]/secrets    → secrets vault view
/dashboard/[orgSlug]/[projectSlug]/[env]/configs    → key-value configs
/dashboard/[orgSlug]/[projectSlug]/[env]/bundles    → env var bundles (P2)
/dashboard/[orgSlug]/[projectSlug]/[env]/certs      → certificates (P2)
/dashboard/[orgSlug]/[projectSlug]/[env]/tokens     → API tokens (P2)
/dashboard/[orgSlug]/[projectSlug]/[env]/flags      → feature flags (P3)

/audit                      → global audit log timeline
/audit/[orgSlug]            → org-scoped audit

/settings                   → user profile, preferences
/settings/org               → org settings
/settings/members           → user management + RBAC (P2)
/settings/tokens            → personal API tokens (P2)
```

### Sidebar Navigation Structure

```
┌─────────────────────────────────┐
│  ⊕ ConfigVault    [org picker]  │
├─────────────────────────────────┤
│  ⌘K  Search...                  │
├─────────────────────────────────┤
│  OVERVIEW                       │
│    ⊞ Dashboard                  │
│    📊 Activity                  │
├─────────────────────────────────┤
│  PROJECTS                       │
│  ▾ webapp                       │
│    · production                 │
│    · staging                    │
│    · development                │
│  ▾ api-service                  │
│    · production                 │
├─────────────────────────────────┤
│  VAULT (current env)            │
│    🔐 Secrets           12      │
│    ⚙️  Configs           8      │
│    📦 Bundles            2      │ P2
│    📜 Certificates       1 ⚠️   │ P2
│    🔑 API Tokens         3      │ P2
│    🚩 Feature Flags      5      │ P3
├─────────────────────────────────┤
│  GOVERNANCE                     │
│    📋 Audit Log                 │
│    ↩  Change History            │ P2
├─────────────────────────────────┤
│  SETTINGS                       │
│    👤 Profile                   │
│    🏢 Organization              │
│    👥 Members                   │ P2
└─────────────────────────────────┘
```

### Key UX Patterns

| Pattern | Implementation |
|---------|----------------|
| **Cmd+K palette** | Full-screen command overlay; searches configs, navigates pages, triggers actions |
| **Secret reveal** | Click eye icon → confirm intent modal (glass morphism) → decrypt on server → auto-hide after 30s |
| **Env context switcher** | Breadcrumb pill in topbar: `Acme Corp > webapp > production` |
| **Expiry badge** | Red/amber/green badge on cert/token rows showing days remaining |
| **Change indicator** | Row highlight + "unsaved" indicator on in-place edits |
| **Audit drawer** | Slide-in right drawer showing audit trail for any individual config item |

---

## 5. Design System Tokens

### Color Tokens (Tailwind v4 CSS variables)

```css
/* Base palette — dark mode first */
--color-bg-base:         #060611;    /* deepest background */
--color-bg-surface:      #0d1225;    /* card/panel surface */
--color-bg-elevated:     #141830;    /* dropdown, popover */
--color-bg-overlay:      rgba(13,18,37,0.85); /* glass panels */

/* Brand gradient endpoints */
--color-brand-violet:    #7f49ff;
--color-brand-blue:      #2e98ff;
--color-brand-gradient:  linear-gradient(135deg, #7f49ff, #2e98ff);

/* Semantic */
--color-success:         #22c55e;    /* green-500 */
--color-warning:         #f59e0b;    /* amber-500 */
--color-danger:          #ef4444;    /* red-500 */
--color-info:            #3b82f6;    /* blue-500 */

/* Text */
--color-text-primary:    #f5f7ff;
--color-text-secondary:  #9ca3af;    /* zinc-400 */
--color-text-muted:      #6b7280;    /* zinc-500 */
--color-text-inverse:    #0a0a0a;

/* Border */
--color-border-subtle:   rgba(255,255,255,0.08);
--color-border-default:  rgba(255,255,255,0.12);
--color-border-strong:   rgba(255,255,255,0.24);

/* Secret-specific */
--color-secret-mask:     #1a1f3a;    /* masked value background */
--color-secret-revealed: rgba(127,73,255,0.15); /* reveal highlight */
```

### Light Mode Overrides

```css
[data-theme="light"] {
  --color-bg-base:         #f8fafc;
  --color-bg-surface:      #ffffff;
  --color-bg-elevated:     #f1f5f9;
  --color-text-primary:    #0f172a;
  --color-text-secondary:  #64748b;
  --color-border-subtle:   rgba(0,0,0,0.06);
  --color-border-default:  rgba(0,0,0,0.10);
}
```

### Typography Scale

```css
--font-sans:    var(--font-geist-sans), 'Inter', system-ui, sans-serif;
--font-mono:    var(--font-geist-mono), 'JetBrains Mono', monospace;

/* Scale: 11/12/13/14/16/20/24/32/40/48 px */
--text-2xs: 0.6875rem;   /* 11px — labels, badges */
--text-xs:  0.75rem;     /* 12px — metadata, timestamps */
--text-sm:  0.8125rem;   /* 13px — body small */
--text-base: 0.875rem;   /* 14px — body default */
--text-md:  1rem;        /* 16px — emphasized body */
--text-lg:  1.25rem;     /* 20px — section heads */
--text-xl:  1.5rem;      /* 24px — page titles */
--text-2xl: 2rem;        /* 32px — hero heads */
```

### Spacing System

```
4px base unit. Scale: 1(4) 2(8) 3(12) 4(16) 5(20) 6(24) 8(32) 10(40) 12(48) 16(64)
```

### Component Library Decision

**No external component library.** Build a bespoke design system using:
- Tailwind v4 CSS variables for tokens
- Headless UI primitives (Dialog, Popover, Combobox) for accessible overlay patterns
- Custom components in `src/components/ui/` following the naming convention below

Rationale: External libraries (shadcn, Radix, MUI) add bundle weight and impose design constraints that conflict with the premium custom aesthetic. Headless UI gives accessibility primitives without visual opinions.

### Glass Morphism System

```css
.glass-panel {
  background: var(--color-bg-overlay);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--color-border-default);
  border-radius: 0.75rem;
}

.glass-modal {
  background: rgba(13, 18, 55, 0.92);
  backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(127, 73, 255, 0.3);
  box-shadow: 0 0 80px rgba(127, 73, 255, 0.15), 0 20px 60px rgba(0,0,0,0.5);
}
```

---

## 6. Security Architecture

### Threat Model Summary (STRIDE)

| Threat | Asset | Control |
|--------|-------|---------|
| **S** Spoofing | Sessions | HMAC-signed session tokens, httpOnly cookies, SameSite=Lax |
| **T** Tampering | Config values | AES-256-GCM authenticated encryption; version hash |
| **R** Repudiation | All mutations | Immutable audit log with actor+timestamp+IP |
| **I** Info disclosure | Secrets | Masked by default; server-side decrypt only; reveal logged |
| **D** Denial of service | Auth endpoints | Per-IP rate limiting (sliding window, DB-backed) |
| **E** Elevation of privilege | RBAC | Role checked server-side on every mutation route |

### Zero-Trust Patterns

1. **Server-side auth on every API route** — no reliance on client-side session claims
2. **Role checked at action time** — not just at route level (defence in depth)
3. **Secret values never returned in list endpoints** — only masked `••••` placeholder
4. **Explicit reveal requires server round-trip** — no cached plaintext on client
5. **Service fetch API tokens are scoped** — each token grants read access to ≤1 environment
6. **All audit writes are append-only** — no UPDATE/DELETE on AuditLog table in application code
7. **Input validation via Zod** — all incoming request bodies parsed through strict schemas
8. **CSP headers** — `Content-Security-Policy: default-src 'self'` in next.config.ts
9. **No secrets in env vars returned to client** — `NEXT_PUBLIC_*` namespace is empty

### Encryption Architecture

```
Plaintext value
    │
    ▼ AES-256-GCM
    │  key  = sha256(CONFIG_ENCRYPTION_KEY)     ← from env, never stored
    │  IV   = crypto.randomBytes(12)            ← unique per encryption
    │  tag  = GCM authentication tag            ← integrity verification
    │
    ▼ Storage format: base64(iv).base64(tag).base64(ciphertext)
    │
    ▼ Database: ConfigVersion.valueCipher (only encrypted form stored)
```

### Secret Reveal Flow

```
User clicks "Reveal" button
    │
    ▼ POST /api/secrets/[id]/reveal
    │   · Verify session
    │   · Check role ≥ EDITOR
    │   · Rate limit: max 10 reveals/user/minute
    │
    ▼ Server decrypts value
    │
    ▼ Audit log written: {action: "SECRET_REVEAL", actorId, resourceId, ip}
    │
    ▼ Plaintext returned in response (single request, no caching)
    │
    ▼ Client shows value for 30s then clears
    │   · No clipboard auto-copy without explicit user action
    │   · Value never written to localStorage/sessionStorage
```

### API Token Security

```
Token issuance:
  · Generate 32 random bytes
  · Hash with SHA-256 → store only the hash
  · Return plaintext ONCE (never again retrievable)
  · Token format: cv_<env>_<base58(randomBytes(32))>

Token validation (service fetch):
  · Extract token from Authorization: Bearer header
  · Hash incoming token → compare with stored hash (constant-time)
  · Verify token is not revoked, not expired
  · Verify requested org/project/env matches token scope
```

---

## 7. Prisma Schema v2

See `prisma/schema.v2.prisma` (committed alongside this plan).

Key changes from v1:
- New: `Organization`, `Project`, `Environment` models (resource hierarchy)
- New: `ConfigItem` replaces `Setting` (typed, scoped, tagged)
- New: `ConfigVersion` (immutable version history per config item)
- New: `SecretRevealLog` (dedicated table for reveal events — separate from general audit)
- New: `ServiceToken` (scoped read-only API tokens)
- New: `Certificate` model with expiry tracking
- New: `OrgMember` join table with per-org role
- New: `Invitation` model for email invite flow
- Updated: `User` (remove direct `role` — role is now per-org via `OrgMember`)
- Updated: `AuditLog` (add `orgId`, `projectId`, `resourceId`, `resourceType`, `ipAddress`, `metadata`)
- Removed: `Setting` model (superseded by `ConfigItem`)
- Preserved: `Account`, `Session`, `RateLimit`

---

## 8. API Surface

### Route Contracts

#### Auth
```
POST /api/auth/login            body: {email, password}       → {ok, user}
POST /api/auth/logout           (cookie-based)                → {ok}
POST /api/auth/register         body: {name, email, password} → {ok, user}
```

#### Organization
```
GET    /api/orgs                                              → {orgs[]}
POST   /api/orgs                body: {name, slug}           → {org}
GET    /api/orgs/[orgId]                                     → {org, projects[]}
PATCH  /api/orgs/[orgId]        body: Partial<Org>           → {org}
```

#### Projects & Environments
```
GET    /api/orgs/[orgId]/projects                            → {projects[]}
POST   /api/orgs/[orgId]/projects  body: {name, slug}        → {project}
GET    /api/orgs/[orgId]/projects/[projectId]/environments   → {envs[]}
POST   /api/orgs/[orgId]/projects/[projectId]/environments   → {env}
```

#### Config Items
```
GET    /api/configs             ?orgId&projectId&envId&q     → {items[], total}
POST   /api/configs             body: CreateConfigSchema     → {item}
PATCH  /api/configs/[id]        body: UpdateConfigSchema     → {item}
DELETE /api/configs/[id]                                     → {ok}
GET    /api/configs/[id]/history                             → {versions[]}
POST   /api/configs/[id]/rollback body: {versionId}         → {item}
```

#### Secrets (extends config with decrypt control)
```
POST   /api/secrets/[id]/reveal                             → {value: string}
   · Requires session, role ≥ EDITOR, writes SecretRevealLog
```

#### Service Fetch API (read-only, token auth)
```
GET    /api/v1/fetch            ?format=env|json|yaml        → plaintext or JSON
   Authorization: Bearer cv_<env>_<token>
   · Returns only non-secret configs by default
   · Secrets returned only if token has secrets_scope=true
```

#### Audit Log
```
GET    /api/audit               ?orgId&page&limit&action     → {logs[], total, pages}
```

#### Service Tokens (P2)
```
POST   /api/tokens              body: {name, envId, expiresAt, secretsScope}  → {token (plaintext, once)}
GET    /api/tokens              ?envId                       → {tokens[] (no plaintext)}
DELETE /api/tokens/[id]                                      → {ok}
POST   /api/tokens/[id]/rotate                               → {token (new plaintext, once)}
```

### Response Envelope

All API responses use a consistent envelope:
```typescript
// Success
{ data: T, meta?: { page, limit, total } }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

### Error Codes

```
AUTH_REQUIRED         → 401
FORBIDDEN             → 403
NOT_FOUND             → 404
VALIDATION_ERROR      → 422
RATE_LIMITED          → 429
INTERNAL_ERROR        → 500
```

---

## 9. File Structure

```
src/
├── app/
│   ├── (auth)/                     # route group — no sidebar layout
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/                # route group — sidebar layout
│   │   ├── layout.tsx              # sidebar + topbar shell
│   │   ├── page.tsx                # redirects to /overview
│   │   ├── overview/
│   │   │   └── page.tsx            # dashboard home
│   │   ├── [orgSlug]/
│   │   │   ├── page.tsx            # org overview
│   │   │   └── [projectSlug]/
│   │   │       ├── page.tsx        # project overview
│   │   │       └── [env]/
│   │   │           ├── page.tsx    # env overview
│   │   │           ├── secrets/
│   │   │           │   └── page.tsx
│   │   │           ├── configs/
│   │   │           │   └── page.tsx
│   │   │           ├── bundles/    # P2
│   │   │           ├── certs/      # P2
│   │   │           └── tokens/     # P2
│   │   ├── audit/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── org/
│   │           └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── register/route.ts
│   │   ├── orgs/
│   │   │   └── [...]/route.ts
│   │   ├── configs/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── history/route.ts
│   │   ├── secrets/
│   │   │   └── [id]/
│   │   │       └── reveal/route.ts
│   │   ├── audit/
│   │   │   └── route.ts
│   │   └── v1/
│   │       └── fetch/route.ts      # service fetch API
│   ├── globals.css
│   └── layout.tsx                  # root layout (fonts, theme)
│
├── components/
│   ├── ui/                         # design system primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── command-palette.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── status-dot.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   ├── layout/
│   │   ├── sidebar.tsx             # collapsible sidebar nav
│   │   ├── topbar.tsx              # env breadcrumb + user menu
│   │   └── env-switcher.tsx        # org/project/env context picker
│   ├── configs/
│   │   ├── config-table.tsx        # config list table
│   │   ├── config-row.tsx          # individual row with actions
│   │   ├── config-form.tsx         # create/edit form
│   │   └── config-type-badge.tsx
│   ├── secrets/
│   │   ├── secret-row.tsx          # masked row with reveal button
│   │   ├── secret-reveal-modal.tsx # glass morphism reveal dialog
│   │   └── secret-form.tsx
│   ├── audit/
│   │   ├── audit-timeline.tsx      # timeline component
│   │   ├── audit-filter.tsx        # filter controls
│   │   └── audit-entry.tsx
│   └── dashboard/
│       ├── health-card.tsx
│       ├── expiry-widget.tsx
│       └── activity-feed.tsx
│
├── lib/
│   ├── auth.ts                     # session management
│   ├── audit.ts                    # audit write helpers
│   ├── crypto.ts                   # AES-256-GCM encrypt/decrypt
│   ├── env.ts                      # env validation (Zod)
│   ├── http.ts                     # API response helpers
│   ├── prisma.ts                   # Prisma client singleton
│   ├── rate-limit.ts               # sliding window rate limiter
│   ├── rbac.ts                     # role permission checks
│   ├── schemas/                    # Zod request schemas
│   │   ├── config.schema.ts
│   │   ├── org.schema.ts
│   │   └── auth.schema.ts
│   └── tokens.ts                   # service token issuance/validation
│
└── types/
    ├── api.ts                      # response envelope types
    └── domain.ts                   # domain model types (client-safe)
```

---

## 10. Component Conventions

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Page component | `PascalCase`, default export | `export default function SecretsPage()` |
| UI primitive | `PascalCase`, named export | `export function Button(...)` |
| Server component | Default (no directive) | `async function ConfigTable()` |
| Client component | `"use client"` directive | `"use client"\nexport function CommandPalette()` |
| Hook | `use` prefix | `useConfigStore`, `useDebounce` |

### Props Pattern

```typescript
// Always use explicit interface, not inline type
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) { ... }
```

### Server vs Client Split

- **Default to Server Components** — only add `"use client"` when you need interactivity
- **Data fetching in Server Components** — never fetch in `useEffect`
- **Client components receive data as props** — no direct DB calls from client components
- **Server Actions for mutations** — prefer `action=` form handlers over client-side fetch for simple mutations

### CSS Class Conventions

```typescript
// Use cn() utility for conditional classes (implement with clsx + tailwind-merge)
import { cn } from "@/lib/cn";

<div className={cn(
  "glass-panel p-4",
  isActive && "border-brand-violet",
  className
)} />
```

### Error Handling

```typescript
// API routes: always return typed error envelopes
import { apiError, apiSuccess } from "@/lib/http";

export async function POST(req: Request) {
  try {
    // ...
    return apiSuccess(data);
  } catch (e) {
    if (e instanceof ZodError) return apiError("VALIDATION_ERROR", e.flatten(), 422);
    return apiError("INTERNAL_ERROR", "Unexpected error", 500);
  }
}
```

---

## 11. Handoff Notes for SoftwareEngineerAgent

### Start Here: Phase 1 Implementation Order

Implement in strict dependency order:

**Step 1 — Schema Migration**
- Apply `prisma/schema.v2.prisma`
- Run `npx prisma migrate dev --name v2-hierarchy`
- Verify all existing lib files still compile

**Step 2 — Design System Foundation**
- Update `src/app/globals.css` with full token set from Section 5
- Implement `src/lib/cn.ts` (clsx + tailwind-merge utility)
- Create `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`

**Step 3 — Layout Shell**
- Create `src/app/(dashboard)/layout.tsx` — sidebar + topbar wrapper
- Implement `src/components/layout/sidebar.tsx` — collapsible nav with sections
- Implement `src/components/layout/topbar.tsx` — breadcrumb env switcher + user menu

**Step 4 — Auth Pages**
- Create `src/app/(auth)/login/page.tsx`
- Wire to existing `POST /api/auth/login`
- Add middleware redirect for unauthenticated users (`src/middleware.ts`)

**Step 5 — Org/Project/Environment APIs**
- Implement CRUD routes under `/api/orgs/`
- Implement project and environment sub-routes
- Update `getCurrentUser()` to return org memberships

**Step 6 — Config + Secrets Pages**
- Implement `src/app/(dashboard)/[orgSlug]/[projectSlug]/[env]/configs/page.tsx`
- Implement `src/app/(dashboard)/[orgSlug]/[projectSlug]/[env]/secrets/page.tsx`
- Implement `src/components/secrets/secret-reveal-modal.tsx` (glass morphism)
- Wire reveal to `POST /api/secrets/[id]/reveal`

**Step 7 — Dashboard Overview**
- Implement `src/app/(dashboard)/overview/page.tsx`
- Health cards, expiry warnings (certs/tokens expiring in <30 days), recent audit entries

**Step 8 — Audit Log Page**
- Implement `src/app/(dashboard)/audit/page.tsx`
- Timeline component with filter controls
- Paginated via `GET /api/audit`

**Step 9 — Command Palette**
- Implement `src/components/ui/command-palette.tsx`
- `Cmd+K` global listener in dashboard layout
- Searches configs + navigates pages

### Critical Implementation Rules

1. **Never return decrypted secret values in list endpoints.** Config list APIs return `valueCipher: null` for secrets — only the `/reveal` endpoint decrypts.
2. **All mutations write to audit log.** Use the `writeAudit()` helper from `lib/audit.ts`. Add `orgId`, `resourceId`, `ipAddress` fields per the v2 schema.
3. **Rate limit the reveal endpoint.** Max 10 reveals/user/minute using the existing `RateLimit` table.
4. **Version every config write.** When creating or updating a `ConfigItem`, always create a `ConfigVersion` record. Never mutate `ConfigVersion` records.
5. **Type all Prisma queries.** Do not use `any` — use the generated Prisma types from `@prisma/client`.
6. **Validate all request bodies with Zod.** Schemas live in `src/lib/schemas/`. Return `422` with `ZodError.flatten()` on parse failure.
7. **Middleware protects all dashboard routes.** `src/middleware.ts` must redirect unauthenticated requests to `/login`.
8. **Dark mode is the default.** Do not add `dark:` prefixes to colour classes — dark tokens are the base; `[data-theme="light"]` overrides them.

### Dependencies to Install

```bash
# Install before Phase 1 implementation begins
npm install clsx tailwind-merge
npm install @headlessui/react          # accessible dialog, combobox, popover
npm install @heroicons/react           # icon set
npm install date-fns                   # date formatting
```

No other external UI libraries. No shadcn. No Radix (Headless UI covers the same primitives).

---

## 12. Constitution Compliance

| Article | Name | Verdict | Notes |
|---------|------|---------|-------|
| 1 | Dual-Domain Isolation | **PASS** | Multi-tenant hierarchy (Org → Project → Env) enforces tenant isolation. `OrgMember` table isolates per-org access. |
| 2 | Zero-Trust & Security | **PASS** | mTLS not applicable (single-service app); all API routes server-auth verified; AES-256-GCM encryption; no secrets to client. |
| 3 | Three-Second Rule | **PASS** | List endpoints paginated (50/page); reveal endpoint single DB+decrypt op; dashboard overview uses RSC parallel data fetching. |
| 4 | Observability First | **CONCERN** | Audit log provides application-level observability. OTel tracing not yet wired. Add Vercel OTel integration in Phase 2. |
| 5 | Infrastructure as Code | **PASS** | Vercel deployment via git push; Prisma migrations in version control; no manual infra operations. |
| 6 | Stateless Agent Modularity | **N/A** | No AI agents in this application. |

**CONCERN resolution:** Article 4 concern is acceptable for Phase 1. Vercel Analytics + OTel middleware to be added in Phase 2 as a dedicated observability task.

---

## 13. Branch Protection Confirmation

**Status: ✅ CONFIRMED — Set via GitHub API on 2026-05-10**

Branch: `main`
Repository: `avbdev/agent.tools.config-manager`

Rules applied:
- ✅ Pull request required before merging (1 approval minimum)
- ✅ Dismiss stale reviews on new push
- ✅ Force pushes blocked
- ✅ Branch deletions blocked
- ✅ No required status checks (to be added when CI is configured in Phase 2)

**Branch `feat/dashboard-redesign` created: ✅ CONFIRMED**
- Created from: `main` (clean)
- Pushed to: `origin/feat/dashboard-redesign`
- All Phase 1 work commits to this branch; merges to `main` via PR only.

---

*Plan version: 2.0.0 | Generated by AppBuilderAgent | Co-lead: SoftwareEngineerAgent*
