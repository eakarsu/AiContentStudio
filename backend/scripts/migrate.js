'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const backendDirectory = path.resolve(__dirname, '..');
const cli = require.resolve('prisma/build/index.js');
const deploy = spawnSync(process.execPath, [cli, 'migrate', 'deploy'], {
  cwd: backendDirectory,
  stdio: 'inherit',
  env: process.env,
});
if (deploy.error) throw deploy.error;
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

// Some existing local databases recorded this migration before its
// authoritative content tables were added. Reapply the idempotent SQL so a
// recorded migration can never leave the runtime schema incomplete.
const migration = path.join(
  backendDirectory,
  'prisma/migrations/202607180001_authoritative_content/migration.sql',
);
const reconcile = spawnSync('psql', [
  process.env.DATABASE_URL,
  '-v', 'ON_ERROR_STOP=1',
  '-f', migration,
], {
  cwd: backendDirectory,
  stdio: 'inherit',
  env: process.env,
});
if (reconcile.error) throw reconcile.error;
process.exit(reconcile.status ?? 1);
