'use strict';

const express = require('express');
const crypto = require('crypto');
const { requireScope, validateProject, transition, delivery, evaluate, hash } = require('../domain/contentWorkflow');
const { dispatch, providerSupports } = require('../providers/contentProviders');

const router = express.Router();
const actor = req => ({ tenantId: req.tenantId, role: req.userRole });
const permit = (req, action) => requireScope(actor(req), req.tenantId, action);
const rows = (req, sql, ...args) => req.prisma.$queryRawUnsafe(sql, ...args);

const evaluationLimits = () => ({
  quality: Number(process.env.CONTENT_MIN_QUALITY || 0.9),
  timingErrorMs: Number(process.env.CONTENT_MAX_TIMING_ERROR_MS || 100),
  layoutScore: Number(process.env.CONTENT_MIN_LAYOUT_SCORE || 0.9),
  accessibility: Number(process.env.CONTENT_MIN_ACCESSIBILITY || 0.9),
  brandScore: Number(process.env.CONTENT_MIN_BRAND_SCORE || 0.9),
  translationScore: Number(process.env.CONTENT_MIN_TRANSLATION_SCORE || 0.85)
});

async function audit(tx, req, action, resourceType, resourceId, beforeHash, afterHash, metadata = {}) {
  await tx.$executeRawUnsafe(
    'INSERT INTO content_audit(tenant_id,actor_id,actor_role,action,resource_type,resource_id,before_hash,after_hash,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)',
    req.tenantId, String(req.userId), req.userRole, action, resourceType, resourceId, beforeHash, afterHash, JSON.stringify(metadata)
  );
}

async function addVersion(tx, req, project, state, snapshot) {
  const versions = await tx.$queryRawUnsafe('SELECT COALESCE(MAX(version),0)+1 AS version FROM content_project_versions WHERE project_id=$1', project.id);
  const version = Number(versions[0].version);
  const snapshotHash = hash(snapshot);
  await tx.$executeRawUnsafe(
    'INSERT INTO content_project_versions(id,tenant_id,project_id,version,state,snapshot,snapshot_hash,created_by) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',
    crypto.randomUUID(), req.tenantId, project.id, version, state, JSON.stringify(snapshot), snapshotHash, String(req.userId)
  );
  return { version, snapshotHash };
}

router.post('/projects', async (req, res, next) => {
  try {
    permit(req, 'edit');
    const value = validateProject({ ...req.body, ownerId: String(req.userId) });
    const id = crypto.randomUUID();
    await req.prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(
        'INSERT INTO content_projects(id,tenant_id,title,owner_id,state,brand_version,project_hash,timeline,disclosure) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb)',
        id, req.tenantId, value.title, String(req.userId), value.state, value.brandVersion, value.projectHash, JSON.stringify(value.timeline), JSON.stringify(value.disclosurePolicy)
      );
      for (const asset of value.assets) {
        await tx.$executeRawUnsafe(
          'INSERT INTO content_assets(id,tenant_id,project_id,kind,object_uri,checksum,rights,metadata) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)',
          asset.id, req.tenantId, id, asset.kind || 'unknown', asset.objectUri, asset.checksum, JSON.stringify(asset.rights), JSON.stringify(asset.metadata || {})
        );
      }
      await tx.$executeRawUnsafe(
        'INSERT INTO content_project_versions(id,tenant_id,project_id,version,state,snapshot,snapshot_hash,created_by) VALUES($1,$2,$3,1,$4,$5::jsonb,$6,$7)',
        crypto.randomUUID(), req.tenantId, id, value.state, JSON.stringify(value), value.projectHash, String(req.userId)
      );
      await audit(tx, req, 'project.created', 'content_project', id, null, value.projectHash);
    });
    res.status(201).json({ id, state: value.state, version: 1, projectHash: value.projectHash });
  } catch (error) { next(error); }
});

router.get('/projects/:id', async (req, res, next) => {
  try {
    permit(req, 'read');
    const found = await rows(req, 'SELECT * FROM content_projects WHERE id=$1 AND tenant_id=$2', req.params.id, req.tenantId);
    if (!found.length) return res.status(404).json({ error: 'project_not_found' });
    const assets = await rows(req, 'SELECT * FROM content_assets WHERE project_id=$1 AND tenant_id=$2 ORDER BY created_at', req.params.id, req.tenantId);
    const versions = await rows(req, 'SELECT version,state,snapshot_hash,created_by,created_at FROM content_project_versions WHERE project_id=$1 AND tenant_id=$2 ORDER BY version DESC', req.params.id, req.tenantId);
    res.json({ ...found[0], assets, versions });
  } catch (error) { next(error); }
});

router.put('/projects/:id', async (req, res, next) => {
  try {
    permit(req, 'edit');
    const result = await req.prisma.$transaction(async tx => {
      const found = await tx.$queryRawUnsafe('SELECT * FROM content_projects WHERE id=$1 AND tenant_id=$2 FOR UPDATE', req.params.id, req.tenantId);
      if (!found.length) return null;
      const row = found[0];
      if (!['source_ingested', 'editing', 'rejected'].includes(row.state)) throw new Error('project_not_editable');
      const existingAssets = await tx.$queryRawUnsafe('SELECT * FROM content_assets WHERE project_id=$1 AND tenant_id=$2 ORDER BY created_at', row.id, req.tenantId);
      const assets = req.body.assets || existingAssets.map(asset => ({
        id: asset.id, kind: asset.kind, objectUri: asset.object_uri, checksum: asset.checksum,
        rights: asset.rights, metadata: asset.metadata
      }));
      const value = validateProject({
        title: req.body.title || row.title,
        ownerId: row.owner_id,
        brandVersion: req.body.brandVersion || row.brand_version,
        timeline: req.body.timeline || row.timeline,
        assets,
        disclosurePolicy: req.body.disclosurePolicy || row.disclosure
      });
      const snapshot = { ...value, state: 'editing' };
      const projectHash = hash(snapshot);
      await tx.$executeRawUnsafe(
        'UPDATE content_projects SET title=$1,state=\'editing\',brand_version=$2,project_hash=$3,timeline=$4::jsonb,disclosure=$5::jsonb,updated_at=NOW() WHERE id=$6 AND tenant_id=$7',
        value.title, value.brandVersion, projectHash, JSON.stringify(value.timeline), JSON.stringify(value.disclosurePolicy), row.id, req.tenantId
      );
      if (req.body.assets) {
        await tx.$executeRawUnsafe('DELETE FROM content_assets WHERE project_id=$1 AND tenant_id=$2', row.id, req.tenantId);
        for (const asset of value.assets) {
          await tx.$executeRawUnsafe(
            'INSERT INTO content_assets(id,tenant_id,project_id,kind,object_uri,checksum,rights,metadata) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)',
            asset.id, req.tenantId, row.id, asset.kind || 'unknown', asset.objectUri, asset.checksum, JSON.stringify(asset.rights), JSON.stringify(asset.metadata || {})
          );
        }
      }
      const version = await addVersion(tx, req, row, 'editing', snapshot);
      await audit(tx, req, 'project.edited', 'content_project', row.id, row.project_hash, projectHash, { version: version.version });
      return { id: row.id, state: 'editing', version: version.version, projectHash };
    });
    if (!result) return res.status(404).json({ error: 'project_not_found' });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/projects/:id/transition', async (req, res, next) => {
  try {
    const result = await req.prisma.$transaction(async tx => {
      const found = await tx.$queryRawUnsafe('SELECT * FROM content_projects WHERE id=$1 AND tenant_id=$2 FOR UPDATE', req.params.id, req.tenantId);
      if (!found.length) return null;
      const row = found[0];
      const action = req.body.target === 'approved' ? 'review' : req.body.target === 'published' ? 'publish' : 'edit';
      permit(req, action);
      if (req.body.target === 'published') {
        const receipts = await tx.$queryRawUnsafe("SELECT 1 FROM content_deliveries WHERE tenant_id=$1 AND project_id=$2 AND operation='publish' AND status='confirmed' AND receipt->>'providerRequestId'=$3", req.tenantId, row.id, req.body.providerReceiptId);
        if (!receipts.length) throw new Error('confirmed_publish_receipt_required');
      }
      const approvalId = req.body.target === 'approved' ? crypto.randomUUID() : row.approval_id;
      const target = transition(row.state, req.body.target, {
        ...req.body, reviewerId: String(req.userId), ownerId: row.owner_id,
        providerReceiptId: req.body.providerReceiptId, publisherApprovalId: row.approval_id
      });
      await tx.$executeRawUnsafe('UPDATE content_projects SET state=$1,approval_id=COALESCE($2,approval_id),updated_at=NOW() WHERE id=$3 AND tenant_id=$4', target, approvalId || null, row.id, req.tenantId);
      const snapshot = { ...row, state: target, approvalId };
      const version = await addVersion(tx, req, row, target, snapshot);
      await audit(tx, req, 'project.transitioned', 'content_project', row.id, hash({ state: row.state }), hash({ state: target }), { from: row.state, to: target, version: version.version });
      return { id: row.id, state: target, approvalId, version: version.version };
    });
    if (!result) return res.status(404).json({ error: 'project_not_found' });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/projects/:id/deliveries', async (req, res, next) => {
  try {
    if (!providerSupports(req.body.provider, req.body.operation)) throw new Error('unsupported_provider_operation');
    if (req.body.fallbackProvider && (!providerSupports(req.body.fallbackProvider, req.body.operation) || req.body.fallbackProvider === req.body.provider)) throw new Error('invalid_fallback_provider');
    permit(req, req.body.operation === 'publish' ? 'publish' : 'edit');
    const projects = await rows(req, 'SELECT * FROM content_projects WHERE id=$1 AND tenant_id=$2', req.params.id, req.tenantId);
    if (!projects.length) return res.status(404).json({ error: 'project_not_found' });
    if (req.body.operation === 'render' && projects[0].state !== 'render_queued') throw new Error('project_not_render_queued');
    if (req.body.operation === 'publish' && projects[0].state !== 'publish_pending') throw new Error('project_not_publish_pending');
    const item = delivery(req.body.provider, req.body.operation, req.body.payload, req.body.idempotencyKey, null, req.body.usage || {});
    const result = await req.prisma.$transaction(async tx => {
      const inserted = await tx.$queryRawUnsafe(
        'INSERT INTO content_deliveries(id,tenant_id,project_id,provider,fallback_provider,operation,idempotency_key,payload_hash,payload,usage) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb) ON CONFLICT(tenant_id,provider,idempotency_key) DO UPDATE SET updated_at=content_deliveries.updated_at RETURNING *',
        crypto.randomUUID(), req.tenantId, req.params.id, item.provider, req.body.fallbackProvider || null, item.operation, item.idempotencyKey, item.payloadHash, JSON.stringify(req.body.payload), JSON.stringify(item.usage)
      );
      await audit(tx, req, 'delivery.queued', 'content_delivery', inserted[0].id, null, item.payloadHash, { provider: item.provider, operation: item.operation });
      return inserted[0];
    });
    res.status(202).json(result);
  } catch (error) { next(error); }
});

router.post('/deliveries/:id/attempt', async (req, res, next) => {
  try {
    const candidates = await rows(req, 'SELECT operation FROM content_deliveries WHERE id=$1 AND tenant_id=$2', req.params.id, req.tenantId);
    if (!candidates.length) return res.status(404).json({ error: 'delivery_not_found' });
    permit(req, candidates[0].operation === 'publish' ? 'publish' : 'edit');
    const claimed = await rows(req, "UPDATE content_deliveries SET status='leased',lease_expires_at=NOW()+INTERVAL '60 seconds',updated_at=NOW() WHERE id=$1 AND tenant_id=$2 AND ((status IN ('queued','retrying') AND next_attempt_at<=NOW()) OR (status='leased' AND lease_expires_at<NOW())) RETURNING *", req.params.id, req.tenantId);
    if (!claimed.length) return res.status(409).json({ error: 'delivery_not_dispatchable' });
    const row = claimed[0];
    try {
      const receipt = await dispatch(row);
      const updated = await rows(req, "UPDATE content_deliveries SET status='confirmed',receipt=$1::jsonb,attempts=attempts+1,lease_expires_at=NULL,updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING *", JSON.stringify(receipt), row.id, req.tenantId);
      res.json(updated[0]);
    } catch (error) {
      if (row.fallback_provider) {
        try {
          const receipt = await dispatch({ ...row, provider: row.fallback_provider });
          const fallbackReceipt = { ...receipt, fulfilledBy: row.fallback_provider, primaryError: error.message };
          const updated = await rows(req, "UPDATE content_deliveries SET status='confirmed',receipt=$1::jsonb,attempts=attempts+1,lease_expires_at=NULL,last_error=$2,updated_at=NOW() WHERE id=$3 AND tenant_id=$4 RETURNING *", JSON.stringify(fallbackReceipt), error.message, row.id, req.tenantId);
          return res.json(updated[0]);
        } catch (fallbackError) {
          error.message = `${error.message};fallback:${fallbackError.message}`;
        }
      }
      const updated = await rows(req, "UPDATE content_deliveries SET attempts=attempts+1,status=CASE WHEN attempts+1>=max_attempts THEN 'dead_letter' ELSE 'retrying' END,next_attempt_at=NOW()+(POWER(2,LEAST(attempts,8))||' seconds')::interval,lease_expires_at=NULL,last_error=$1,updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING *", error.message, row.id, req.tenantId);
      return res.status(503).json(updated[0]);
    }
  } catch (error) { next(error); }
});

router.post('/evaluations', async (req, res, next) => {
  try {
    permit(req, 'review');
    if (!req.body.suiteVersion || !req.body.fixtureVersion) throw new Error('evaluation_versions_required');
    const projects = await rows(req, 'SELECT id FROM content_projects WHERE id=$1 AND tenant_id=$2', req.body.projectId, req.tenantId);
    if (!projects.length) return res.status(404).json({ error: 'project_not_found' });
    const limits = evaluationLimits();
    const outcome = evaluate(req.body.metrics || {}, limits);
    const id = crypto.randomUUID();
    await req.prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(
        'INSERT INTO content_evaluations(id,tenant_id,project_id,suite_version,fixture_version,metrics,limits,accepted,failures,result_hash) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10)',
        id, req.tenantId, req.body.projectId, req.body.suiteVersion, req.body.fixtureVersion, JSON.stringify(req.body.metrics), JSON.stringify(limits), outcome.accepted, JSON.stringify(outcome.failures), outcome.resultHash
      );
      await audit(tx, req, 'evaluation.recorded', 'content_evaluation', id, null, outcome.resultHash, { accepted: outcome.accepted, failures: outcome.failures });
    });
    res.status(outcome.accepted ? 201 : 422).json({ id, limits, ...outcome });
  } catch (error) { next(error); }
});

module.exports = router;
