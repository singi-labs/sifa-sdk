#!/usr/bin/env node
// Idempotent npm publish for the sifa-sdk single-package release.
//
// Why this exists instead of `changeset publish`:
// `changeset publish` detects pnpm as the package manager (from pnpm-lock.yaml)
// and spawns `pnpm publish`, which wraps `npm publish` but injects NPM_CONFIG_*
// env vars that prevent npm 11.6+ from engaging OIDC trusted publishing —
// every CI run failed with ENEEDAUTH and no `Signed provenance statement`
// line. Calling `npm publish` directly (no pnpm in the chain) preserves the
// OIDC env (`ACTIONS_ID_TOKEN_REQUEST_URL`/`_TOKEN`) and lets npm sign
// provenance and authenticate via the configured Trusted Publisher.
//
// See: https://github.com/singi-labs/sifa-sdk/issues/68

import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const pkgPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
const { name, version } = JSON.parse(readFileSync(pkgPath, 'utf8'));

let published = '';
try {
  published = execFileSync('npm', ['view', name, 'version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // Package may not exist on the registry yet — treat as unpublished.
}

if (published === version) {
  console.log(`${name}@${version} is already on the registry, nothing to do`);
  process.exit(0);
}

console.log(`Publishing ${name}@${version} (registry currently at: ${published || 'none'})`);

// --ignore-scripts: `npm publish` would otherwise run the package's `prepare`
// script (= `husky`), which isn't on PATH inside npm's publish lifecycle env
// when the install happened via pnpm. The dist artifact is already built by
// the workflow's `pnpm build` step, so no further publish-time scripts are
// needed.
const result = spawnSync(
  'npm',
  ['publish', '--access', 'public', '--provenance', '--ignore-scripts'],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// Create the local git tag that `changeset publish` would have created.
// changesets/action reads our `New tag:` line below, then pushes
// `v<version>` to origin (single-package non-monorepo format) and creates
// a GitHub release for it. The push fails if the tag doesn't exist
// locally, so create it here. Non-fatal if it already exists (re-runs).
const tagResult = spawnSync('git', ['tag', `v${version}`], { stdio: 'inherit' });
if (tagResult.status !== 0) {
  console.log(`Note: git tag v${version} could not be created (already exists?)`);
}

// Emit the line changesets/action looks for so its `publishedPackages`
// output is populated for any downstream consumers.
console.log(`New tag: ${name}@${version}`);
