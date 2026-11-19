// Vice Coast Cover Studio — the entry program for gta6-cover-art-01.
// It hands the app in: copies this repo's app/ and screenshots/ into the
// output directory and writes dossier.json there, using the vendored make.fun
// library to build the dossier. No network, no build step, Node 22 stdlib.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  // Fail loudly instead of handing in a half-empty output directory.
  if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
    throw new Error('app/index.html is missing — nothing to hand in');
  }
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

  const shotsDir = join(outputDir, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });
  const repoShots = join(repoRoot, 'screenshots');
  if (existsSync(repoShots)) {
    cpSync(repoShots, shotsDir, { recursive: true });
  }

  // The scorer's caps: text and screenshot budgets, and the app size caps.
  // An entry over any of them is refused, so the dossier is built with the
  // same limits the scorer enforces.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
