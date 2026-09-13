import { describe, expect, it } from 'vitest';

import { OrgProfileRecordSchema } from './org-profile.js';

describe('OrgProfileRecordSchema', () => {
  it('accepts a minimal record (name + createdAt)', () => {
    expect(
      OrgProfileRecordSchema.safeParse({ name: 'Acme', createdAt: '2026-07-16T00:00:00.000Z' })
        .success,
    ).toBe(true);
  });

  it('accepts a full record', () => {
    const result = OrgProfileRecordSchema.safeParse({
      name: 'Acme Corporation',
      description: 'We make everything.',
      logo: { $type: 'blob', ref: { $link: 'bafy' }, mimeType: 'image/png', size: 1000 },
      website: 'https://acme.com',
      entityRefs: ['http://www.wikidata.org/entity/Q123', 'https://ror.org/abc'],
      contact: 'ir@acme.com',
      addresses: [{ street: '1 Main St', locality: 'Springfield', country: 'US' }],
      companySize: '51-200',
      links: [{ name: 'Careers', url: 'https://acme.com/jobs' }],
      createdAt: '2026-07-16T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an address with only some fields (all optional)', () => {
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        addresses: [{ country: 'NL' }, {}],
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('caps addresses at 10', () => {
    const addresses = Array.from({ length: 11 }, () => ({ country: 'US' }));
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        addresses,
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('accepts any companySize string (open knownValues)', () => {
    for (const size of ['1-10', '10001+', 'some-future-range']) {
      expect(
        OrgProfileRecordSchema.safeParse({
          name: 'Acme',
          companySize: size,
          createdAt: '2026-07-16T00:00:00.000Z',
        }).success,
      ).toBe(true);
    }
  });

  it('requires both name and url on a link', () => {
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        links: [{ name: 'Careers' }],
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        links: [{ url: 'https://acme.com/jobs' }],
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('rejects a non-URL link url', () => {
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        links: [{ name: 'Careers', url: 'not a url' }],
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('caps links at 10', () => {
    const links = Array.from({ length: 11 }, (_, i) => ({
      name: `Link ${i}`,
      url: `https://acme.com/${i}`,
    }));
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        links,
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(
      OrgProfileRecordSchema.safeParse({ name: '', createdAt: '2026-07-16T00:00:00.000Z' }).success,
    ).toBe(false);
  });

  it('requires createdAt', () => {
    expect(OrgProfileRecordSchema.safeParse({ name: 'Acme' }).success).toBe(false);
  });

  it('rejects a non-URL website / entityRef', () => {
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        website: 'not a url',
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        entityRefs: ['not a uri'],
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('caps entityRefs at 20', () => {
    const refs = Array.from({ length: 21 }, (_, i) => `https://ror.org/${i}`);
    expect(
      OrgProfileRecordSchema.safeParse({
        name: 'Acme',
        entityRefs: refs,
        createdAt: '2026-07-16T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  // Self-declared narrative fields (industries / founded / aliases). Registry
  // facts (LEI, registration number, ...) are NOT self-declared and never enter
  // this record.
  describe('self-declared industries / founded / aliases', () => {
    const at = '2026-07-16T00:00:00.000Z';

    it('accepts industry/domain pairs, a founded date, and aliases', () => {
      expect(
        OrgProfileRecordSchema.safeParse({
          name: 'Acme',
          industries: [
            { industry: 'id.sifa.defs#industryTechnology', domain: 'id.sifa.defs#domainHardware' },
            { industry: 'id.sifa.defs#industryManufacturing' },
          ],
          founded: '1998',
          aliases: ['Acme Corp', 'ACME'],
          createdAt: at,
        }).success,
      ).toBe(true);
    });

    it('requires the industry token on an industries entry', () => {
      expect(
        OrgProfileRecordSchema.safeParse({ name: 'Acme', industries: [{}], createdAt: at }).success,
      ).toBe(false);
    });

    it('caps industries at 10, founded at 10 chars, aliases at 20', () => {
      expect(
        OrgProfileRecordSchema.safeParse({
          name: 'Acme',
          industries: Array.from({ length: 11 }, () => ({ industry: 'x' })),
          createdAt: at,
        }).success,
      ).toBe(false);
      expect(
        OrgProfileRecordSchema.safeParse({ name: 'Acme', founded: '2020-01-01T', createdAt: at })
          .success,
      ).toBe(false);
      expect(
        OrgProfileRecordSchema.safeParse({
          name: 'Acme',
          aliases: Array.from({ length: 21 }, (_, i) => `Alias ${i}`),
          createdAt: at,
        }).success,
      ).toBe(false);
    });
  });
});
