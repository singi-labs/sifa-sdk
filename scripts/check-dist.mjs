// Verifies the built package after `pnpm build`:
//  1. every subpath export resolves for ESM and CJS, and its type file exists;
//  2. the ESM build keeps one file per source module, so bundlers can drop the
//     modules a consumer does not import (the `sideEffects` hint works per file).
//     A flattened ESM entry ships every zod schema to every consumer.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8'));
const failures = [];

for (const [subpath, target] of Object.entries(pkg.exports)) {
  if (typeof target === 'string' || !target.import) continue;
  for (const file of [
    target.import.types,
    target.import.default,
    target.require.types,
    target.require.default,
  ]) {
    if (!existsSync(path.join(root, file))) failures.push(`${subpath}: missing ${file}`);
  }
  try {
    const esm = await import(pathToFileURL(path.join(root, target.import.default)).href);
    const cjs = require(path.join(root, target.require.default));
    const esmKeys = Object.keys(esm).sort().join();
    const cjsKeys = Object.keys(cjs).sort().join();
    if (esmKeys !== cjsKeys) failures.push(`${subpath}: ESM and CJS export different names`);
  } catch (error) {
    failures.push(`${subpath}: failed to load (${error.message})`);
  }
}

// The main ESM entry must re-export from per-module files, not inline them.
const mainEsm = readFileSync(path.join(root, 'dist/index.js'), 'utf-8');
if (/\bz\.object\(/.test(mainEsm)) {
  failures.push('dist/index.js inlines zod schemas; the ESM build must keep one file per module');
}
for (const file of ['dist/schemas/profile-position.js', 'dist/format/index.js']) {
  if (!existsSync(path.join(root, file))) failures.push(`missing per-module ESM file ${file}`);
}

if (failures.length > 0) {
  console.error(`check-dist failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`check-dist ok (${Object.keys(pkg.exports).length} exports)`);
