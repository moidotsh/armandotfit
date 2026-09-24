// scripts/deploy-plates-static.ts
// PLAN B — the plates as their own static Vercel project (the
// "separate repo" option). Deploys public/exercise-plates as a
// standalone static site ONCE; it is a DEPLOYMENT, not a Blob store,
// so the Blob operations pause cannot touch it. The app then points
// EXPO_PUBLIC_PLATE_BASE at the project's URL (set in the Vercel
// dashboard) and the plates serve again.
//
// Run: bun run plates:deploy-static
// Requires the vercel CLI, authed into the armandotfit account.
// Re-run only when the plates themselves change (rare — regenerations).
//
// After the deploy prints its URL (https://<something>.vercel.app):
//   1. Set EXPO_PUBLIC_PLATE_BASE on the armandotfit project to it.
//   2. Redeploy the app (any push).
// The Blob store stays paused-or-not; nothing depends on it.

import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const REPO = join(import.meta.dir, '..');
const STAGE = join(REPO, '.plates-static');

function run(cmd: string, args: string[], cwd = REPO): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], cwd });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ ok: code === 0, out }));
    child.on('error', (e) => resolve({ ok: false, out: String(e) }));
  });
}

async function main() {
  if (!existsSync(join(REPO, 'public', 'exercise-plates'))) {
    console.error('No plates found — run the importer first.');
    process.exit(1);
  }

  // Stage: vercel.json (static output + long-cache headers) + plates.
  rmSync(STAGE, { recursive: true, force: true });
  mkdirSync(join(STAGE, 'exercise-plates'), { recursive: true });
  writeFileSync(
    join(STAGE, 'vercel.json'),
    JSON.stringify(
      {
        version: 2,
        outputDirectory: '.',
        headers: [
          {
            source: '/exercise-plates/(.*)',
            headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
          },
        ],
      },
      null,
      2,
  ) + '\n',
  );
  cpSync(join(REPO, 'public', 'exercise-plates'), join(STAGE, 'exercise-plates'), {
    recursive: true,
  });
  console.log('Staged 61 MB of plates + vercel.json.');

  // Deploy: a NEW standalone project (never linked to the app repo).
  console.log('Deploying (this creates the armandotfit-plates project)…');
  const res = await run('vercel', ['deploy', '--prod', '--yes', '--name', 'armandotfit-plates'], STAGE);
  console.log(res.out.trim());
  if (!res.ok) process.exit(1);
  // The deployment-specific URL is SSO-protected (deployment
  // protection); the project's PRODUCTION alias is the public one.
  const url = 'https://armandotfit-plates.vercel.app';
  console.log('\nNext — set this on the armandotfit project (Production):');
  console.log(`  EXPO_PUBLIC_PLATE_BASE = ${url}`);
  console.log('then redeploy the app (the alias, NOT the deployment URL —');
  console.log('deployment URLs sit behind SSO protection).');
}

main();
