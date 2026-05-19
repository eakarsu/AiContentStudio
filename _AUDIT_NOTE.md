# Audit Note — AiContentStudio

Source: `_AUDIT/reports/batch_02.md`

## Maturity: TEMPLATE-CLONE / borderline SUBSTANTIVE (30 routes, 0 AI endpoints in audit's count)

The audit reports 0 AI endpoints, but inspection shows `routes/aiNew.js` is mounted
and the project has substantial structure. The "missing AI counterparts" claim is
accurate at the level of canonical /api/ai/generate-* coverage.

## Original audit recommendations

### Gaps — missing AI counterparts
- ALL content routes lack canonical AI endpoints. Missing `/generate-blog`, `/generate-video-script`, `/suggest-seo-keywords`, `/optimize-for-engagement`, `/detect-plagiarism`, `/auto-translate`, `/suggest-images`, `/recommend-music`, `/generate-social-variants`, `/predict-performance`.

### Gaps — missing non-AI features
- No team collaboration / permissions.
- No approval workflow.
- No real-time publishing integrations (WordPress, Webflow, Medium, Ghost).
- No analytics aggregation from published platforms.

### Custom Feature Suggestions
- AI-driven content brief generation.
- Automated A/B testing.
- Predictive content ROI scoring.
- White-label SaaS.
- Influencer outreach automation.

## Categorization
- Per the apply2 instructions: **30 routes hits the substantive threshold → backlog-only**.
- The audit's missing AI endpoints are mechanical to add but the surface area is wide (10+ endpoints) and deserves a single planned pass.

## Implementations applied
- None this round (substantive → backlog-only).

## Backlog (prioritized)

### High priority
- **Add canonical `/api/ai/*` AI endpoints** matching each content type. Wire to existing
  feature routes (videos, audio, text, images, translations, etc.) so each non-AI route
  has a paired AI counterpart.
- **Approval workflow** model + routes (review states for content).

### Medium priority
- **Real-time publishing connectors** (NEEDS-CREDS for WordPress / Medium / Ghost).
- **Cross-platform analytics aggregation**.

### Low priority
- White-label per-agency branding.
- Influencer outreach automation.
- Predictive content ROI scoring (needs historical data).

## Apply pass 3 (frontend)

- Stack: Vite + React frontend, Express backend.
- Backend AI endpoints from apply pass 2 (`/api/ai/content-cluster`,
  `/api/ai/repurpose-video`, `/api/ai/brand-story`) are exposed via
  `frontend/src/services/api.js` (`aiNewApi.*`) AND consumed in
  `frontend/src/pages/AdvancedSuite.jsx` via `api.post('/ai/content-cluster' | '/ai/repurpose-video' | '/ai/brand-story', ...)`.
- Action: **LEFT-AS-IS** — frontend is already wired (idempotence rule).
- No files changed this pass.

## Apply pass 4 (mechanical backlog)

- Action: **NO-OP** — the five canonical AI counterparts called out by
  the audit (`/api/ai/suggest-seo-keywords`, `/api/ai/optimize-for-engagement`,
  `/api/ai/generate-social-variants`, `/api/ai/predict-performance`,
  `/api/ai/detect-plagiarism`) are already implemented in
  `backend/src/routes/aiNew.js` with `ensureApiKeyOr503` guards and
  already wired into `frontend/src/pages/AdvancedSuite.jsx` as tabs.
- Remaining backlog is non-mechanical: approval workflow (substantive),
  publishing connectors (NEEDS-CREDS), analytics aggregation
  (NEEDS-CREDS), white-label / influencer outreach / predictive ROI
  (PRODUCT-DECISION / TOO-RISKY).
- No files changed this pass.
