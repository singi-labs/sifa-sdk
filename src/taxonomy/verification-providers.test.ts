import { describe, it, expect } from 'vitest';
import {
  VERIFICATION_PROVIDERS,
  getVerificationProvider,
  isKnownVerificationProvider,
  resolveVerifierProvider,
  primaryVerification,
  type AccountVerification,
} from './verification-providers.js';

describe('VERIFICATION_PROVIDERS registry', () => {
  it('keys every provider by its own id', () => {
    for (const [id, provider] of Object.entries(VERIFICATION_PROVIDERS)) {
      expect(provider.id).toBe(id);
    }
  });

  it('sources Bluesky from its own API with no local verifier list', () => {
    const bluesky = VERIFICATION_PROVIDERS.bluesky;
    expect(bluesky.source).toBe('bluesky-api');
    expect(bluesky.verifierDids).toHaveLength(0);
  });

  it('sources mu from the firehose gated on a non-empty verifier DID list', () => {
    const mu = VERIFICATION_PROVIDERS.mu;
    expect(mu.source).toBe('firehose');
    expect(mu.verifierDids.length).toBeGreaterThan(0);
    expect(mu.verifierDids.every((did) => did.startsWith('did:'))).toBe(true);
  });

  it('assigns a unique priority to each provider', () => {
    const priorities = Object.values(VERIFICATION_PROVIDERS).map((p) => p.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });
});

describe('isKnownVerificationProvider', () => {
  it('accepts a known provider id', () => {
    expect(isKnownVerificationProvider('bluesky')).toBe(true);
    expect(isKnownVerificationProvider('mu')).toBe(true);
  });

  it('rejects an unknown provider id', () => {
    expect(isKnownVerificationProvider('twitter')).toBe(false);
  });
});

describe('getVerificationProvider', () => {
  it('returns the provider for a known id', () => {
    expect(getVerificationProvider('mu')?.label).toBe(VERIFICATION_PROVIDERS.mu.label);
  });

  it('returns undefined for an unknown id', () => {
    expect(getVerificationProvider('twitter')).toBeUndefined();
  });
});

describe('resolveVerifierProvider (firehose issuer gate)', () => {
  it('maps every known mu verifier DID to the mu provider', () => {
    expect(VERIFICATION_PROVIDERS.mu.verifierDids.length).toBeGreaterThan(0);
    for (const did of VERIFICATION_PROVIDERS.mu.verifierDids) {
      expect(resolveVerifierProvider(did)).toBe('mu');
    }
  });

  it('returns null for an unrecognized issuer DID', () => {
    expect(resolveVerifierProvider('did:plc:somerandomstranger')).toBeNull();
  });

  it('never matches an API-sourced provider (Bluesky is not firehose-gated)', () => {
    // Bluesky verifications arrive via its public API, not the firehose issuer
    // gate. A self-issued record must not resolve to the Bluesky provider.
    expect(resolveVerifierProvider('did:plc:anyone')).not.toBe('bluesky');
  });
});

describe('primaryVerification (D1: one badge, rest in popover)', () => {
  const mu: AccountVerification = { provider: 'mu', verifiedAt: '2026-07-01T00:00:00Z' };
  const bluesky: AccountVerification = { provider: 'bluesky', verifiedAt: '2026-01-01T00:00:00Z' };

  it('returns null when there are no verifications', () => {
    expect(primaryVerification([])).toBeNull();
  });

  it('returns the sole verification when there is one', () => {
    expect(primaryVerification([mu])).toEqual(mu);
  });

  it('picks the highest-priority provider regardless of input order', () => {
    expect(primaryVerification([mu, bluesky])).toEqual(bluesky);
    expect(primaryVerification([bluesky, mu])).toEqual(bluesky);
  });

  it('ignores verifications from unknown providers', () => {
    const unknown = { provider: 'twitter', verifiedAt: null } as unknown as AccountVerification;
    expect(primaryVerification([unknown, mu])).toEqual(mu);
    expect(primaryVerification([unknown])).toBeNull();
  });
});
