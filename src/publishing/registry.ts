/**
 * Publisher allowlist for the Standard.site rich embed.
 *
 * Mirrors `bluesky-social/social-app`
 * `src/components/Post/Embed/StandardSiteEmbed/publishers.ts`. The only
 * gate this provides is which publishers get the highlighted
 * "Subscribe on {Publisher}" CTA with a publisher icon vs the plain
 * "View publication" fallback — any Standard.site embed renders
 * regardless of allowlist membership.
 *
 * Sync policy: review additions against the upstream bsky list weekly;
 * Singi Labs reviews before merge.
 */

export interface Publisher {
  /** Lowercase host. Subdomains are matched via `hostMatches`. */
  host: string;
  /** Human-facing publisher name shown in CTA copy. */
  name: string;
  /**
   * Stable identifier used by clients to look up brand icons. The SDK
   * does not ship icon assets — sifa-web maintains them keyed by this
   * id so React Native vs web rendering can diverge.
   */
  iconKey: 'leaflet' | 'pckt' | 'offprint';
}

export const STANDARD_SITE_PUBLISHERS: readonly Publisher[] = Object.freeze([
  { host: 'leaflet.pub', name: 'Leaflet', iconKey: 'leaflet' },
  { host: 'pckt.blog', name: 'pckt', iconKey: 'pckt' },
  { host: 'offprint.app', name: 'Offprint', iconKey: 'offprint' },
]);

/**
 * Returns true when `host` exactly matches `target` or is a subdomain of
 * it. Hosts are expected to be lowercase already.
 */
export function hostMatches(host: string, target: string): boolean {
  return host === target || host.endsWith('.' + target);
}

function hostFromUri(uri: string | undefined | null): string | null {
  if (!uri) return null;
  try {
    return new URL(uri).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Match a publisher by host. Returns the publisher when `host` is on the
 * allowlist (exact or subdomain match), null otherwise. Host should be
 * lowercase.
 */
export function matchPublisherByHost(host: string | null | undefined): Publisher | null {
  if (!host) return null;
  const lower = host.toLowerCase();
  return STANDARD_SITE_PUBLISHERS.find((p) => hostMatches(lower, p.host)) ?? null;
}

/**
 * Match a publisher by URI. Convenience wrapper around
 * `matchPublisherByHost` for callers that have a publication URL handy.
 */
export function matchPublisherByUri(uri: string | undefined | null): Publisher | null {
  return matchPublisherByHost(hostFromUri(uri));
}
