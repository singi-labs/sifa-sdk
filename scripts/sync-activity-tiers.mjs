#!/usr/bin/env node
// Sync src/taxonomy/activity-tiers.json from the canonical copy in sifa-lexicons.
//
// Why this exists: sifa-lexicons publishes to GitHub Packages (private registry)
// and its package `exports` field does not expose the well-known JSON, so this
// SDK (published to public npm) cannot depend on it at runtime. The JSON is
// committed here and refreshed manually when the taxonomy changes upstream.
//
// Usage:
//   node scripts/sync-activity-tiers.mjs
//   node scripts/sync-activity-tiers.mjs --source /custom/path/activity-tiers.json
//
// Exits non-zero on missing source or if the JSON fails a shape sanity check.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const defaultSource = resolve(repoRoot, '../sifa-lexicons/well-known/activity-tiers.json');
const target = resolve(repoRoot, 'src/taxonomy/activity-tiers.json');

const argIdx = process.argv.indexOf('--source');
const source = argIdx >= 0 ? resolve(process.argv[argIdx + 1]) : defaultSource;

let raw;
try {
  raw = readFileSync(source, 'utf-8');
} catch (err) {
  console.error(`[sync-activity-tiers] Cannot read source: ${source}`);
  console.error(`[sync-activity-tiers] ${err.message}`);
  console.error(
    '[sync-activity-tiers] Pass --source <path> if sifa-lexicons is checked out elsewhere.',
  );
  process.exit(1);
}

const parsed = JSON.parse(raw);
if (
  typeof parsed.version !== 'string' ||
  typeof parsed.updated !== 'string' ||
  typeof parsed.tiers !== 'object' ||
  typeof parsed.lexicons !== 'object'
) {
  console.error('[sync-activity-tiers] Source JSON failed shape sanity check.');
  process.exit(1);
}

writeFileSync(target, raw);
console.log(`[sync-activity-tiers] Wrote ${target}`);
console.log(
  `[sync-activity-tiers] version=${parsed.version} updated=${parsed.updated} entries=${Object.keys(parsed.lexicons).length}`,
);
