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
   * Trust-root DIDs for firehose-sourced providers. A verification record counts
   * if its ISSUER DID is a root or a member of {@link verifierListUri}. Empty for
   * `bluesky-api` providers (Bluesky's AppView owns that decision). DIDs, not
   * handles: a handle takeover must never confer verifier status.
   */
  verifierDids: readonly string[];
  /**
   * AT-URI of the `app.bsky.graph.list` where the provider publishes its
   * trusted verifiers. Consumers load its members at runtime and pass them to
   * {@link resolveVerifierProvider}, so a verifier the provider adds counts on
   * Sifa without a release. The list owner must be in {@link verifierDids}.
   */
  verifierListUri?: string;
  /**
   * Verifiers last confirmed by hand, used ONLY when the caller supplies no
   * list members (list not loaded yet, or a consumer that does not load it).
   * Keeps such callers working; once members are supplied, the list wins.
   */
  fallbackVerifierDids?: readonly string[];
}

/**
 * A verification held by an account, as surfaced to the UI. `issuerDid` is
 * present for firehose-sourced providers and absent for `bluesky-api`.
 */
export interface AccountVerification {
  provider: VerificationProviderId;
  verifiedAt?: string | null;
  issuerDid?: string | null;
  /** Display name of the issuer (firehose providers), when the API knows it. */
  issuerName?: string | null;
}

/**
 * mu / Eurosky trust root (see https://hello.mu.social/verification).
 * eurosky.social coordinates the trusted-verifier program and publishes the
 * verifier set as {@link MU_VERIFIER_LIST_URI}; the individual verifiers are
 * read from that list at runtime, not maintained here.
 */
const MU_ROOT_DID = 'did:plc:ooensn4mr5mhznzypvxelfa3'; // eurosky.social

/** "Trusted verifiers on mu", owned by {@link MU_ROOT_DID}. */
const MU_VERIFIER_LIST_URI = `at://${MU_ROOT_DID}/app.bsky.graph.list/3mogaw2g4an23`;

/** Snapshot of the mu verifiers confirmed by hand before the list was used. */
const MU_FALLBACK_VERIFIER_DIDS = [
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
    verifierDids: [MU_ROOT_DID],
    verifierListUri: MU_VERIFIER_LIST_URI,
    fallbackVerifierDids: MU_FALLBACK_VERIFIER_DIDS,
  },
};

export function isKnownVerificationProvider(id: string): id is VerificationProviderId {
  // Object.hasOwn, not `in`: `in` also matches inherited Object.prototype keys
  // ('toString', 'constructor', ...), which would wrongly narrow those strings
  // and make getVerificationProvider return a prototype function.
  return Object.hasOwn(VERIFICATION_PROVIDERS, id);
}

export function getVerificationProvider(id: string): VerificationProvider | undefined {
  return isKnownVerificationProvider(id) ? VERIFICATION_PROVIDERS[id] : undefined;
}

/**
 * The firehose issuer gate: given the DID that authored an
 * `app.bsky.graph.verification` record, return the provider it verifies for, or
 * `null` if the issuer is not a recognized firehose verifier. A DID counts if it
 * is a provider's trust root, or if `listMembers` (built with
 * {@link buildVerifierListMembers}) maps it to a firehose provider. Without
 * `listMembers`, each provider's `fallbackVerifierDids` apply instead.
 * API-sourced providers (Bluesky) are never matched here -- their verifications
 * do not enter through the firehose, so a self-issued record cannot resolve to
 * them.
 */
export function resolveVerifierProvider(
  issuerDid: string,
  listMembers?: ReadonlyMap<string, VerificationProviderId>,
): VerificationProviderId | null {
  for (const provider of Object.values(VERIFICATION_PROVIDERS)) {
    if (provider.source !== 'firehose') continue;
    if (provider.verifierDids.includes(issuerDid)) return provider.id;
    if (!listMembers && provider.fallbackVerifierDids?.includes(issuerDid)) return provider.id;
  }
  const fromList = listMembers?.get(issuerDid);
  if (fromList && getVerificationProvider(fromList)?.source === 'firehose') return fromList;
  return null;
}

/** One `app.bsky.graph.listitem` record value, plus the repo it was read from. */
export interface VerifierListItem {
  /** DID of the repo the listitem record was read from. */
  repoDid: string;
  list: unknown;
  subject: unknown;
}

/**
 * Build the `listMembers` map for {@link resolveVerifierProvider} from raw
 * listitem records. An item counts only if it belongs to a firehose provider's
 * {@link VerificationProvider.verifierListUri}, was read from that list owner's
 * repo, and that owner is one of the provider's trust roots. Anything else
 * (a list item someone else wrote, another list, a malformed subject) is dropped.
 */
export function buildVerifierListMembers(
  items: readonly VerifierListItem[],
): Map<string, VerificationProviderId> {
  const members = new Map<string, VerificationProviderId>();
  for (const provider of Object.values(VERIFICATION_PROVIDERS)) {
    if (provider.source !== 'firehose' || !provider.verifierListUri) continue;
    const owner = provider.verifierListUri.split('/')[2];
    if (!owner || !provider.verifierDids.includes(owner)) continue;
    for (const item of items) {
      if (item.repoDid !== owner || item.list !== provider.verifierListUri) continue;
      if (typeof item.subject !== 'string' || !/^did:[a-z]+:[A-Za-z0-9._:%-]+$/.test(item.subject))
        continue;
      if (!members.has(item.subject)) members.set(item.subject, provider.id);
    }
  }
  return members;
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
