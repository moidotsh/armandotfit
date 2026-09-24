// scripts/upload-plates.ts
// Upload the exercise plates to the Vercel Blob store — the one-time
// (or rare, post-regeneration) act that takes 61 MB out of every
// deployment. Requires the vercel CLI, linked to the project
// (`vercel link`); authenticate by login.
//
// Run: bun run plates:upload [-- <vercel-blob-put flags>]
//
// NOTE ON ENV: bun auto-loads .env.local, and the store-linking step
// writes VERCEL_OIDC_TOKEN there — the blob CLI then demands a paired
// BLOB_STORE_ID and refuses to run. The spawn below strips the OIDC
// variables so the CLI falls back to login + linked-project auth (the
// stable path for a solo owner). Explicit passthrough still works:
//   bun run plates:upload -- --store-id store_xxx --rw-token yyy
//
// On success the first uploaded URL reveals the store's public base —
// the script prints the ready-to-paste EXPO_PUBLIC_PLATE_BASE value.

import { readdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const PLATES_DIR = join(import.meta.dir, '..', 'public', 'exercise-plates');
// One-year max-age (the CLI's --cache-control-max-age, in seconds) —
// plates only change by deliberate regeneration, and re-runs pass
// --allow-overwrite to replace same-path blobs.
const CACHE_MAX_AGE = '31536000';
const CONCURRENCY = 8;

const passthrough = process.argv.slice(2);

// Login + linked-project auth: strip the unpaired OIDC variables
// (see header). Everything else passes through untouched.
const CHILD_ENV = Object.fromEntries(
  Object.entries(process.env).filter(
    ([k]) => k !== 'VERCEL_OIDC_TOKEN' && k !== 'BLOB_STORE_ID',
  ),
) as NodeJS.ProcessEnv;

function run(cmd: string, args: string[]): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: CHILD_ENV });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ ok: code === 0, out }));
    child.on('error', (e) => resolve({ ok: false, out: String(e) }));
  });
}

async function main() {
  let files: string[];
  try {
    files = readdirSync(PLATES_DIR).filter((f) => f.endsWith('.jpg'));
  } catch {
    console.error(`No plates found under ${PLATES_DIR} — run the importer first.`);
    process.exit(1);
  }

  console.log(`Uploading ${files.length} plates (concurrency ${CONCURRENCY})…`);
  let done = 0;
  let failed = 0;
  let storeBase: string | undefined;
  const queue = [...files];

  const worker = async () => {
    while (queue.length > 0) {
      const file = queue.shift()!;
      const res = await run('vercel', [
        'blob', 'put', join('public', 'exercise-plates', file),
        '--pathname', `exercise-plates/${file}`,
        '--access', 'public',
        '--cache-control-max-age', CACHE_MAX_AGE,
        '--allow-overwrite',
        ...passthrough,
      ]);
      done += 1;
      if (!res.ok) {
        failed += 1;
        console.error(`✗ ${file}: ${res.out.trim().split('\n').slice(-2).join(' ').slice(0, 160)}`);
      } else if (!storeBase) {
        // The put prints the blob's full URL — mine the store base from it.
        const m = res.out.match(/https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com/);
        if (m) storeBase = m[0];
      }
      if (done % 100 === 0) console.log(`  ${done}/${files.length}`);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done: ${done - failed} uploaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
  if (storeBase) {
    console.log('\nNext — set this on the Vercel project (Settings → Environment Variables):');
    console.log(`  EXPO_PUBLIC_PLATE_BASE = ${storeBase}`);
  } else {
    console.log('\nNext: set EXPO_PUBLIC_PLATE_BASE to the store base URL');
    console.log('(find it in the dashboard → Storage → armandotfit-plates, or `vercel blob list`).');
  }
}

main();
