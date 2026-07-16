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
      createdAt: '2026-07-16T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
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
});
