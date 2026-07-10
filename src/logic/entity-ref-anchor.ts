/**
 * Anchor-quality classification for a position's `entityRef` pointer (#159).
 *
 * A durable company link tiers by the quality of its anchor, which drives the
 * link indicator in the UI (registry-backed reads stronger than a Sifa-scoped
 * PDL pointer, per the ratified D5 chip policy). The classification is derived
 * purely from the ref URI's host, so it is a shared, cross-platform predicate
 * (web today, the native app later).
 *
 *   registry  -- a portable external id any atproto app can resolve
 *                (Wikidata / ROR / GLEIF). Renders as a full "Linked" indicator.
 *   sifa      -- a Sifa-scoped `sifa.id/company/<publicId>` pointer for a
 *                PDL-only company. Renders as a muted "Linked" (no glyph).
 *   unlinked  -- no ref, a malformed URL, or an unrecognized host. Free text.
 *
 * NEVER surfaced as "verified": a link is not a verification.
 */
export const ENTITY_REF_ANCHORS = ['registry', 'sifa', 'unlinked'] as const;
export type EntityRefAnchor = (typeof ENTITY_REF_ANCHORS)[number];

/** Hosts of portable, app-neutral company registries. */
const REGISTRY_HOSTS = new Set([
  'wikidata.org',
  'www.wikidata.org',
  'ror.org',
  'gleif.org',
  'www.gleif.org',
]);

const SIFA_HOST = 'sifa.id';

/**
 * Classify an entityRef by anchor quality. Uses strict host parsing (never
 * substring matching) so a hostile URL that merely contains a registry host in a
 * query string is treated as unlinked, not falsely linked.
 */
export function classifyEntityRef(entityRef: string | null | undefined): EntityRefAnchor {
  if (!entityRef || !entityRef.trim()) return 'unlinked';
  let url: URL;
  try {
    url = new URL(entityRef.trim());
  } catch {
    return 'unlinked';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'unlinked';
  const host = url.hostname.toLowerCase();
  if (REGISTRY_HOSTS.has(host)) return 'registry';
  if (host === SIFA_HOST) return 'sifa';
  return 'unlinked';
}

/** Whether a position carries a durable link of any anchor quality. */
export function isLinked(entityRef: string | null | undefined): boolean {
  return classifyEntityRef(entityRef) !== 'unlinked';
}
