// scripts/upload-plates.ts
// Upload the exercise plates to the Vercel Blob store — the one-time
// (or rare, post-regeneration) act that takes 61 MB out of every
// deployment. Requires the vercel CLI, linked to the project
// (`vercel link`) or an explicit --rw-token/--store-id pass-through.
//
// Run: bun run plates:upload [-- <vercel-blob-put flags>]
//
// The store's base URL (https://<store-hash>.public.blob.vercel-storage.com)
// then goes into EXPO_PUBLIC_PLATE_BASE on the Vercel project — see
// shared/exercises/plateUrl.ts.

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const PLATES_DIR = join(import.meta.dir, '..', 'public', 'exercise-plates');
const CACHE = 'public, max-age=31536000, immutable';
const CONCURRENCY = 8;

const passthrough = process.argv.slice(2);

function run(cmd: string, args: string[]): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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
    statSync(join(PLATES_DIR, files[0]));
  } catch {
    console.error(`No plates found under ${PLATES_DIR} — run the importer first.`);
    process.exit(1);
  }

  console.log(`Uploading ${files.length} plates (concurrency ${CONCURRENCY})…`);
  let done = 0;
  let failed = 0;
  const queue = [...files];

  const worker = async () => {
    while (queue.length > 0) {
      const file = queue.shift()!;
      const res = await run('vercel', [
        'blob', 'put', join('public', 'exercise-plates', file),
        '--pathname', `exercise-plates/${file}`,
        '--access', 'public',
        '--cache-control', CACHE,
        ...passthrough,
      ]);
      done += 1;
      if (!res.ok) {
        failed += 1;
        console.error(`✗ ${file}: ${res.out.trim().slice(0, 160)}`);
      }
      if (done % 100 === 0) console.log(`  ${done}/${files.length}`);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done: ${done - failed} uploaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
  console.log('\nNext: set EXPO_PUBLIC_PLATE_BASE on the Vercel project to the');
  console.log("store's base URL (https://<store-hash>.public.blob.vercel-storage.com).");
}

main();
