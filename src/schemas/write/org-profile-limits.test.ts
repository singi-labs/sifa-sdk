import { describe, expect, it } from 'vitest';

import {
  OrgClaimRequestSchema,
  OrgProfileUpdateRequestSchema,
  OrgProfileWriteSchema,
  orgFoundedSchema,
} from './index.js';

const BASE = { name: 'Acme', createdAt: '2024-01-01' };

function ok(payload: Record<string, unknown>) {
  return OrgProfileWriteSchema.safeParse({ ...BASE, ...payload }).success;
}

// sifa-workspace#726: the id.sifa.org.profile lexicon caps these in graphemes.
describe('OrgProfileWriteSchema lexicon grapheme limits', () => {
  it('caps the name at 200 graphemes', () => {
    expect(ok({ name: 'n'.repeat(200) })).toBe(true);
    expect(ok({ name: 'n'.repeat(201) })).toBe(false);
  });

  it('caps the description at 5,000 graphemes', () => {
    expect(ok({ description: 'd'.repeat(5000) })).toBe(true);
    expect(ok({ description: 'd'.repeat(5001) })).toBe(false);
  });

  it('caps each alias at 200 graphemes, counting an emoji as one', () => {
    expect(ok({ aliases: ['👍'.repeat(200)] })).toBe(true);
    expect(ok({ aliases: ['a'.repeat(201)] })).toBe(false);
  });

  it('stays lexicon-only: a record with an odd founded value is not rejected', () => {
    expect(ok({ founded: 'circa 1998' })).toBe(true);
  });
});

describe('orgFoundedSchema', () => {
  it('accepts a year, a month or a real date', () => {
    for (const v of ['1998', '1998-03', '1998-03-15', '2000-02-29']) {
      expect(orgFoundedSchema.safeParse(v).success).toBe(true);
    }
  });

  it('rejects other shapes and impossible months or days', () => {
    for (const v of ['abc', '1998-1998', '19', '1998/03', '1998-3', '1998-13', '1998-02-30']) {
      expect(orgFoundedSchema.safeParse(v).success).toBe(false);
    }
  });
});

describe('org request bodies share the limits', () => {
  const UPDATE = { name: 'Acme', entityRefs: ['https://wikidata.org/wiki/Q1'] };
  const CLAIM = { ...UPDATE, authorityAck: true as const };

  it('the profile update body applies the grapheme caps and the founded rule', () => {
    const parse = (p: Record<string, unknown>) =>
      OrgProfileUpdateRequestSchema.safeParse({ ...UPDATE, ...p }).success;
    expect(parse({ name: 'n'.repeat(201) })).toBe(false);
    expect(parse({ founded: 'abc' })).toBe(false);
    expect(parse({ aliases: [''] })).toBe(false);
    expect(parse({ founded: '1998-03', aliases: ['👍'.repeat(200)] })).toBe(true);
  });

  it('the claim body applies the same rules', () => {
    const parse = (p: Record<string, unknown>) =>
      OrgClaimRequestSchema.safeParse({ ...CLAIM, ...p }).success;
    expect(parse({ description: 'd'.repeat(5001) })).toBe(false);
    expect(parse({ founded: '1998-13' })).toBe(false);
    expect(parse({ founded: '1998', aliases: ['ACME'] })).toBe(true);
  });
});
