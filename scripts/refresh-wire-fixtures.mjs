#!/usr/bin/env node
/**
 * Refresh the wire fixtures: real profile responses from the public Sifa API,
 * anonymized, so tests run against the shape the API really sends (a display
 * string in `location` plus `locations[]`, linked accounts on many platforms,
 * records in storage order) rather than hand-written objects.
 *
 * The repository is public, so no real profile text is stored. What stays:
 * structure, dates, booleans, numbers, platform and type names. What goes:
 * every other string (replaced with a placeholder), and identities, URLs and
 * locations (replaced with fixed fake values).
 *
 *   node scripts/refresh-wire-fixtures.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.SIFA_API_URL ?? 'https://sifa.id/api';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', '__fixtures__', 'wire');

/** Public profiles to sample, by fixture name. Add handles with varied data. */
const PROFILES = {
  // Linked accounts on activitypub and tangled, a long career, a string location.
  'profile-a': 'gui.do',
};

/** Keys whose string values carry structure, not personal text. */
const KEEP = new Set([
  'platform',
  'type',
  'kind',
  'proficiency',
  'countryCode',
  'category',
  'id',
  'source',
  'verifiedVia',
  'language',
  'rkey',
  'industry',
]);
const DATE_KEY = /(At|Date|date|Utc)$/;
const FAKE_LOCATION = {
  location: 'Utrecht, Utrecht, Netherlands',
  locationCity: 'Utrecht',
  locationLocality: 'Utrecht',
  locationRegion: 'Utrecht',
  locationCountry: 'Netherlands',
};
// ORCID's documented example iD, so ORCID parsing still has something real.
const ORCID_EXAMPLE = 'https://orcid.org/0000-0002-1825-0097';

let counter = 0;

function anonymize(value, key, parent) {
  if (Array.isArray(value)) return value.map((v) => anonymize(v, key, value));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, anonymize(v, k, value)]));
  }
  if (typeof value !== 'string' || value === '') return value;
  if (KEEP.has(key) || DATE_KEY.test(key)) return value;
  if (key in FAKE_LOCATION) return FAKE_LOCATION[key];
  if (key === 'did' || key.endsWith('Did') || value.startsWith('did:'))
    return 'did:plc:wirefixture';
  if (key === 'handle') return 'wire.example';
  if (key === 'langs') return value;
  if (/url$/i.test(key) || key === 'avatar' || key === 'website' || /^https?:\/\//.test(value)) {
    if (parent && !Array.isArray(parent) && parent.platform === 'orcid') return ORCID_EXAMPLE;
    counter += 1;
    return `https://example.com/${key}/${counter}`;
  }
  counter += 1;
  return `${key} ${counter}`;
}

await mkdir(OUT, { recursive: true });
for (const [name, handle] of Object.entries(PROFILES)) {
  counter = 0;
  const res = await fetch(`${API}/profile/${encodeURIComponent(handle)}`);
  if (!res.ok) throw new Error(`${handle}: HTTP ${res.status}`);
  const profile = anonymize(await res.json(), '', null);
  await writeFile(join(OUT, `${name}.json`), `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`wrote ${name}.json`);
}
