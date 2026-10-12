import { describe, it, expect } from 'vitest';
import {
  VERIFICATION_PROVIDERS,
  getVerificationProvider,
  isKnownVerificationProvider,
  resolveVerifierProvider,
  buildVerifierListMembers,
  primaryVerification,
  resolveVerificationBadges,
  verificationLabel,
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

  it('falls back to the last confirmed verifiers when no list members are supplied', () => {
    // Callers that have not loaded the list (or an older consumer on the
    // one-argument form) keep recognizing the previously confirmed verifiers.
    expect(resolveVerifierProvider('did:plc:durcipmx2rwgzzagbiumobs5')).toBe('mu');
  });

  it('drops the fallback once list members are supplied (the list is authoritative)', () => {
    const members = new Map([['did:plc:listmember', 'mu' as const]]);
    expect(resolveVerifierProvider('did:plc:durcipmx2rwgzzagbiumobs5', members)).toBeNull();
  });

  it('returns null instead of throwing for an unknown provider id in list members', () => {
    const members = new Map([['did:plc:odd', 'eurosky']]) as unknown as ReadonlyMap<string, 'mu'>;
    expect(resolveVerifierProvider('did:plc:odd', members)).toBeNull();
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

describe('buildVerifierListMembers (list-owner trust check)', () => {
  const ROOT = 'did:plc:ooensn4mr5mhznzypvxelfa3';
  const LIST = 'at://did:plc:ooensn4mr5mhznzypvxelfa3/app.bsky.graph.list/3mogaw2g4an23';

  it("maps subjects of the provider's list, read from the root's repo, to the provider", () => {
    const members = buildVerifierListMembers([
      { repoDid: ROOT, list: LIST, subject: 'did:plc:philosophy' },
      { repoDid: ROOT, list: LIST, subject: 'did:web:example.org' },
    ]);
    expect(members.get('did:plc:philosophy')).toBe('mu');
    expect(members.get('did:web:example.org')).toBe('mu');
  });

  it('rejects items read from a repo other than the list owner', () => {
    const members = buildVerifierListMembers([
      { repoDid: 'did:plc:impostor', list: LIST, subject: 'did:plc:sneaky' },
    ]);
    expect(members.size).toBe(0);
  });

  it('rejects items that belong to another list', () => {
    const members = buildVerifierListMembers([
      {
        repoDid: ROOT,
        list: 'at://did:plc:ooensn4mr5mhznzypvxelfa3/app.bsky.graph.list/other',
        subject: 'did:plc:sneaky',
      },
    ]);
    expect(members.size).toBe(0);
  });

  it('rejects malformed subjects', () => {
    const members = buildVerifierListMembers([
      { repoDid: ROOT, list: LIST, subject: 'eurosky.social' },
      { repoDid: ROOT, list: LIST, subject: 42 },
    ]);
    expect(members.size).toBe(0);
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

describe('verificationLabel', () => {
  it("uses the verifier's own name when the API sends one", () => {
    expect(verificationLabel({ provider: 'mu', issuerName: 'PhilosophySky Network' })).toBe(
      'PhilosophySky Network',
    );
  });

  it('falls back to the provider label when the name is missing or blank', () => {
    expect(verificationLabel({ provider: 'bluesky' })).toBe('Bluesky');
    expect(verificationLabel({ provider: 'mu', issuerName: '  ' })).toBe('mu (Eurosky)');
    expect(verificationLabel({ provider: 'mu', issuerName: null })).toBe('mu (Eurosky)');
  });

  it('falls back to the raw provider id for a provider this SDK does not know', () => {
    const unknown = { provider: 'future' } as unknown as AccountVerification;
    expect(verificationLabel(unknown)).toBe('future');
  });
});

describe('resolveVerificationBadges', () => {
  const mu: AccountVerification = { provider: 'mu', verifiedAt: '2026-07-01T00:00:00.000Z' };

  it('returns the API badges when present', () => {
    const badges = [mu];
    expect(resolveVerificationBadges({ verificationBadges: badges, blueskyVerified: true })).toBe(
      badges,
    );
  });

  it('returns no badges when the API sends an empty array, even with the legacy flag', () => {
    expect(resolveVerificationBadges({ verificationBadges: [], blueskyVerified: true })).toEqual(
      [],
    );
  });

  it('builds a Bluesky badge from the legacy flag when the array is absent', () => {
    expect(
      resolveVerificationBadges({ blueskyVerified: true, blueskyVerifiedAt: '2026-01-01' }),
    ).toEqual([{ provider: 'bluesky', verifiedAt: '2026-01-01' }]);
    expect(resolveVerificationBadges({ verificationBadges: null, blueskyVerified: true })).toEqual([
      { provider: 'bluesky', verifiedAt: null },
    ]);
  });

  it('returns nothing without badges or the legacy flag', () => {
    expect(resolveVerificationBadges({})).toEqual([]);
  });
});
