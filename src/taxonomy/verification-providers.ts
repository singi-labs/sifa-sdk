/**
 * Verification providers -- the trust roots Sifa recognizes for AT Protocol
 * `app.bsky.graph.verification` records.
 *
 * Framing (see decisions/2026-07-13-third-party-verification-providers.md, D4):
 * a verification checkmark is ONE low-tier trust layer, not Sifa's headline.
 * Most of what it certifies is "this account is who they claim to be" -- useful,
 * and worth carrying because it's an already-recognized network signal, but low
 * value on its own. It sits among Sifa's other trust signals and never becomes a
 * score or a gate. This registry only decides which issuers Sifa displays and
 * with what provenance.
 *
 * Data-only: badge colors and icons are consumer concerns (React DOM on web,
 * React Native on mobile), same split as {@link PLATFORM_LABELS}. Consumers map
 * a provider id to a token/color.
 */

export type VerificationProviderId = 'bluesky' | 'mu';

/** How Sifa learns about a provider's verifications. */
export type VerificationSource = 'bluesky-api' | 'firehose';

export interface VerificationProvider {
  id: VerificationProviderId;
  /** Human label for the badge popover, e.g. "Bluesky", "mu (Eurosky)". */
  label: string;
  /**
   * Primary-display priority (D1): when an account holds verifications from
   * multiple providers, the lowest number wins the single inline badge and the
   * rest move into the popover. Must be unique across providers.
   */
  priority: number;
  /**
   * - `bluesky-api`: sourced from Bluesky's public-API `verifiedStatus`. Bluesky
   *   maintains its own trusted-verifier set, so Sifa keeps no local DID list.
   * - `firehose`: sourced from the Jetstream, gated on {@link verifierDids}.
   */
  source: VerificationSource;
  /**
   * Trusted verifier DIDs for firehose-sourced providers. A verification record
   * counts only if its ISSUER DID is in this list. Empty for `bluesky-api`
   * providers (Bluesky's AppView owns that decision). DIDs, not handles: a handle
   * takeover must never confer verifier status.
   */
  verifierDids: readonly string[];
}

/**
 * A verification held by an account, as surfaced to the UI. `issuerDid` is
 * present for firehose-sourced providers and absent for `bluesky-api`.
 */
export interface AccountVerification {
  provider: VerificationProviderId;
  verifiedAt?: string | null;
  issuerDid?: string | null;
}

/**
 * mu / Eurosky trusted verifiers (see https://hello.mu.social/verification).
 * Sifa-maintained allowlist -- this is the governance commitment. Add a DID here
 * only after confirming the organization is a mu trusted verifier. Handles are
 * comments for humans; the DID is what the firehose issuer gate matches.
 */
const MU_VERIFIER_DIDS = [
  'did:plc:ooensn4mr5mhznzypvxelfa3', // eurosky.social -- coordinates the trusted-verifier program
  'did:plc:durcipmx2rwgzzagbiumobs5', // france-atmosphe.re
  'did:plc:zsf5p7rqilz2qvyd7ezmxrfj', // belgium-atmosphe.re
  'did:plc:hd564mpf6bekrwzyhvujs54b', // medsky.network
  'did:plc:u5zp7npt5kpueado77kuihyz', // npmx.dev
  'did:plc:6tndl5lqrzjrx7ahjom2gjbq', // stewardshiplab.org
  'did:plc:vnycpb2e4lh4tc7oyr3n2jvh', // newsmastfoundation.org
  'did:plc:dsiqe4pszk5ldbjk66fyryjv', // cpesr.fr
] as const;

export const VERIFICATION_PROVIDERS: Record<VerificationProviderId, VerificationProvider> = {
  bluesky: {
    id: 'bluesky',
    label: 'Bluesky',
    priority: 0,
    source: 'bluesky-api',
    verifierDids: [],
  },
  mu: {
    id: 'mu',
    label: 'mu (Eurosky)',
    priority: 1,
    source: 'firehose',
    verifierDids: MU_VERIFIER_DIDS,
  },
};

export function isKnownVerificationProvider(id: string): id is VerificationProviderId {
  return id in VERIFICATION_PROVIDERS;
}

export function getVerificationProvider(id: string): VerificationProvider | undefined {
  return isKnownVerificationProvider(id) ? VERIFICATION_PROVIDERS[id] : undefined;
}

/**
 * The firehose issuer gate: given the DID that authored an
 * `app.bsky.graph.verification` record, return the provider it verifies for, or
 * `null` if the issuer is not a recognized firehose verifier. API-sourced
 * providers (Bluesky) are never matched here -- their verifications do not enter
 * through the firehose, so a self-issued record cannot resolve to them.
 */
export function resolveVerifierProvider(issuerDid: string): VerificationProviderId | null {
  for (const provider of Object.values(VERIFICATION_PROVIDERS)) {
    if (provider.source !== 'firehose') continue;
    if (provider.verifierDids.includes(issuerDid)) return provider.id;
  }
  return null;
}

/**
 * D1 primary-provider selection: from all verifications an account holds, pick
 * the one whose provider has the highest priority (lowest `priority` number) for
 * the single inline badge. The rest belong in the popover. Verifications from
 * unknown providers are ignored. Returns `null` when nothing is displayable.
 */
export function primaryVerification(
  verifications: readonly AccountVerification[],
): AccountVerification | null {
  let best: AccountVerification | null = null;
  let bestPriority = Number.POSITIVE_INFINITY;
  for (const verification of verifications) {
    const provider = getVerificationProvider(verification.provider);
    if (!provider) continue;
    if (provider.priority < bestPriority) {
      best = verification;
      bestPriority = provider.priority;
    }
  }
  return best;
}
