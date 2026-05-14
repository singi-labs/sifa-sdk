import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  SIFA_SDK_VERSION,
  type Endorsement,
  type LanguageProficiency,
  type Profile,
  type ProfilePosition,
} from './index.js';

describe('SIFA_SDK_VERSION', () => {
  it('exports a non-empty version string', () => {
    expect(typeof SIFA_SDK_VERSION).toBe('string');
    expect(SIFA_SDK_VERSION.length).toBeGreaterThan(0);
  });

  it('matches a semver-like shape', () => {
    expect(SIFA_SDK_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('exported types', () => {
  it('Profile accepts a minimal claimed profile', () => {
    const profile: Profile = {
      did: 'did:plc:example',
      handle: 'alice.sifa.id',
      claimed: true,
      followersCount: 0,
      followingCount: 0,
      connectionsCount: 0,
      positions: [],
      education: [],
      skills: [],
    };
    expect(profile.did).toBe('did:plc:example');
  });

  it('ProfilePosition allows optional skill linking', () => {
    const position: ProfilePosition = {
      rkey: 'abc',
      company: 'Sifa',
      title: 'Founder',
      startedAt: '2026-01-01T00:00:00Z',
      skills: [{ uri: 'at://did:plc:example/id.sifa.profile.skill/xyz' }],
    };
    expect(position.skills).toHaveLength(1);
  });

  it('LanguageProficiency is a fixed union', () => {
    expectTypeOf<LanguageProficiency>().toEqualTypeOf<
      'elementary' | 'limited_working' | 'professional_working' | 'full_professional' | 'native'
    >();
  });

  it('Endorsement requires endorser identity and createdAt', () => {
    const endorsement: Endorsement = {
      endorserDid: 'did:plc:bob',
      endorserHandle: 'bob.sifa.id',
      createdAt: '2026-05-14T12:00:00Z',
    };
    expect(endorsement.endorserHandle).toBe('bob.sifa.id');
  });
});
