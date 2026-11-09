import { describe, expect, it } from 'vitest';

import { ProfileHonorRecordSchema } from './index.js';
import { HonorWriteSchema } from './write/index.js';

// sifa-lexicons 0.15.8: kind and links on honor records. A record schema that
// strips them loses both on read, and the next save from the editor writes the
// record back without them.
const createdAt = '2026-11-09T10:00:00.000Z';
const base = { title: 'Best Community Builder', createdAt };
const link = { url: 'https://example.com/announcement', label: 'Announcement' };
const links = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ url: `https://example.com/source/${i}` }));

describe('ProfileHonorRecordSchema kind and links', () => {
  it('keeps kind and links', () => {
    const record = { ...base, kind: 'id.sifa.defs#honorNomination', links: [link] };
    expect(ProfileHonorRecordSchema.parse(record)).toEqual(record);
  });

  it('accepts an unknown kind token (open set)', () => {
    const kind = 'com.example.defs#honorScholarship';
    expect(ProfileHonorRecordSchema.parse({ ...base, kind }).kind).toBe(kind);
  });

  it('accepts records without the new fields and with empty links', () => {
    expect(ProfileHonorRecordSchema.safeParse(base).success).toBe(true);
    expect(ProfileHonorRecordSchema.safeParse({ ...base, links: [] }).success).toBe(true);
  });

  it('rejects a non-string kind, a link without url, and 51 links', () => {
    expect(ProfileHonorRecordSchema.safeParse({ ...base, kind: 1 }).success).toBe(false);
    expect(ProfileHonorRecordSchema.safeParse({ ...base, links: [{ label: 'x' }] }).success).toBe(
      false,
    );
    expect(ProfileHonorRecordSchema.safeParse({ ...base, links: links(50) }).success).toBe(true);
    expect(ProfileHonorRecordSchema.safeParse({ ...base, links: links(51) }).success).toBe(false);
  });
});

describe('HonorWriteSchema kind and links', () => {
  const write = { title: 'Best Community Builder' };

  it('accepts kind and links, and null to clear them', () => {
    const input = { ...write, kind: 'id.sifa.defs#honorRecord', links: [link] };
    expect(HonorWriteSchema.parse(input)).toEqual(input);
    expect(HonorWriteSchema.safeParse({ ...write, kind: null, links: null }).success).toBe(true);
  });

  it('accepts an unknown kind token (open set)', () => {
    expect(
      HonorWriteSchema.safeParse({ ...write, kind: 'com.example.defs#honorScholarship' }).success,
    ).toBe(true);
  });

  it('rejects an empty kind, a non-http link, and 51 links', () => {
    expect(HonorWriteSchema.safeParse({ ...write, kind: '' }).success).toBe(false);
    expect(
      HonorWriteSchema.safeParse({ ...write, links: [{ url: 'javascript:alert(1)' }] }).success,
    ).toBe(false);
    expect(HonorWriteSchema.safeParse({ ...write, links: links(50) }).success).toBe(true);
    expect(HonorWriteSchema.safeParse({ ...write, links: links(51) }).success).toBe(false);
  });
});
