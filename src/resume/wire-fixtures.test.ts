/**
 * The resume emitters run against anonymized real API responses
 * (`src/testing/wire`, exported as `WIRE_PROFILES`), not hand-written objects. Hand-written fixtures
 * hid three bugs that only real data showed: an empty JSON Resume location
 * (the API sends a string plus `locations[]`), lists in storage order, and
 * linked-account networks the Typst template could not draw.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { sortPositions } from '../profile/section-sorts.js';
import { SAMPLE_EXPORT_CONTACT as contact, WIRE_PROFILES } from '../testing/index.js';
import { defaultFunderCvSelection, profileToFunderCv } from './funder-cv.js';
import { profileToJsonResume } from './json-resume.js';

const FIXTURES = join(import.meta.dirname, '..', '__fixtures__');
const profiles = WIRE_PROFILES.map((w) => [w.name, w.profile] as const);

interface SchemaNode {
  type?: string | string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
}
const schema = JSON.parse(
  readFileSync(join(FIXTURES, 'jsonresume-schema.json'), 'utf8'),
) as SchemaNode;
// altacv's importer adds `type` to publications (it groups them by it), so it
// accepts that key even though the JSON Resume schema does not declare it.
const publicationProps = schema.properties?.publications?.items?.properties;
if (publicationProps) publicationProps.type = { type: 'string' };

/**
 * Keys the schema does not declare, at any depth. Deliberately stricter than
 * the schema: it ignores `additionalProperties`, because altacv's importer
 * rejects undeclared keys even where the schema allows extra properties
 * (it refused `basics.nationality`, which the schema permits).
 */
function undeclaredKeys(value: unknown, node: SchemaNode | undefined, path: string): string[] {
  if (!node) return [];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => undeclaredKeys(v, node.items, `${path}[${i}]`));
  }
  if (value && typeof value === 'object' && node.properties) {
    const props = node.properties;
    return Object.entries(value).flatMap(([k, v]) =>
      Object.hasOwn(props, k) ? undeclaredKeys(v, props[k], `${path}.${k}`) : [`${path}.${k}`],
    );
  }
  return [];
}

describe.each(profiles)('wire fixture %s', (_name, profile) => {
  const resume = profileToJsonResume(profile, { contact });

  it('emits only keys the JSON Resume schema declares', () => {
    expect(undeclaredKeys(resume, schema, '$')).toEqual([]);
  });

  // altacv checks the `uri` format; one bad link fails the whole PDF.
  it('emits only valid URIs in link fields', () => {
    const links: string[] = [];
    const collect = (v: unknown, k = ''): void => {
      if (Array.isArray(v)) v.forEach((x) => collect(x, k));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, x]) => collect(x, kk));
      else if (typeof v === 'string' && /^(url|canonical|image)$/.test(k)) links.push(v);
    };
    collect(resume);
    // URL.canParse accepts inner spaces (it encodes them); altacv does not.
    expect(links.filter((l) => !URL.canParse(l) || /\s/.test(l))).toEqual([]);
  });

  it('maps the location the API sends', () => {
    expect(resume.basics?.location?.city).toBeTruthy();
  });

  // The profile page's order: current roles first, then by end date, newest
  // first. Storage order would put a 2006 role above a 1995 to 2004 one.
  // The profile page's order (current first, then by end date), from the same
  // shared sort; storage order would put a 2006 role above a 1995 to 2004 one.
  it('lists work in the profile page order', () => {
    const expected = sortPositions((profile.positions ?? []).filter((p) => !p.hidden)).map(
      (p) => p.startedAt,
    );
    expect((resume.work ?? []).map((w) => w.startDate)).toEqual(expected);
    const ends = (resume.work ?? []).map((w) => w.endDate ?? '9999');
    expect(ends).toEqual([...ends].sort().reverse());
  });

  it('leaves hidden records out', () => {
    const visible = (profile.positions ?? []).filter((p) => !p.hidden);
    expect(resume.work ?? []).toHaveLength(visible.length);
  });

  it('keeps every linked account, whatever the network', () => {
    const visible = (profile.externalAccounts ?? []).filter((a) => !a.hidden);
    expect(resume.basics?.profiles ?? []).toHaveLength(visible.length);
  });

  it('builds both funder CVs, contact details on ERC only', () => {
    const erc = profileToFunderCv(profile, defaultFunderCvSelection(profile, 'erc'), { contact });
    const nih = profileToFunderCv(profile, defaultFunderCvSelection(profile, 'nih'), { contact });
    expect(erc.person).toMatchObject({ ...contact, address: 'Street 1\nCity' });
    for (const key of Object.keys(contact)) expect(nih.person).not.toHaveProperty(key);
  });
});
