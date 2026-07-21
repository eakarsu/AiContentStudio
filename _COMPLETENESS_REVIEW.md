# Completeness Review: AiContentStudio

- **Review date:** 2026-07-18
- **Assessment basis:** Static source and configuration inspection only. Dependencies were not installed, and no build, database migration, external integration, or runtime workflow was executed.

## Classification

**Prototype-demo**

## Verdict

This is a media/content prototype/demo. Its 91 source files and visible routes/pages demonstrate concepts, but they do not establish durable, integrated, tested execution of the Ai Content Studio workflow.

## Why it is not complete

- 12 files are explicitly named as gap/backlog surfaces, so page and route counts overstate implemented product capability.
- 41 project-owned files contain direct provider/chat-completion markers; generic model calls are not a substitute for typed domain tools, grounded evidence, deterministic rules, or evaluations.
- 23 files contain mock, sample, placeholder, simulated, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- No recognizable project-owned automated tests were found for the primary workflow.
- No checked-in CI workflow was found to continuously verify builds, tests, migrations, and security checks.
- No environment example/template was found, leaving required configuration and secret boundaries undocumented.

## Needed features

1. Implement the Content Studio creation workflow with source ingestion, editable timelines/assets, queued rendering, review, versioning, and publish/export status.
2. Connect real media/model providers, rights/asset libraries, storage/CDN, transcription/translation, and publishing channels with retries and usage accounting.
3. Measure output quality, timing/layout fidelity, accessibility, brand constraints, multilingual behavior, and deterministic export compatibility.
4. Add rights/licensing provenance, consent, moderation, watermark/disclosure policy, tenant isolation, and approval before publication.
5. Replace the generated “all content routes lack dedicated ai generation endpoints mi” gap surface with durable domain state, real integration behavior, explicit failure handling, and acceptance tests.
6. Add contract, integration, authorization, migration, failure-path, and end-to-end tests in CI, plus a documented nondestructive deployment/run path.

## Risks or launch blockers

- Generated media can create rights, impersonation, safety, and brand risks.
- Synchronous demo generation does not provide durable rendering, retry, storage, or publishing behavior.
- A weak JWT/session-secret fallback can make authentication forgeable when configuration is absent.
- The root launcher can terminate unrelated processes occupying configured ports.
- The root launcher seeds, creates, migrates, or otherwise mutates database state during startup.
- The root launcher installs dependencies at run time, reducing reproducibility and expanding supply-chain risk.

## Evidence inspected

- `README.md` — inspected project-owned structure or implementation evidence.
- `backend/package.json` — inspected project-owned structure or implementation evidence.
- `backend/src/index.js` — inspected project-owned structure or implementation evidence.
- `backend/src/routes/gap_all_content_routes_lack_dedicated_ai_generation_endpoints_mi.js` — inspected project-owned structure or implementation evidence.
- `start.sh` — inspected project-owned structure or implementation evidence.
- `backend/prisma/schema.prisma` — inspected project-owned structure or implementation evidence.

## Recommended next action

Treat this as a prototype: prove one narrow media/content outcome end to end with real data, durable state, domain validation, and tests before expanding its feature catalog.

## Implementation progress (2026-07-19)

1. **Creation workflow:** implemented tenant-scoped project/source creation, checksum-bound assets, editable timeline/asset updates, immutable snapshots, guarded review/render/publish/export transitions, recoverable queued delivery leases, and publish-receipt status in `backend/src/domain/contentWorkflow.js`, `backend/src/routes/authoritative.js`, and `backend/prisma/migrations/202607180001_authoritative_content/migration.sql`.
2. **Providers:** added typed and operation-limited adapters for model generation, rights and asset libraries, object storage/CDN, rendering, transcription, translation, and WordPress/Webflow/YouTube publication. Payload-bound idempotency, timeouts, explicit primary/fallback providers, exponential retry/dead-letter handling, lease recovery, and validated usage accounting are in `backend/src/providers/contentProviders.js` and the durable delivery table. Live calls remain blocked until owners provision URLs, credentials, quotas, licensed catalogs, storage/CDN, and channel accounts.
3. **Quality measurement:** implemented fail-closed quality, timing, layout, accessibility, brand, multilingual, and deterministic-export gates with server-owned thresholds. `backend/test/fixtures/content-evaluation.v1.json` is a versioned acceptance corpus exercised by `backend/test/contentWorkflow.test.js`; production thresholds and representative brand/language/media fixtures still require owner calibration.
4. **Rights and safety:** assets now require license, consent status, provenance URI, safe object URI, and SHA-256 identity; project disclosure/watermark policy, independent rights/moderation approval, server-derived tenant identity/role, and append-only audits gate consequential transitions. Legal approval of licenses/consent, moderation vendors, disclosure wording, and retention policy remains external.
5. **Generated gap replacement:** legacy/generated direct-generation routes are quarantined behind HTTP 410. `/api/authoritative/content` now provides durable create/edit/version/transition/delivery/evaluation behavior, explicit errors, provider contracts, and acceptance tests rather than a generated gap page.
6. **Tests and operations:** added domain, authorization, architecture/contract, provider integration/failure, versioned-fixture, migration, launch-readiness, frontend-build, and production-dependency audit checks in `.github/workflows/authoritative.yml`. `start.sh`, `.env.example`, and `RUNBOOK.md` define a lockfile-only, nondestructive launch path. Local validation passed 19 Node tests, Node syntax checks, Prisma schema validation/client generation, zero-vulnerability production dependency audits, and the Vite production build. The isolated PostgreSQL migration/readiness smoke is configured in CI but was not applied to an owner deployment database here.

**Ledger readiness:** ready to ledger as source-complete for the reviewed requirements, with provider infrastructure/credentials, licensed catalogs, production media evaluation, legal/moderation policy approval, and live-channel verification explicitly retained as external launch blockers.

## Runtime acceptance (2026-07-20)

The first isolated launch stopped with `configuration_missing` because no CORS origin was provided. The launcher now derives a loopback-only origin from `FRONTEND_PORT`. Runtime then exposed two real database-readiness gaps: Prisma cannot deserialize a raw PostgreSQL `regclass`, and generic schema-push tooling did not discover the authoritative raw-SQL migration. The readiness query now casts the table identifier to text, while `backend/migrations/001_authoritative_content.sql` delegates to the single Prisma migration source. Fresh demo identities also receive `SEED_TENANT_ID` or a generated tenant UUID. On PostgreSQL `55542` and API/UI ports `5904`/`5905`, the final isolated verifier recorded `API_VERIFIED` with `startup_login_session_api` through persisted bcrypt login and current-user verification.
