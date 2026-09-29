#!/usr/bin/env node
// Compare our rpg.actor item catalog (src/rpg/catalog.ts, RPG_ITEMS) with the
// catalog rpg.actor serves for the sifa.id provider.
//
// Why this exists: the ids, titles, kinds, categories and image CIDs in
// RPG_ITEMS are copied from rpg.actor's item cores. If rpg.actor re-uploads an
// asset or renames an item, our copy goes stale silently and gifts point at
// the wrong thing. This fails loudly instead.
//
// Descriptions and context are NOT compared: they are flavor text that may be
// reworded on either side without affecting gifts.
// Items rpg.actor lists that we do not have are reported as a notice only.
//
// Reads the built SDK (dist/rpg), so run `pnpm build` first. The comparison
// itself lives in src/rpg/catalog-drift.ts (unit-tested, not exported from
// any public entry).
//
// Run by .github/workflows/rpg-catalog-drift.yml (weekly + on demand).
//
// Usage:
//   RPG_ACTOR_API_KEY=... node scripts/check-rpg-catalog.mjs

import { appendFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TAG = '[check-rpg-catalog]';
const ENDPOINT = 'https://rpg.actor/api/creator/items';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../dist/rpg');

function fail(message) {
  console.error(`${TAG} ${message}`);
  writeSummary(`## rpg.actor item catalog drift\n\n**Check failed:** ${message}\n`);
  process.exit(1);
}

function writeSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

async function fetchRemoteCatalog(apiKey) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    fail(
      `Request to ${ENDPOINT} failed (${err.message}). This may be a transient network error; re-run the workflow to confirm.`,
    );
  }
  if (res.status !== 200) {
    fail(
      `${ENDPOINT} returned HTTP ${res.status}. A 401/403 means the RPG_ACTOR_API_KEY secret is wrong or revoked; a 5xx may be transient, re-run to confirm.`,
    );
  }
  const body = await res.json();
  if (!body || typeof body.provider !== 'string' || !Array.isArray(body.items)) {
    fail(`${ENDPOINT} returned an unexpected shape (expected { provider, count, items[] }).`);
  }
  return body;
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

const remote = await fetchRemoteCatalog(apiKey);
const result = compareRpgCatalog(RPG_ITEMS, remote);

const enabled = RPG_ITEMS.filter((i) => i.enabled).length;
console.log(`${TAG} Ours: ${enabled} enabled items. rpg.actor: ${remote.items.length} items.`);
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
writeSummary(renderRpgCatalogDriftMarkdown(result));

if (!result.ok) {
  console.error(`${TAG} Drift found. Update src/rpg/catalog.ts to match rpg.actor.`);
  process.exit(1);
}
console.log(`${TAG} No drift.`);
