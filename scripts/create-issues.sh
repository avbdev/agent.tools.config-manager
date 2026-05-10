#!/usr/bin/env bash
# ConfigVault v2 — Create GitHub Issues for Phase 1 & Phase 2
# Usage: bash scripts/create-issues.sh
# Requires: gh CLI authenticated

set -euo pipefail

REPO="avbdev/agent.tools.config-manager"
BRANCH="feat/dashboard-redesign"

echo "Creating milestones..."
gh api --method POST /repos/$REPO/milestones -f title="Phase 1 — MVP" -f description="Core vault: hierarchy, secrets, configs, audit, premium UI" 2>/dev/null || true
gh api --method POST /repos/$REPO/milestones -f title="Phase 2 — Power Features" -f description="Bundles, tokens, certs, history, service API, RBAC" 2>/dev/null || true

echo "Creating labels..."
for label in schema design components layout auth api configs secrets dashboard audit ux deps bundles tokens certs users rbac observability p1 p2 p3; do
  gh label create "$label" --repo $REPO 2>/dev/null || true
done

echo "Creating Phase 1 issues..."

gh issue create --repo $REPO \
  --title "[SCHEMA] Apply Prisma schema v2 — multi-tenant hierarchy + versioned configs" \
  --body "## Summary
Apply the new Prisma schema v2 from \`prisma/schema.v2.prisma\`.

## Tasks
- [ ] Copy \`prisma/schema.v2.prisma\` content to \`prisma/schema.prisma\`
- [ ] Run \`npx prisma migrate dev --name v2-hierarchy\`
- [ ] Verify existing lib files compile (crypto.ts, auth.ts, audit.ts, rbac.ts)
- [ ] Update rbac.ts to use \`OrgRole\` instead of \`Role\`
- [ ] Update audit.ts to write \`orgId\`, \`resourceId\`, \`resourceType\`, \`ipAddress\`

## Acceptance Criteria
- \`npx prisma generate\` succeeds
- All existing tests pass after schema change
- \`prisma/migrations/\` includes the v2 migration file

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 7" \
  --label "schema,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[DESIGN-SYSTEM] Implement design token CSS variables + cn() utility" \
  --body "## Summary
Implement the full design system token set from REDESIGN-PLAN.md Section 5.

## Tasks
- [ ] Replace \`src/app/globals.css\` with full token set (color, typography, spacing, glass morphism)
- [ ] Add light mode override block (\`[data-theme=\"light\"]\`)
- [ ] Install \`clsx\` and \`tailwind-merge\`
- [ ] Create \`src/lib/cn.ts\` utility: \`export function cn(...inputs) { return twMerge(clsx(inputs)) }\`
- [ ] Create \`src/app/globals.css\` \`.glass-panel\`, \`.glass-modal\` classes

## Acceptance Criteria
- All CSS custom properties defined as per Section 5 token table
- \`cn()\` utility exported and typed
- No external component library dependencies added

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 5" \
  --label "design,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[DESIGN-SYSTEM] Build UI primitives: Button, Card, Badge, Input, Select" \
  --body "## Summary
Build the bespoke component library primitives using Tailwind v4 tokens and Headless UI.

## Tasks
- [ ] \`src/components/ui/button.tsx\` — variants: primary, secondary, danger, ghost; sizes: sm, md, lg
- [ ] \`src/components/ui/card.tsx\` — glass-panel wrapper
- [ ] \`src/components/ui/badge.tsx\` — status variants: success, warning, danger, info, muted
- [ ] \`src/components/ui/input.tsx\` — premium input with label + error state
- [ ] \`src/components/ui/select.tsx\` — Headless UI Listbox-based
- [ ] \`src/components/ui/skeleton.tsx\` — loading placeholder
- [ ] \`src/components/ui/status-dot.tsx\` — pulsing status indicator
- [ ] \`src/components/ui/tooltip.tsx\` — Headless UI Popover-based

## Component Convention
All components: named exports, explicit TypeScript interface for props, \`className\` prop forwarded via \`cn()\`.

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 10" \
  --label "design,components,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[LAYOUT] Implement collapsible sidebar navigation shell" \
  --body "## Summary
Build the premium collapsible sidebar with the section structure from REDESIGN-PLAN.md Section 4.

## Tasks
- [ ] Create \`src/app/(dashboard)/layout.tsx\` — route group with sidebar + main content
- [ ] Implement \`src/components/layout/sidebar.tsx\`
  - [ ] Collapsible sections (OVERVIEW, PROJECTS, VAULT, GOVERNANCE, SETTINGS)
  - [ ] Project/environment tree with collapse toggle
  - [ ] Active state highlighting
  - [ ] Collapsed mode (icon-only sidebar)
  - [ ] LocalStorage persist for collapse state
- [ ] \`src/components/ui/nav-item.tsx\` — sidebar navigation item with icon + label + badge count

## Design Requirements
- Dark mode (base), light mode toggle ready
- Glass panel sidebar background with subtle border
- Smooth expand/collapse animation (CSS transition, not JS)

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 4" \
  --label "layout,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[LAYOUT] Implement topbar with env breadcrumb context switcher" \
  --body "## Summary
Build the topbar with the Org > Project > Environment context switcher breadcrumb pill.

## Tasks
- [ ] \`src/components/layout/topbar.tsx\`
- [ ] \`src/components/layout/env-switcher.tsx\` — Headless UI Combobox for switching env context
- [ ] User avatar dropdown (profile, settings, logout)
- [ ] Theme toggle (dark/light)

**Branch:** \`$BRANCH\`" \
  --label "layout,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[AUTH] Build login page (email/password form, premium UI)" \
  --body "## Summary
Build the premium login page using the design system.

## Tasks
- [ ] \`src/app/(auth)/login/page.tsx\` — server component with form
- [ ] Wire to existing \`POST /api/auth/login\`
- [ ] Error display (invalid credentials, rate limited)
- [ ] Redirect to dashboard on success

## Design
- Full-screen gradient background (existing globals.css body gradient)
- Centered glass-modal card
- ConfigVault logo/wordmark
- \`btn-premium\` submit button

**Branch:** \`$BRANCH\`" \
  --label "auth,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[AUTH] Build register page + route middleware (protect dashboard)" \
  --body "## Summary
Build the register page and Next.js middleware to protect all dashboard routes.

## Tasks
- [ ] \`src/app/(auth)/register/page.tsx\`
- [ ] \`src/middleware.ts\` — redirect unauthenticated requests to /login
- [ ] Protect all \`/(dashboard)/\` routes

**Branch:** \`$BRANCH\`" \
  --label "auth,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[API] Implement org/project/environment CRUD routes" \
  --body "## Summary
Implement the resource hierarchy API routes per the API surface in REDESIGN-PLAN.md Section 8.

## Tasks
- [ ] \`GET/POST /api/orgs\`
- [ ] \`GET/PATCH /api/orgs/[orgId]\`
- [ ] \`GET/POST /api/orgs/[orgId]/projects\`
- [ ] \`GET/POST /api/orgs/[orgId]/projects/[projectId]/environments\`
- [ ] All routes: session auth + OrgMember role check
- [ ] All mutations write to AuditLog
- [ ] Request bodies validated with Zod schemas in \`src/lib/schemas/org.schema.ts\`

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 8" \
  --label "api,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[CONFIGS] Build config key-value list page (typed, versioned)" \
  --body "## Summary
Build the config list page for an environment with type indicators, tag display, and search.

## Tasks
- [ ] \`src/app/(dashboard)/[orgSlug]/[projectSlug]/[env]/configs/page.tsx\`
- [ ] \`src/components/configs/config-table.tsx\` — sortable table
- [ ] \`src/components/configs/config-row.tsx\` — row with type badge, value preview, actions
- [ ] \`src/components/configs/config-type-badge.tsx\`
- [ ] Inline search filter
- [ ] Tag filter chips

**Branch:** \`$BRANCH\`" \
  --label "configs,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[CONFIGS] Implement config create/edit/delete with version history + audit write" \
  --body "## Summary
Implement the config mutation API and form UI with versioning and audit.

## Tasks
- [ ] \`POST/PATCH/DELETE /api/configs\` and \`/api/configs/[id]\`
- [ ] Every write creates a \`ConfigVersion\` record (version++, isCurrent=true, previous isCurrent=false)
- [ ] Every mutation writes to \`AuditLog\` (action: CONFIG_CREATED/UPDATED/DELETED)
- [ ] \`src/components/configs/config-form.tsx\` — create/edit drawer form
- [ ] Zod schema: \`src/lib/schemas/config.schema.ts\`

**Critical:** Secret values must NEVER be returned in list responses. Only masked placeholder.

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 11 (Critical Implementation Rules)" \
  --label "configs,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[SECRETS] Build secrets vault page (masked by default)" \
  --body "## Summary
Build the secrets vault page — identical structure to configs page but masked by default.

## Tasks
- [ ] \`src/app/(dashboard)/[orgSlug]/[projectSlug]/[env]/secrets/page.tsx\`
- [ ] \`src/components/secrets/secret-row.tsx\` — masked value (\`••••••••\`) with reveal eye button
- [ ] Role gate: VIEWER role shows reveal button as disabled
- [ ] Value NEVER returned from list API for secrets (\`isSecret: true\`)

**Branch:** \`$BRANCH\`" \
  --label "secrets,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[SECRETS] Implement glass morphism secret reveal modal + audit + rate limit" \
  --body "## Summary
The most security-critical UI feature: explicit reveal with full audit trail.

## Tasks
- [ ] \`POST /api/secrets/[id]/reveal\` route
  - [ ] Auth check (session required)
  - [ ] Role check (EDITOR or above)
  - [ ] Rate limit: 10 reveals/user/minute via RateLimit table
  - [ ] Decrypt value server-side (crypto.ts decryptSecret)
  - [ ] Write to \`SecretRevealLog\` (actorId, configItemId, ipAddress, userAgent)
  - [ ] Write to \`AuditLog\` (action: SECRET_REVEAL)
  - [ ] Return decrypted value in response
- [ ] \`src/components/secrets/secret-reveal-modal.tsx\`
  - [ ] Glass morphism dialog (.glass-modal)
  - [ ] 'Are you sure? This will be logged.' confirmation
  - [ ] Shows revealed value for 30 seconds then clears
  - [ ] Copy-to-clipboard button (explicit user action only)
  - [ ] Countdown timer display

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 6 (Secret Reveal Flow)" \
  --label "secrets,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[DASHBOARD] Build overview page: health cards + expiry warnings + activity feed" \
  --body "## Summary
Build the dashboard home page with actionable health summary.

## Tasks
- [ ] \`src/app/(dashboard)/overview/page.tsx\`
- [ ] \`src/components/dashboard/health-card.tsx\` — counts: total secrets, configs, certs expiring, tokens expiring
- [ ] \`src/components/dashboard/expiry-widget.tsx\` — list of items expiring in <30 days
- [ ] \`src/components/dashboard/activity-feed.tsx\` — last 10 audit log entries
- [ ] All data fetched server-side (RSC, parallel where independent)

**Branch:** \`$BRANCH\`" \
  --label "dashboard,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[AUDIT] Build audit log timeline page with filter controls" \
  --body "## Summary
Build the full-page audit log timeline with filtering and pagination.

## Tasks
- [ ] \`src/app/(dashboard)/audit/page.tsx\`
- [ ] \`src/components/audit/audit-timeline.tsx\`
- [ ] \`src/components/audit/audit-entry.tsx\` — individual log entry with icon + action + actor + time
- [ ] \`src/components/audit/audit-filter.tsx\` — filter by: action type, actor, date range, resource type
- [ ] Paginated: 50 entries/page
- [ ] \`GET /api/audit\` supports \`?page&limit&action&actorId&from&to\`

**Branch:** \`$BRANCH\`" \
  --label "audit,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[UX] Implement cmd+K command palette (search configs + navigate pages)" \
  --body "## Summary
Premium command palette for keyboard-driven navigation, Vercel/Linear style.

## Tasks
- [ ] \`src/components/ui/command-palette.tsx\` using Headless UI Combobox
- [ ] Global \`Cmd+K\` (Mac) / \`Ctrl+K\` (Win) keyboard listener in dashboard layout
- [ ] Search: config keys + descriptions (debounced, min 2 chars)
- [ ] Navigation shortcuts: 'Go to Dashboard', 'Go to Secrets', 'Go to Audit Log'
- [ ] Action shortcuts: 'New Config', 'New Secret'
- [ ] ESC to close
- [ ] Full-screen overlay with backdrop blur

**Branch:** \`$BRANCH\`" \
  --label "ux,p1" 2>/dev/null || true

gh issue create --repo $REPO \
  --title "[DEPS] Install Phase 1 required packages" \
  --body "## Summary
Install all packages needed before Phase 1 implementation begins.

\`\`\`bash
npm install clsx tailwind-merge
npm install @headlessui/react
npm install @heroicons/react
npm install date-fns
\`\`\`

No shadcn. No Radix. No external component libraries.

**Branch:** \`$BRANCH\`
**Ref:** docs/REDESIGN-PLAN.md Section 11 (Dependencies to Install)" \
  --label "deps,p1" 2>/dev/null || true

echo ""
echo "✅ All Phase 1 issues created."
echo "View at: https://github.com/$REPO/issues"
