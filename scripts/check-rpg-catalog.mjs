#!/usr/bin/env node
// Compare our rpg.actor item catalog (src/rpg/catalog.ts, RPG_ITEMS) with the
// catalog rpg.actor serves for the sifa.id provider.
//
// Why this exists: the item data in RPG_ITEMS (title, description, kind,
// category, channels, asset and icon CIDs) is copied from rpg.actor's item
// cores. We keep it as reviewed source because it feeds the gift records we
// sign and public page copy. If rpg.actor re-uploads an asset or rewords an
// item, our copy goes stale silently. This fails loudly instead, with a
// before/after table per item; `pnpm rpg:sync-catalog` adopts the changes.
//
// Every data field is compared, for every catalog item rpg.actor lists,
// disabled ones included. rpg.actor's `context` is not stored, so not compared.
// Notices only (no failure): items rpg.actor lists that we do not have, and
// disabled items of ours that rpg.actor does not list.
//
// Reads the built SDK (dist/rpg), so run `pnpm build` first. The comparison
// itself lives in src/rpg/catalog-drift.ts (unit-tested, not exported from
// any public entry).
//
// Run by .github/workflows/rpg-catalog-drift.yml (weekly + on demand).
//
// Usage:
//   RPG_ACTOR_API_KEY=... node scripts/check-rpg-catalog.mjs

import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { fetchRpgActorCatalog } from './lib/rpg-actor-items.mjs';

const TAG = '[check-rpg-catalog]';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../dist/rpg');

function fail(message) {
  const markdown = `## rpg.actor item catalog drift\n\n**Check failed:** ${message}\n`;
  console.error(`${TAG} ${message}`);
  writeSummary(markdown);
  if (process.env.RPG_DRIFT_REPORT) writeFileSync(process.env.RPG_DRIFT_REPORT, markdown);
  process.exit(1);
}

function writeSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

const apiKey = process.env.RPG_ACTOR_API_KEY;
if (!apiKey) {
  fail(
    'RPG_ACTOR_API_KEY is not set. In CI, add it as a repository secret; locally, export it first.',
  );
}
if (!existsSync(resolve(dist, 'catalog.js')) || !existsSync(resolve(dist, 'catalog-drift.js'))) {
  fail('dist/rpg is missing. Run `pnpm build` first.');
}

const { RPG_ITEMS } = await import(pathToFileURL(resolve(dist, 'catalog.js')).href);
const { compareRpgCatalog, renderRpgCatalogDriftMarkdown } = await import(
  pathToFileURL(resolve(dist, 'catalog-drift.js')).href
);

let remote;
try {
  remote = await fetchRpgActorCatalog(apiKey);
} catch (err) {
  fail(err.message);
}
const result = compareRpgCatalog(RPG_ITEMS, remote);

const enabled = RPG_ITEMS.filter((i) => i.enabled).length;
console.log(
  `${TAG} Ours: ${RPG_ITEMS.length} items (${enabled} enabled). rpg.actor: ${remote.items.length} items.`,
);
if (result.providerMismatch) {
  console.error(
    `${TAG} Provider mismatch: expected ${result.providerMismatch.expected}, got ${result.providerMismatch.actual}`,
  );
}
if (result.mismatches.length > 0) {
  console.error(`${TAG} Mismatches:`);
  console.table(result.mismatches);
}
if (result.extra.length > 0) {
  console.log(`${TAG} Notice: rpg.actor lists items we do not have: ${result.extra.join(', ')}`);
}
if (result.missingDisabled.length > 0) {
  console.log(
    `${TAG} Notice: rpg.actor does not list these disabled items: ${result.missingDisabled.join(', ')}`,
  );
}
const markdown = renderRpgCatalogDriftMarkdown(result);
writeSummary(markdown);
// The workflow puts this report in the drift issue.
if (process.env.RPG_DRIFT_REPORT) writeFileSync(process.env.RPG_DRIFT_REPORT, markdown);

if (!result.ok) {
  console.error(
    `${TAG} Drift found. Run \`pnpm rpg:sync-catalog\` to adopt rpg.actor's values, then review and commit.`,
  );
  process.exit(1);
}
console.log(`${TAG} No drift.`);
