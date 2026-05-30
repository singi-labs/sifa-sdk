#!/usr/bin/env node
/**
 * Build `src/flags/data/index.json` from Twemoji's regional-indicator SVG set.
 *
 * Downloads the Twemoji source tarball (see TWEMOJI_VERSION below), filters to filenames that match
 * a regional indicator pair (`1f1XX-1f1XX.svg`), decodes each pair to its
 * ISO-3166 alpha-2 lowercase code, minifies the SVG with svgo (conservative
 * preset), and writes the result as a single JSON map `{ cc: svgString }`.
 *
 * Idempotent: rerunnable without checking temp dirs into git. The tarball is
 * extracted into the OS tmpdir and deleted on success.
 *
 * Usage: `node scripts/build-flags.mjs`
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';
import { spawnSync } from 'node:child_process';

import { optimize } from 'svgo';

// Latest stable tag at the time of writing. Twemoji's repo has not cut a v15.x
// release; v14.0.2 (2022-09) is the current GA. Bump when upstream ships a new
// tag — never point at `master`.
const TWEMOJI_VERSION = 'v14.0.2';
const TARBALL_URL = `https://github.com/twitter/twemoji/archive/refs/tags/${TWEMOJI_VERSION}.tar.gz`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const outFile = join(repoRoot, 'src', 'flags', 'data', 'index.json');

const REGIONAL_INDICATOR_PAIR = /^1f1[ef][0-9a-f]-1f1[ef][0-9a-f]\.svg$/i;
const REGIONAL_BASE = 0x1f1e6; // 'A'

function codepointToLetter(cp) {
  const offset = cp - REGIONAL_BASE;
  if (offset < 0 || offset > 25) {
    throw new Error(`codepoint ${cp.toString(16)} is outside the regional indicator block`);
  }
  return String.fromCharCode(0x41 + offset).toLowerCase();
}

function filenameToCountryCode(filename) {
  const base = filename.replace(/\.svg$/i, '');
  const [a, b] = base.split('-');
  return codepointToLetter(parseInt(a, 16)) + codepointToLetter(parseInt(b, 16));
}

const SVGO_CONFIG = {
  multipass: false,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Keep viewBox so consumers can rescale freely.
          removeViewBox: false,
        },
      },
    },
  ],
};

async function downloadTarball(url, dest) {
  console.log(`Downloading ${url} ...`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(res.body, createWriteStream(dest));
  console.log(`  -> ${dest}`);
}

function extractFlagsFromTarball(tarballPath, destDir) {
  // Use system `tar` to extract only the assets/svg directory.
  // The tarball top-level dir is `twemoji-<version-without-v>`.
  const versionNoV = TWEMOJI_VERSION.replace(/^v/, '');
  const stripDir = `twemoji-${versionNoV}/assets/svg`;

  mkdirSync(destDir, { recursive: true });
  console.log(`Extracting ${stripDir}/ from tarball ...`);
  const result = spawnSync(
    'tar',
    ['-xzf', tarballPath, '-C', destDir, '--strip-components=3', stripDir],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );
  if (result.status !== 0) {
    throw new Error(`tar extraction failed with exit code ${result.status}`);
  }
}

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), 'sifa-twemoji-'));
  const tarballPath = join(workDir, 'twemoji.tar.gz');
  const svgDir = join(workDir, 'svg');

  try {
    await downloadTarball(TARBALL_URL, tarballPath);
    extractFlagsFromTarball(tarballPath, svgDir);

    const entries = readdirSync(svgDir).filter((name) => REGIONAL_INDICATOR_PAIR.test(name));
    console.log(`Found ${entries.length} regional-indicator SVG files.`);

    /** @type {Record<string, string>} */
    const map = {};
    let totalBytes = 0;

    for (const filename of entries) {
      const cc = filenameToCountryCode(filename);
      const raw = readFileSync(join(svgDir, filename), 'utf8');
      const optimized = optimize(raw, { ...SVGO_CONFIG, path: filename });
      if ('data' in optimized) {
        map[cc] = optimized.data;
        totalBytes += optimized.data.length;
      } else {
        throw new Error(`svgo failed on ${filename}`);
      }
    }

    // Sort keys for deterministic output (important for git diffs).
    /** @type {Record<string, string>} */
    const sorted = {};
    for (const k of Object.keys(map).sort()) {
      sorted[k] = map[k];
    }

    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, JSON.stringify(sorted) + '\n');

    const kib = (totalBytes / 1024).toFixed(1);
    console.log(`Wrote ${Object.keys(sorted).length} flags to ${outFile}`);
    console.log(`Total minified SVG bytes: ${totalBytes} (${kib} KiB)`);
  } finally {
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
