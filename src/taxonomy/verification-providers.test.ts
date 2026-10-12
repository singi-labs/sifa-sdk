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

  it("points mu at Eurosky's published trusted-verifier list, owned by a root DID", () => {
    const mu = VERIFICATION_PROVIDERS.mu;
    expect(mu.verifierListUri).toBe(
      'at://did:plc:ooensn4mr5mhznzypvxelfa3/app.bsky.graph.list/3mogaw2g4an23',
    );
    // The list owner is the trust root: only its list confers verifier status.
    const owner = mu.verifierListUri?.split('/')[2];
    expect(mu.verifierDids).toContain(owner);
  });

  it('keeps only trust roots in the static mu DID list (members come from the list)', () => {
    expect(VERIFICATION_PROVIDERS.mu.verifierDids).toEqual(['did:plc:ooensn4mr5mhznzypvxelfa3']);
  });

  it('gives Bluesky no verifier list', () => {
    expect(VERIFICATION_PROVIDERS.bluesky.verifierListUri).toBeUndefined();
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

  it('rejects inherited Object.prototype keys', () => {
    expect(isKnownVerificationProvider('toString')).toBe(false);
    expect(isKnownVerificationProvider('constructor')).toBe(false);
    expect(isKnownVerificationProvider('hasOwnProperty')).toBe(false);
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

  it('maps a DID from the dynamic list members to its provider', () => {
    const members = new Map([['did:plc:listmember', 'mu' as const]]);
    expect(resolveVerifierProvider('did:plc:listmember', members)).toBe('mu');
    expect(resolveVerifierProvider('did:plc:listmember')).toBeNull();
  });

  it('still resolves trust roots when list members are supplied', () => {
    const members = new Map([['did:plc:listmember', 'mu' as const]]);
    expect(resolveVerifierProvider('did:plc:ooensn4mr5mhznzypvxelfa3', members)).toBe('mu');
  });

  it('ignores list members mapped to an API-sourced provider', () => {
    const members = new Map([['did:plc:sneaky', 'bluesky' as const]]);
    expect(resolveVerifierProvider('did:plc:sneaky', members)).toBeNull();
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
    // Intentionally bypasses the type checker to simulate a verification whose
    // provider is not in the registry (a shape the API layer could still emit).
    const unknown = { provider: 'twitter', verifiedAt: null } as unknown as AccountVerification;
    expect(primaryVerification([unknown, mu])).toEqual(mu);
    expect(primaryVerification([unknown])).toBeNull();
  });
});
