'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-thirty-two-characters';
const authorize = require('../src/middleware/auth');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('authorization rejects a token whose tenant no longer matches the user', async () => {
  const token = jwt.sign({ userId: 7, tenantId: 'tenant-a' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` }, prisma: { user: { findUnique: async () => ({ role: 'editor', tenantId: 'tenant-b' }) } } };
  const res = response();
  let called = false;
  await authorize(req, res, () => { called = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(called, false);
});

test('authorization attaches server-owned role and tenant for a valid identity', async () => {
  const token = jwt.sign({ userId: 7, tenantId: 'tenant-a', role: 'admin' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` }, prisma: { user: { findUnique: async () => ({ role: 'reviewer', tenantId: 'tenant-a' }) } } };
  const res = response();
  let called = false;
  await authorize(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.userRole, 'reviewer');
  assert.equal(req.tenantId, 'tenant-a');
});
