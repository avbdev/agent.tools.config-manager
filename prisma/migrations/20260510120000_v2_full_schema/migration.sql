-- Migration: v2_full_schema
-- Differential from 20260510074000_init → v2 enterprise schema
-- SAFE: only adds new types/tables/columns; does not recreate existing ones.

-- ---------------------------------------------------------------------------
-- Step 1: Alter existing Role enum (add SUPERADMIN value)
-- ---------------------------------------------------------------------------
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

-- ---------------------------------------------------------------------------
-- Step 2: Alter existing Session table (add elevation columns)
-- ---------------------------------------------------------------------------
ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "elevated"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "elevatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- Step 3: Alter existing AuditLog table (add v2 columns, keep existing)
-- ---------------------------------------------------------------------------
ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "orgId"        TEXT,
  ADD COLUMN IF NOT EXISTS "actorEmail"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "resource"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "resourceType" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "diff"         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "ipAddress"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "userAgent"    TEXT NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------------
-- Step 4: New enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'URL', 'SECRET_REF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Step 5: New tables
-- ---------------------------------------------------------------------------

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id"        TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");

-- OrgMember
CREATE TABLE IF NOT EXISTS "OrgMember" (
    "id"     TEXT NOT NULL,
    "orgId"  TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role"   "OrgRole" NOT NULL DEFAULT 'VIEWER',
    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrgMember_orgId_userId_key" ON "OrgMember"("orgId", "userId");
CREATE INDEX IF NOT EXISTS "OrgMember_userId_idx" ON "OrgMember"("userId");

-- Project
CREATE TABLE IF NOT EXISTS "Project" (
    "id"          TEXT NOT NULL,
    "orgId"       TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Project_orgId_slug_key" ON "Project"("orgId", "slug");
CREATE INDEX IF NOT EXISTS "Project_orgId_idx" ON "Project"("orgId");

-- Environment
CREATE TABLE IF NOT EXISTS "Environment" (
    "id"        TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Environment_projectId_slug_key" ON "Environment"("projectId", "slug");
CREATE INDEX IF NOT EXISTS "Environment_projectId_idx" ON "Environment"("projectId");

-- ConfigItem
CREATE TABLE IF NOT EXISTS "ConfigItem" (
    "id"          TEXT NOT NULL,
    "projectId"   TEXT NOT NULL,
    "envId"       TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "valueType"   "ValueType" NOT NULL DEFAULT 'STRING',
    "valuePlain"  TEXT,
    "isSecret"    BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "tags"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "ConfigItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConfigItem_projectId_envId_key_key" ON "ConfigItem"("projectId", "envId", "key");
CREATE INDEX IF NOT EXISTS "ConfigItem_projectId_envId_idx" ON "ConfigItem"("projectId", "envId");
CREATE INDEX IF NOT EXISTS "ConfigItem_key_idx" ON "ConfigItem"("key");

-- ConfigVersion
CREATE TABLE IF NOT EXISTS "ConfigVersion" (
    "id"           TEXT NOT NULL,
    "configItemId" TEXT NOT NULL,
    "version"      INTEGER NOT NULL,
    "valueCipher"  TEXT NOT NULL,
    "isSecret"     BOOLEAN NOT NULL,
    "valueType"    "ValueType" NOT NULL,
    "description"  TEXT NOT NULL DEFAULT '',
    "tags"         TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById"  TEXT,
    CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConfigVersion_configItemId_version_key" ON "ConfigVersion"("configItemId", "version");
CREATE INDEX IF NOT EXISTS "ConfigVersion_configItemId_idx" ON "ConfigVersion"("configItemId");

-- Secret
CREATE TABLE IF NOT EXISTS "Secret" (
    "id"          TEXT NOT NULL,
    "projectId"   TEXT NOT NULL,
    "envId"       TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "valueCipher" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "tags"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rotatedAt"   TIMESTAMP(3),
    "expiresAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Secret_projectId_envId_key_key" ON "Secret"("projectId", "envId", "key");
CREATE INDEX IF NOT EXISTS "Secret_projectId_envId_idx" ON "Secret"("projectId", "envId");

-- SecretRevealLog
CREATE TABLE IF NOT EXISTS "SecretRevealLog" (
    "id"        TEXT NOT NULL,
    "secretId"  TEXT NOT NULL,
    "actorId"   TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecretRevealLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SecretRevealLog_secretId_idx" ON "SecretRevealLog"("secretId");
CREATE INDEX IF NOT EXISTS "SecretRevealLog_actorId_idx" ON "SecretRevealLog"("actorId");

-- Certificate
CREATE TABLE IF NOT EXISTS "Certificate" (
    "id"          TEXT NOT NULL,
    "projectId"   TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "domain"      TEXT NOT NULL,
    "pemCipher"   TEXT NOT NULL,
    "keysCipher"  TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "issuer"      TEXT NOT NULL DEFAULT '',
    "subject"     TEXT NOT NULL DEFAULT '',
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "issuedAt"    TIMESTAMP(3) NOT NULL,
    "autoRotate"  BOOLEAN NOT NULL DEFAULT false,
    "rotatedAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Certificate_projectId_idx" ON "Certificate"("projectId");
CREATE INDEX IF NOT EXISTS "Certificate_expiresAt_idx" ON "Certificate"("expiresAt");

-- ApiToken
CREATE TABLE IF NOT EXISTS "ApiToken" (
    "id"          TEXT NOT NULL,
    "orgId"       TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "tokenHash"   TEXT NOT NULL,
    "prefix"      TEXT NOT NULL,
    "scopes"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt"   TIMESTAMP(3),
    "lastUsedAt"  TIMESTAMP(3),
    "revokedAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ApiToken_orgId_idx" ON "ApiToken"("orgId");
CREATE INDEX IF NOT EXISTS "ApiToken_tokenHash_idx" ON "ApiToken"("tokenHash");

-- ---------------------------------------------------------------------------
-- Step 6: New indexes on existing/altered tables
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Session_userId_idx"  ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");

CREATE INDEX IF NOT EXISTS "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx"          ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_resource_idx"          ON "AuditLog"("resource");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx"            ON "AuditLog"("action");

-- ---------------------------------------------------------------------------
-- Step 7: Foreign keys for new tables
-- ---------------------------------------------------------------------------
ALTER TABLE "OrgMember"
  ADD CONSTRAINT "OrgMember_orgId_fkey"  FOREIGN KEY ("orgId")  REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")         ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Environment"
  ADD CONSTRAINT "Environment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfigItem"
  ADD CONSTRAINT "ConfigItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id")      ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ConfigItem_envId_fkey"     FOREIGN KEY ("envId")     REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfigVersion"
  ADD CONSTRAINT "ConfigVersion_configItemId_fkey" FOREIGN KEY ("configItemId") REFERENCES "ConfigItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Secret"
  ADD CONSTRAINT "Secret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id")      ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Secret_envId_fkey"     FOREIGN KEY ("envId")     REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SecretRevealLog"
  ADD CONSTRAINT "SecretRevealLog_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "SecretRevealLog_actorId_fkey"  FOREIGN KEY ("actorId")  REFERENCES "User"("id")   ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Certificate"
  ADD CONSTRAINT "Certificate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiToken"
  ADD CONSTRAINT "ApiToken_orgId_fkey"       FOREIGN KEY ("orgId")       REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ApiToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id")         ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_orgId_fkey"   FOREIGN KEY ("orgId")   REFERENCES "Organization"("id") ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT "AuditLog_actorId_fkey2" FOREIGN KEY ("actorId") REFERENCES "User"("id")         ON DELETE RESTRICT  ON UPDATE CASCADE;
