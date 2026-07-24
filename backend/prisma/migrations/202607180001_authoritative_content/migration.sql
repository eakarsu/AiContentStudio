CREATE TABLE IF NOT EXISTS "User" (
 "id" SERIAL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "password" TEXT NOT NULL, "name" TEXT NOT NULL,
 "role" TEXT NOT NULL DEFAULT 'editor', "tenantId" TEXT, "avatar" TEXT, "twoFactorSecret" TEXT,
 "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE, "lastLogin" TIMESTAMP(3), "loginCount" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "PasswordReset" (
 "id" SERIAL PRIMARY KEY, "token" TEXT NOT NULL UNIQUE, "expiresAt" TIMESTAMP(3) NOT NULL, "used" BOOLEAN NOT NULL DEFAULT FALSE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "ApiKey" (
 "id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL, "key" TEXT NOT NULL UNIQUE, "lastUsed" TIMESTAMP(3), "expiresAt" TIMESTAMP(3),
 "active" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS "AuditLog" (
 "id" SERIAL PRIMARY KEY, "action" TEXT NOT NULL, "resource" TEXT NOT NULL, "resourceId" INTEGER, "details" TEXT,
 "ipAddress" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT
);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
CREATE INDEX IF NOT EXISTS content_users_tenant_idx ON "User" ("tenantId", id);
CREATE TABLE IF NOT EXISTS content_projects (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, owner_id TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('source_ingested','editing','review_pending','approved','rejected','render_queued','rendering','rendered','publish_pending','published','exported','failed')),
 brand_version TEXT NOT NULL, project_hash CHAR(64) NOT NULL, timeline JSONB NOT NULL, disclosure JSONB NOT NULL,
 approval_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS content_project_versions (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES content_projects(id), version INTEGER NOT NULL CHECK(version>0),
 state TEXT NOT NULL, snapshot JSONB NOT NULL, snapshot_hash CHAR(64) NOT NULL, created_by TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(project_id,version)
);
CREATE TABLE IF NOT EXISTS content_assets (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES content_projects(id), kind TEXT NOT NULL,
 object_uri TEXT NOT NULL, checksum CHAR(64) NOT NULL, rights JSONB NOT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS content_deliveries (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES content_projects(id), provider TEXT NOT NULL, fallback_provider TEXT,
 operation TEXT NOT NULL, idempotency_key TEXT NOT NULL, payload_hash CHAR(64) NOT NULL, payload JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','leased','retrying','confirmed','dead_letter')),
 attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 5, next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), lease_expires_at TIMESTAMPTZ,
 last_error TEXT, receipt JSONB, usage JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(tenant_id, provider, idempotency_key)
);
CREATE TABLE IF NOT EXISTS content_evaluations (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES content_projects(id), suite_version TEXT NOT NULL,
 fixture_version TEXT NOT NULL, metrics JSONB NOT NULL, limits JSONB NOT NULL, accepted BOOLEAN NOT NULL, failures JSONB NOT NULL,
 result_hash CHAR(64) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS content_ai_results (
 id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, feature TEXT NOT NULL,
 input JSONB NOT NULL, output TEXT NOT NULL, model TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS content_ai_results_tenant_created_idx ON content_ai_results(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS content_projects_tenant_idx ON content_projects(tenant_id,id);
CREATE INDEX IF NOT EXISTS content_assets_tenant_project_idx ON content_assets(tenant_id,project_id);
CREATE INDEX IF NOT EXISTS content_deliveries_dispatch_idx ON content_deliveries(tenant_id,status,next_attempt_at);
CREATE TABLE IF NOT EXISTS content_audit (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, actor_role TEXT NOT NULL, action TEXT NOT NULL,
 resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, before_hash CHAR(64), after_hash CHAR(64), metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION content_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'content_audit is append-only'; END; $$;
DROP TRIGGER IF EXISTS content_audit_no_update ON content_audit;
CREATE TRIGGER content_audit_no_update BEFORE UPDATE OR DELETE ON content_audit FOR EACH ROW EXECUTE FUNCTION content_audit_immutable();
