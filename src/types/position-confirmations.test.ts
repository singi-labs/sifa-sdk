import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  ActorCard,
  PositionConfirmations,
  PositionOrgVerification,
  PositionViewerConfirmation,
  ProfilePosition,
} from '../index.js';

// The AppView serves colleague confirmations on each position, plus what the
// signed-in viewer can do with it (sifa-workspace#163).
describe('ProfilePosition confirmations', () => {
  it('carries the confirmers and the viewer state', () => {
    const position: ProfilePosition = {
      rkey: 'p1',
      title: 'Engineer',
      company: 'Acme',
      startedAt: '2021-03',
      confirmations: {
        count: 1,
        confirmers: [{ did: 'did:plc:alice', handle: 'alice.test', confirmed: true }],
      },
      viewerConfirmation: 'available',
    };
    expect(position.confirmations?.count).toBe(1);
    expect(position.confirmations?.confirmers[0]?.handle).toBe('alice.test');
  });

  it('types the new fields as optional', () => {
    expectTypeOf<ProfilePosition['confirmations']>().toEqualTypeOf<
      PositionConfirmations | undefined
    >();
    expectTypeOf<ProfilePosition['viewerConfirmation']>().toEqualTypeOf<
      PositionViewerConfirmation | undefined
    >();
    expectTypeOf<PositionConfirmations['confirmers']>().toEqualTypeOf<ActorCard[]>();
    expectTypeOf<PositionViewerConfirmation>().toEqualTypeOf<'available' | 'confirmed'>();
  });

  it('carries the organization verification when an attestation covers it (#622)', () => {
    const position: ProfilePosition = {
      rkey: 'p1',
      title: 'Engineer',
      company: 'Acme',
      startedAt: '2021-03',
      orgVerification: {
        orgDid: 'did:plc:acme',
        status: 'current',
        source: 'manual',
        verifiedAt: '2026-09-30T00:00:00.000Z',
        startedAt: '2021-03',
        endedAt: null,
        stale: false,
        attestationUri: 'at://did:plc:acme/id.sifa.org.employmentAttestation/3abc',
      },
    };
    expect(position.orgVerification?.status).toBe('current');
    expectTypeOf<ProfilePosition['orgVerification']>().toEqualTypeOf<
      PositionOrgVerification | undefined
    >();
    expectTypeOf<PositionOrgVerification['status']>().toEqualTypeOf<'current' | 'past'>();
  });
});
