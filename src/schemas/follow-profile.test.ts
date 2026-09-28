import { describe, expect, expectTypeOf, it } from 'vitest';

import type { AccountVerification } from '../taxonomy/verification-providers.js';

import {
  FEATURE_FLAGS,
  FeatureAllowlistEntrySchema,
  FollowProfilePageSchema,
  FollowProfileSchema,
  type FollowProfileItem,
} from './follow-profile.js';

const DID_A = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa';
const NOW = '2026-06-01T10:00:00.000Z';

describe('FollowProfileSchema', () => {
  const ROW = {
    did: DID_A,
    handle: 'alice.bsky.social',
    source: 'sifa',
    claimed: true,
    followedAt: NOW,
  };

  it('keeps verificationBadges when present (sifa-workspace#260)', () => {
    const badges = [
      { provider: 'bluesky', verifiedAt: NOW },
      { provider: 'mu', verifiedAt: null, issuerDid: 'did:plc:ooensn4mr5mhznzypvxelfa3' },
    ];
    const parsed = FollowProfileSchema.parse({ ...ROW, verificationBadges: badges });
    expect(parsed.verificationBadges).toEqual(badges);
  });

  it('stays valid without verificationBadges', () => {
    const parsed = FollowProfileSchema.parse(ROW);
    expect(parsed.verificationBadges).toBeUndefined();
  });

  it('drops badges from providers this SDK version does not know, keeping the row', () => {
    const parsed = FollowProfileSchema.parse({
      ...ROW,
      verificationBadges: [
        { provider: 'future-provider', verifiedAt: NOW },
        { provider: 'mu', verifiedAt: NOW, issuerDid: 'did:plc:ooensn4mr5mhznzypvxelfa3' },
      ],
    });
    expect(parsed.verificationBadges).toEqual([
      { provider: 'mu', verifiedAt: NOW, issuerDid: 'did:plc:ooensn4mr5mhznzypvxelfa3' },
    ]);
  });

  it('types parsed verificationBadges as AccountVerification[]', () => {
    expectTypeOf<FollowProfileItem['verificationBadges']>().toEqualTypeOf<
      AccountVerification[] | undefined
    >();
  });

  it('accepts a minimal row (required fields only)', () => {
    expect(
      FollowProfileSchema.safeParse({
        did: DID_A,
        handle: 'alice.bsky.social',
        source: 'sifa',
        claimed: true,
        followedAt: NOW,
      }).success,
    ).toBe(true);
  });

  it('accepts a fully-populated row', () => {
    expect(
      FollowProfileSchema.safeParse({
        did: DID_A,
        handle: 'alice.bsky.social',
        displayName: 'Alice',
        headline: 'CEO',
        avatarUrl: 'https://cdn.example/a.jpg',
        source: 'bluesky',
        claimed: false,
        followedAt: NOW,
        blueskyVerified: true,
        blueskyVerifiedAt: NOW,
      }).success,
    ).toBe(true);
  });

  it('accepts blueskyVerifiedAt: null (server convention for never-verified)', () => {
    expect(
      FollowProfileSchema.safeParse({
        did: DID_A,
        handle: 'alice',
        source: 'sifa',
        claimed: true,
        followedAt: NOW,
        blueskyVerifiedAt: null,
      }).success,
    ).toBe(true);
  });

  it('rejects rows with an invalid DID', () => {
    expect(
      FollowProfileSchema.safeParse({
        did: 'not-a-did',
        handle: 'alice',
        source: 'sifa',
        claimed: true,
        followedAt: NOW,
      }).success,
    ).toBe(false);
  });

  it('rejects malformed followedAt', () => {
    expect(
      FollowProfileSchema.safeParse({
        did: DID_A,
        handle: 'alice',
        source: 'sifa',
        claimed: true,
        followedAt: '2026-06-01',
      }).success,
    ).toBe(false);
  });
});

describe('FollowProfilePageSchema', () => {
  it('accepts an empty page with null cursor', () => {
    expect(FollowProfilePageSchema.safeParse({ items: [], cursor: null }).success).toBe(true);
  });

  it('accepts a page with one row and a string cursor', () => {
    const parsed = FollowProfilePageSchema.parse({
      items: [
        {
          did: DID_A,
          handle: 'alice',
          source: 'sifa',
          claimed: true,
          followedAt: NOW,
        },
      ],
      cursor: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTAxIn0',
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.cursor).toBe('eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTAxIn0');
  });

  it('rejects missing cursor key (server always sends it, even if null)', () => {
    expect(FollowProfilePageSchema.safeParse({ items: [] }).success).toBe(false);
  });
});

describe('FeatureAllowlistEntrySchema', () => {
  it('accepts an entry with a note', () => {
    expect(
      FeatureAllowlistEntrySchema.safeParse({
        did: DID_A,
        addedAt: NOW,
        note: 'beta tester',
      }).success,
    ).toBe(true);
  });

  it('accepts a null note', () => {
    expect(
      FeatureAllowlistEntrySchema.safeParse({ did: DID_A, addedAt: NOW, note: null }).success,
    ).toBe(true);
  });

  it('accepts an omitted note', () => {
    expect(FeatureAllowlistEntrySchema.safeParse({ did: DID_A, addedAt: NOW }).success).toBe(true);
  });

  it('rejects invalid DID', () => {
    expect(FeatureAllowlistEntrySchema.safeParse({ did: 'nope', addedAt: NOW }).success).toBe(
      false,
    );
  });
});

describe('FEATURE_FLAGS', () => {
  it('includes the iter-1 feed flag', () => {
    expect(FEATURE_FLAGS).toContain('FEED_V5_ENABLED');
  });
});
