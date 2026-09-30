#!/usr/bin/env node
// Adopt rpg.actor's item data into our catalog (src/rpg/catalog.ts, RPG_ITEMS).
//
// Why this exists: the catalog stays reviewed source in this repo (it feeds
// the gift records we sign and public page copy), but rpg.actor owns the item
// data. When the weekly drift check (scripts/check-rpg-catalog.mjs) fails,
// this script rewrites the catalog to match, and the change goes through a
// normal PR review.
//
// What it changes:
// - For items we already have: the item data fields (title, description,
//   kind, category, channels, assetCid, iconCid) are set to rpg.actor's
//   values. Our own fields (id, unlock, enabled) and all comments are kept.
//   Only the changed values are rewritten in place.
// - Items rpg.actor lists that we do not have are appended with
//   `enabled: false`, a placeholder unlock rule that never matches, and a
//   `// TODO: unlock rule` comment.
// - Items we have that rpg.actor does not list are left alone.
// The file is then formatted with prettier. Running it twice gives no diff.
//
// The current catalog is read from the source file itself (not from dist), so
// a stale build cannot hide an edit. The transform lives in
// src/rpg/catalog-sync.ts (unit-tested) and is loaded from dist, so the
// package script builds first.
//
// Usage:
//   RPG_ACTOR_API_KEY=... pnpm rpg:sync-catalog

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import * as prettier from 'prettier';
import ts from 'typescript';

import { fetchRpgActorCatalog, RPG_ACTOR_ITEMS_ENDPOINT } from './lib/rpg-actor-items.mjs';

const TAG = '[sync-rpg-catalog]';
const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(here, '../src/rpg/catalog.ts');
const dist = resolve(here, '../dist/rpg');

function fail(message) {
  console.error(`${TAG} ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Reading the RPG_ITEMS literal from the source

function parse(source) {
  return ts.createSourceFile(catalogPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function findItemsArray(sourceFile) {
  let found;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'RPG_ITEMS'
    ) {
      found = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!found || !ts.isArrayLiteralExpression(found)) {
    fail(
      'Could not find `export const RPG_ITEMS = [ ... ]` as a plain array literal in catalog.ts.',
    );
  }
  return found;
}

function propName(prop) {
  if (!ts.isPropertyAssignment(prop)) fail(`Unsupported syntax in RPG_ITEMS: ${prop.getText()}`);
  if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) return prop.name.text;
  fail(`Unsupported property name in RPG_ITEMS: ${prop.name.getText()}`);
}

/** Evaluate a plain data literal (strings, booleans, arrays, objects). */
function evaluate(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.map((p) => [propName(p), evaluate(p.initializer)]));
  }
  fail(`Unsupported value in RPG_ITEMS (only plain literals are allowed): ${node.getText()}`);
}

function readCatalog(source) {
  const array = findItemsArray(parse(source));
  const entries = array.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element))
      fail('Every RPG_ITEMS entry must be an object literal.');
    const props = new Map(element.properties.map((p) => [propName(p), p]));
    return { element, props, item: evaluate(element) };
  });
  return { array, entries, items: entries.map((e) => e.item) };
}

// ---------------------------------------------------------------------------
// Writing values back

function literal(value) {
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`;
  return `{ ${Object.entries(value)
    .map(([k, v]) => `${k}: ${literal(v)}`)
    .join(', ')} }`;
}

const DATA_FIELDS = ['title', 'description', 'kind', 'category', 'channels', 'assetCid', 'iconCid'];

function newEntryText(item) {
  const lines = ['{', `id: ${literal(item.id)},`];
  for (const field of DATA_FIELDS) {
    if (item[field] !== undefined) lines.push(`${field}: ${literal(item[field])},`);
  }
  lines.push('enabled: false,', '// TODO: unlock rule', `unlock: ${literal(item.unlock)},`, '},');
  return lines.join('\n');
}

function planEdits(source, catalog, result) {
  const edits = [];
  const byId = new Map(catalog.entries.map((e) => [e.item.id, e]));
  for (const change of result.changes) {
    const entry = byId.get(change.item);
    const prop = entry.props.get(change.field);
    if (change.after === undefined) {
      // Remove the property, its comma and the rest of its line.
      let end = prop.end;
      if (source[end] === ',') end++;
      while (source[end] === ' ' || source[end] === '\t') end++;
      if (source[end] === '\n') end++;
      edits.push({ start: prop.getStart(), end, text: '' });
    } else if (prop) {
      const init = prop.initializer;
      edits.push({ start: init.getStart(), end: init.end, text: literal(change.after) });
    } else {
      // Only the optional `channels` can be missing; it goes before assetCid.
      const anchor = entry.props.get('assetCid');
      const at = anchor.getStart();
      edits.push({ start: at, end: at, text: `${change.field}: ${literal(change.after)},\n` });
    }
  }
  if (result.added.length > 0) {
    const added = result.items.filter((i) => result.added.includes(i.id));
    const { array } = catalog;
    const last = array.elements.at(-1);
    let at = last ? last.end : array.elements.pos;
    let prefix = '';
    if (last) {
      if (array.elements.hasTrailingComma) at = source.indexOf(',', last.end) + 1;
      else prefix = ',';
    }
    edits.push({
      start: at,
      end: at,
      text: `${prefix}\n${added.map(newEntryText).join('\n')}\n`,
    });
  }
  return edits.sort((a, b) => b.start - a.start);
}

function apply(source, edits) {
  let out = source;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

// ---------------------------------------------------------------------------

function show(value) {
  if (value === undefined) return '(absent)';
  return Array.isArray(value) ? `[${value.join(', ')}]` : JSON.stringify(value);
}

const apiKey = process.env.RPG_ACTOR_API_KEY;
if (!apiKey) fail('RPG_ACTOR_API_KEY is not set. Export it first.');

let syncRpgCatalog;
let SIFA_RPG_PROVIDER_DID;
try {
  ({ syncRpgCatalog } = await import(pathToFileURL(resolve(dist, 'catalog-sync.js')).href));
  ({ SIFA_RPG_PROVIDER_DID } = await import(pathToFileURL(resolve(dist, 'catalog-drift.js')).href));
} catch {
  fail('dist/rpg is missing. Run `pnpm build` first (or use `pnpm rpg:sync-catalog`).');
}

let remote;
try {
  remote = await fetchRpgActorCatalog(apiKey);
} catch (err) {
  fail(err.message);
}
if (remote.provider !== SIFA_RPG_PROVIDER_DID) {
  fail(
    `${RPG_ACTOR_ITEMS_ENDPOINT} returned provider ${remote.provider}, expected ${SIFA_RPG_PROVIDER_DID}. Not syncing.`,
  );
}

const source = readFileSync(catalogPath, 'utf8');
const catalog = readCatalog(source);
const result = syncRpgCatalog(catalog.items, remote.items);

for (const s of result.skipped) {
  console.warn(
    `${TAG} Skipped ${s.item}: rpg.actor's data does not pass the schema (${s.reason}).`,
  );
}

const edits = planEdits(source, catalog, result);
if (edits.length === 0) {
  console.log(
    `${TAG} No changes: all ${catalog.items.length} catalog items match rpg.actor (${remote.items.length} items listed).`,
  );
  process.exit(0);
}

const options = { ...(await prettier.resolveConfig(catalogPath)), filepath: catalogPath };
const updated = await prettier.format(apply(source, edits), options);

// Safety net: the rewritten file must hold exactly the data the transform
// produced, or nothing is written.
const check = readCatalog(updated).items;
const sameData =
  check.length === result.items.length &&
  check.every((item, i) => {
    const want = result.items[i];
    const keys = new Set([...Object.keys(item), ...Object.keys(want)]);
    return [...keys].every((k) => isDeepStrictEqual(item[k], want[k]));
  });
if (!sameData) fail('The rewritten catalog does not match the expected data. Nothing was written.');
writeFileSync(catalogPath, updated);

console.log(`${TAG} Updated src/rpg/catalog.ts:`);
for (const c of result.changes) {
  console.log(`  ${c.item}.${c.field}: ${show(c.before)} -> ${show(c.after)}`);
}
for (const id of result.added) {
  console.log(`  ${id}: added (enabled: false, placeholder unlock rule; write the real rule)`);
}
for (const { item, iconCid } of result.iconUpdates) {
  console.log(
    `${TAG} Reminder: copy the icon to sifa-web public/rpg/items/${iconCid}.png (fetch it from GET /api/creator/items/${item})`,
  );
}
console.log(`${TAG} Review the diff, run the tests, and commit.`);
