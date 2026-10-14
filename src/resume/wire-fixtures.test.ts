/**
 * The resume emitters run against anonymized real API responses
 * (`src/__fixtures__/wire`), not hand-written objects. Hand-written fixtures
 * hid three bugs that only real data showed: an empty JSON Resume location
 * (the API sends a string plus `locations[]`), lists in storage order, and
 * linked-account networks the Typst template could not draw.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { Profile } from '../types/index.js';
import { defaultFunderCvSelection, profileToFunderCv } from './funder-cv.js';
import { profileToJsonResume } from './json-resume.js';

const FIXTURES = join(import.meta.dirname, '..', '__fixtures__');
const WIRE = join(FIXTURES, 'wire');
const profiles = readdirSync(WIRE)
  .filter((f) => f.endsWith('.json'))
  .map((f) => [f, JSON.parse(readFileSync(join(WIRE, f), 'utf8')) as Profile] as const);

interface SchemaNode {
  type?: string | string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
}
const schema = JSON.parse(
  readFileSync(join(FIXTURES, 'jsonresume-schema.json'), 'utf8'),
) as SchemaNode;

/**
 * Keys the schema does not declare, at any depth. altacv's importer rejects
 * these even where the schema itself allows extra properties.
 */
function undeclaredKeys(value: unknown, node: SchemaNode | undefined, path: string): string[] {
  if (!node) return [];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => undeclaredKeys(v, node.items, `${path}[${i}]`));
  }
  if (value && typeof value === 'object' && node.properties) {
    return Object.entries(value).flatMap(([k, v]) =>
      k in node.properties!
        ? undeclaredKeys(v, node.properties![k], `${path}.${k}`)
        : [`${path}.${k}`],
    );
  }
  return [];
}

const contact = {
  email: 'a@example.com',
  phone: '+31 6 0000 0000',
  address: 'Street 1\nCity',
  driversLicense: 'B',
  rightToWork: 'EU citizen',
  nationality: 'Dutch',
};

describe.each(profiles)('wire fixture %s', (_name, profile) => {
  const resume = profileToJsonResume(profile, { contact });

  it('emits only keys the JSON Resume schema declares', () => {
    expect(undeclaredKeys(resume, schema, '$')).toEqual([]);
  });

  it('maps the location the API sends', () => {
    expect(resume.basics?.location?.city).toBeTruthy();
  });

  // The profile page's order: current roles first, then by end date, newest
  // first. Storage order would put a 2006 role above a 1995 to 2004 one.
  it('lists work in the profile page order, by end date', () => {
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
    expect(erc.person).toMatchObject({ email: contact.email, nationality: contact.nationality });
    expect(nih.person).not.toHaveProperty('email');
  });
});
