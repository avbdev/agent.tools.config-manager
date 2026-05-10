# GitHub Issues — Phase 1 Scaffold

> Run `scripts/create-issues.sh` to create all issues via `gh` CLI.
> All issues reference `feat/dashboard-redesign` as the implementation branch.

---

## Epic: ConfigVault v2 — Dashboard Redesign

### Phase 1 Issues (P1 — MVP)

| # | Title | Label | Milestone |
|---|-------|-------|-----------|
| 1 | [SCHEMA] Apply Prisma schema v2 — multi-tenant hierarchy + versioned configs | `schema`, `p1` | Phase 1 |
| 2 | [DESIGN-SYSTEM] Implement design token CSS variables + cn() utility | `design`, `p1` | Phase 1 |
| 3 | [DESIGN-SYSTEM] Build UI primitives: Button, Card, Badge, Input, Select | `design`, `components`, `p1` | Phase 1 |
| 4 | [LAYOUT] Implement collapsible sidebar navigation shell | `layout`, `p1` | Phase 1 |
| 5 | [LAYOUT] Implement topbar with env breadcrumb context switcher | `layout`, `p1` | Phase 1 |
| 6 | [AUTH] Build login page (email/password form, premium UI) | `auth`, `p1` | Phase 1 |
| 7 | [AUTH] Build register page + route middleware (protect dashboard) | `auth`, `p1` | Phase 1 |
| 8 | [API] Implement org/project/environment CRUD routes | `api`, `p1` | Phase 1 |
| 9 | [CONFIGS] Build config key-value list page (typed, versioned) | `configs`, `p1` | Phase 1 |
| 10 | [CONFIGS] Implement config create/edit/delete with audit write | `configs`, `p1` | Phase 1 |
| 11 | [SECRETS] Build secrets vault page (masked by default) | `secrets`, `p1` | Phase 1 |
| 12 | [SECRETS] Implement glass morphism secret reveal modal + audit | `secrets`, `p1` | Phase 1 |
| 13 | [DASHBOARD] Build overview page: health cards + expiry warnings + activity | `dashboard`, `p1` | Phase 1 |
| 14 | [AUDIT] Build audit log timeline page with filter controls | `audit`, `p1` | Phase 1 |
| 15 | [UX] Implement cmd+K command palette (search configs + navigate) | `ux`, `p1` | Phase 1 |
| 16 | [DEPS] Install required packages: clsx, tailwind-merge, @headlessui/react, @heroicons/react, date-fns | `deps`, `p1` | Phase 1 |

### Phase 2 Issues (P2 — Power Features, future milestone)

| # | Title | Label | Milestone |
|---|-------|-------|-----------|
| 17 | [BUNDLES] Environment variable bundle import/export (.env, JSON, YAML) | `bundles`, `p2` | Phase 2 |
| 18 | [TOKENS] API key / service token issuance, scoping, rotation, revocation | `tokens`, `p2` | Phase 2 |
| 19 | [CERTS] Certificate upload, expiry tracking, rotation alerts | `certs`, `p2` | Phase 2 |
| 20 | [HISTORY] Per-config change history timeline + rollback | `configs`, `p2` | Phase 2 |
| 21 | [SERVICE-API] Read-only service fetch API (/api/v1/fetch) with scoped token auth | `api`, `p2` | Phase 2 |
| 22 | [USERS] User invite flow + per-org RBAC (Owner/Admin/Editor/Viewer) | `users`, `rbac`, `p2` | Phase 2 |
| 23 | [SEARCH] Global search with tag filter, sort, bulk operations | `ux`, `p2` | Phase 2 |
| 24 | [OBSERVABILITY] Add Vercel OTel middleware + structured logging | `observability`, `p2` | Phase 2 |
