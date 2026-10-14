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
 *   pnpm fixtures:wire   (runs this script, then Prettier on the output)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = new URL(process.env.SIFA_API_URL ?? 'https://sifa.id/api').href.replace(/\/$/, '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', '__fixtures__', 'wire');

/**
 * Public profiles to sample, by fixture name. The API sends the same shape for
 * every profile; add handles for different data (other platforms, sparse or
 * academic profiles), not for a different shape.
 */
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
  'category',
  'id',
  'source',
  'verifiedVia',
  'language',
  'rkey',
  'industry',
  'langs',
]);
const DATE_KEY = /(At|Date|date|Utc)$/;
const TOKEN = /^[\w#.:+-]+( [\w#.:+-]+)?$/;
const FAKE_LOCATION = {
  location: 'Utrecht, Utrecht, Netherlands',
  locationCity: 'Utrecht',
  locationLocality: 'Utrecht',
  locationRegion: 'Utrecht',
  locationCountry: 'Netherlands',
  // Talk and position countries together with the dates would narrow down who
  // the profile belongs to.
  countryCode: 'NL',
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
  // Links first (a link can hold a DID, as tangled.org ones do), then
  // identities, so neither survives under a kept key.
  if (/url$/i.test(key) || key === 'avatar' || key === 'website' || /^https?:\/\//.test(value)) {
    if (parent && !Array.isArray(parent) && parent.platform === 'orcid') return ORCID_EXAMPLE;
    counter += 1;
    return `https://example.com/${key}/${counter}`;
  }
  if (key === 'did' || key.endsWith('Did') || value.includes('did:')) return 'did:plc:wirefixture';
  if (key === 'handle') return 'wire.example';
  if (Object.hasOwn(FAKE_LOCATION, key)) return FAKE_LOCATION[key];
  // A kept key keeps its value only when it looks like a token (an enum, a
  // date, a code), so no free text survives under a kept key.
  if ((KEEP.has(key) || DATE_KEY.test(key)) && TOKEN.test(value)) return value;
  counter += 1;
  return `${key} ${counter}`;
}

/**
 * Refuse to write a fixture that still holds the original identity or any real
 * link. The repository is public.
 */
function assertNoLeaks(original, profile, name) {
  const text = JSON.stringify(profile);
  const identity = [
    original.handle,
    original.did,
    original.displayName,
    original.givenName,
    original.familyName,
  ].filter((v) => typeof v === 'string' && v.length > 2);
  for (const value of identity) {
    if (text.includes(value))
      throw new Error(`${name}: anonymized fixture still contains "${value}"`);
  }
  const links = text.match(/https?:\/\/[^"\s]+/g) ?? [];
  const real = links.filter((l) => !l.startsWith('https://example.com/') && l !== ORCID_EXAMPLE);
  if (real.length > 0) throw new Error(`${name}: anonymized fixture still contains ${real[0]}`);
  if (/did:(?!plc:wirefixture)/.test(text))
    throw new Error(`${name}: anonymized fixture still contains a DID`);
}

await mkdir(OUT, { recursive: true });
for (const [name, handle] of Object.entries(PROFILES)) {
  counter = 0;
  const res = await fetch(`${API}/profile/${encodeURIComponent(handle)}`);
  if (!res.ok) throw new Error(`${handle}: HTTP ${res.status}`);
  const original = await res.json();
  const profile = anonymize(original, '', null);
  assertNoLeaks(original, profile, name);
  await writeFile(join(OUT, `${name}.json`), `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`wrote ${name}.json`);
}
