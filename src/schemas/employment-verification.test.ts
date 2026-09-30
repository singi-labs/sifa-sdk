import { describe, expect, it } from 'vitest';

import {
  EmploymentVerificationRecordSchema,
  resolveEmploymentVerification,
} from './employment-verification.js';
import { OrgEmploymentAttestationRecordSchema } from './org-employment-attestation.js';

const ISSUER = 'did:plc:issuer';
const record = {
  $type: 'id.sifa.verification.employment',
  subject: 'did:plc:subject',
  position: { uri: 'at://did:plc:subject/id.sifa.profile.position/3abc' },
  status: 'id.sifa.defs#employmentCurrent',
  methods: ['id.sifa.defs#verifiedByOrg'],
  title: 'Engineer',
  startedAt: '2020-01',
  organization: 'did:plc:org',
  evidence: [{ uri: 'at://did:plc:org/id.sifa.org.employmentAttestation/3xyz', cid: 'bafy' }],
  verifiedAt: '2026-09-30T12:00:00.000Z',
  createdAt: '2026-09-30T12:00:00.000Z',
};

describe('EmploymentVerificationRecordSchema', () => {
  it('accepts an issued record and rejects one without methods', () => {
    expect(EmploymentVerificationRecordSchema.safeParse(record).success).toBe(true);
    expect(EmploymentVerificationRecordSchema.safeParse({ ...record, methods: [] }).success).toBe(
      false,
    );
  });

  it('rejects an email address or domain field', () => {
    expect(
      EmploymentVerificationRecordSchema.safeParse({ ...record, emailDomain: 'acme.example' })
        .success,
    ).toBe(false);
  });
});

describe('resolveEmploymentVerification', () => {
  it('counts a record only when the repository is the issuer', () => {
    const ok = resolveEmploymentVerification(record, { repoDid: ISSUER, issuerDid: ISSUER });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.record.methods).toEqual(['id.sifa.defs#verifiedByOrg']);
    const copy = resolveEmploymentVerification(record, {
      repoDid: 'did:plc:other',
      issuerDid: ISSUER,
    });
    expect(copy).toEqual({ ok: false, reason: 'not-issuer' });
  });

  it('reports a lapsed record and a malformed one', () => {
    const lapsed = resolveEmploymentVerification(
      { ...record, expiresAt: '2020-01-01T00:00:00.000Z' },
      { repoDid: ISSUER, issuerDid: ISSUER, now: new Date('2026-09-30T00:00:00Z') },
    );
    expect(lapsed).toEqual({ ok: false, reason: 'lapsed' });
    const bad = resolveEmploymentVerification(
      { subject: 1 },
      { repoDid: ISSUER, issuerDid: ISSUER },
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe('malformed');
  });
});

describe('OrgEmploymentAttestationRecordSchema (lexicon 0.13 shape)', () => {
  it('accepts an entity-level attestation with token status and source, no position or snapshots', () => {
    const result = OrgEmploymentAttestationRecordSchema.safeParse({
      subject: 'did:plc:subject',
      status: 'id.sifa.defs#employmentCurrent',
      source: 'id.sifa.defs#attestationManual',
      createdAt: '2026-09-30T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('still accepts the bare status words', () => {
    expect(
      OrgEmploymentAttestationRecordSchema.safeParse({
        subject: 'did:plc:subject',
        status: 'past',
        endedAt: '2026-09',
        createdAt: '2026-09-30T12:00:00.000Z',
      }).success,
    ).toBe(true);
  });
});
