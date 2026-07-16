import { describe, expect, it } from 'vitest';

import { OrgEmploymentAttestationRecordSchema } from './org-employment-attestation.js';

const base = {
  subject: 'did:plc:employee123',
  position: {
    uri: 'at://did:plc:employee123/id.sifa.profile.position/abc',
    cid: 'bafyreib2rxk3rw6nqy2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1',
  },
  status: 'current' as const,
  title: 'Staff Engineer',
  startedAt: '2024-03',
  createdAt: '2026-07-16T00:00:00.000Z',
};

describe('OrgEmploymentAttestationRecordSchema', () => {
  it('accepts a minimal current attestation', () => {
    expect(OrgEmploymentAttestationRecordSchema.safeParse(base).success).toBe(true);
  });

  it('accepts a past attestation with endedAt + entityRef', () => {
    const result = OrgEmploymentAttestationRecordSchema.safeParse({
      ...base,
      status: 'past',
      endedAt: '2025-11-30',
      entityRef: 'http://www.wikidata.org/entity/Q123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(
      OrgEmploymentAttestationRecordSchema.safeParse({ ...base, status: 'maybe' }).success,
    ).toBe(false);
  });

  it('rejects a non-DID subject / companyDid', () => {
    expect(
      OrgEmploymentAttestationRecordSchema.safeParse({ ...base, subject: 'alice.com' }).success,
    ).toBe(false);
    expect(
      OrgEmploymentAttestationRecordSchema.safeParse({ ...base, companyDid: 'acme.com' }).success,
    ).toBe(false);
  });

  it('rejects a strongRef missing its cid', () => {
    expect(
      OrgEmploymentAttestationRecordSchema.safeParse({
        ...base,
        position: { uri: 'at://did:plc:employee123/id.sifa.profile.position/abc' },
      }).success,
    ).toBe(false);
  });

  it('accepts freeform partial startedAt (YYYY / YYYY-MM / YYYY-MM-DD)', () => {
    for (const startedAt of ['2024', '2024-03', '2024-03-01']) {
      expect(OrgEmploymentAttestationRecordSchema.safeParse({ ...base, startedAt }).success).toBe(
        true,
      );
    }
  });
});
