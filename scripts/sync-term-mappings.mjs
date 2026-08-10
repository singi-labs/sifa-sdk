#!/usr/bin/env node
// Sync src/jsonld/term-mappings.json from the canonical copy in sifa-lexicons.
//
// Why this exists: the lexicons own these facts. The `x-skos:*` annotations
// are published to the authority PDS, so a third party resolving `id.sifa.*`
// already reads them; that makes sifa-lexicons the source of truth and this
// file a derived copy.
//
// It is a committed copy rather than a dependency because sifa-lexicons
// publishes to GitHub Packages (private registry) while this SDK publishes to
// public npm, so it cannot be depended on at runtime.
//
// Note the direction: term mappings flow lexicons -> SDK because the x-skos:*
// annotations are published to the authority PDS as part of the lexicon
// records. The activity taxonomy flows the other way (this SDK owns it),
// because it is editorial rendering policy and never reaches a PDS.
//
// Drift is caught by .github/workflows/term-mappings-drift.yml, which runs
// this script against a fresh checkout of sifa-lexicons and fails if the
// result differs from what is committed here.
//
// Usage:
//   node scripts/sync-term-mappings.mjs
//   node scripts/sync-term-mappings.mjs --source /path/to/term-mappings.json
//   node scripts/sync-term-mappings.mjs --check    # exit 1 if out of date

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const defaultSource = resolve(repoRoot, '../sifa-lexicons/well-known/term-mappings.json');
const target = resolve(repoRoot, 'src/jsonld/term-mappings.json');

const argIdx = process.argv.indexOf('--source');
const source = argIdx >= 0 ? resolve(process.argv[argIdx + 1]) : defaultSource;
const checkOnly = process.argv.includes('--check');

let raw;
try {
  raw = readFileSync(source, 'utf-8');
} catch (err) {
  console.error(`[sync-term-mappings] Cannot read source: ${source}`);
  console.error(`[sync-term-mappings] ${err.message}`);
  console.error(
    '[sync-term-mappings] Pass --source <path> if sifa-lexicons is checked out elsewhere.',
  );
  process.exit(1);
}

const parsed = JSON.parse(raw);
const shapeOk =
  typeof parsed.version === 'string' &&
  parsed.vocabularies &&
  typeof parsed.vocabularies === 'object' &&
  Array.isArray(parsed.mappings) &&
  Array.isArray(parsed.unmapped) &&
  parsed.mappings.length > 0;

if (!shapeOk) {
  console.error('[sync-term-mappings] Source JSON failed shape sanity check.');
  process.exit(1);
}

if (checkOnly) {
  let current = '';
  try {
    current = readFileSync(target, 'utf-8');
  } catch {
    // Missing target counts as out of date.
  }
  if (current !== raw) {
    console.error('[sync-term-mappings] src/jsonld/term-mappings.json is out of date.');
    console.error('[sync-term-mappings] Run: node scripts/sync-term-mappings.mjs');
    process.exit(1);
  }
  console.log('[sync-term-mappings] Up to date.');
  process.exit(0);
}

writeFileSync(target, raw);
console.log(
  `[sync-term-mappings] Wrote ${parsed.mappings.length} mappings + ${parsed.unmapped.length} unmapped to ${target}`,
);
