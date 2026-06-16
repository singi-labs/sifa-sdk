import { APP_URL_PATTERNS, COLLECTION_TO_APP } from './app-url-patterns.js';

/**
 * An activity item as consumed by the Sifa activity-card components and
 * the sifa-api external-URL health scanner. The shape mirrors the props
 * the cards already use, so the resolver returns the same URL the UI
 * renders.
 */
export interface ActivityItemForUrl {
  /** Collection NSID, e.g. "sh.tangled.graph.repo". */
  collection: string;
  /** The raw record from the PDS / API. */
  record: Record<string, unknown>;
  /** Full at-uri of the record (used by collections that derive URL from uri). */
  uri: string;
  /** Record key. */
  rkey: string;
  /** DID of the author of the record. */
  authorDid: string;
  /** Optional handle (cards prefer handle in URL paths when available). */
  authorHandle?: string;
}

/**
 * Map a collection NSID to its app id, mirroring the sifa-web prefix map.
 *
 * Falls back to the first two NSID segments (e.g. "org.hyperboards") when
 * the prefix is not registered, matching the existing card behaviour.
 */
export function getAppIdForCollection(collection: string): string {
  for (const [prefix, appId] of COLLECTION_TO_APP) {
    if (collection.startsWith(prefix)) return appId;
  }
  const parts = collection.split('.');
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return collection;
}

function interpolate(pattern: string, vars: Record<string, string | undefined>): string | null {
  let result = pattern;
  for (const [key, value] of Object.entries(vars)) {
    if (result.includes(`{${key}}`)) {
      if (!value) return null;
      result = result.replaceAll(`{${key}}`, encodeURIComponent(value));
    }
  }
  return result;
}

/**
 * Whether the per-item `urlPattern` for `appId` is appropriate for `collection`.
 *
 * For bluesky, the per-item URL pattern only matches `app.bsky.feed.post` —
 * other `app.bsky.*` collections (`actor.status`, `graph.cancellation`, etc.)
 * use rkeys that would 404 at `bsky.app/profile/{handle}/post/{rkey}`. Fall
 * back to the profile URL for those. See sifa-web#1070 / sifa-web#1073.
 *
 * When `collection` is undefined we err on the safe side for bluesky and
 * prefer the profile URL.
 */
function shouldUseItemPattern(appId: string, collection: string | undefined): boolean {
  if (appId === 'bluesky') {
    return collection === 'app.bsky.feed.post';
  }
  return true;
}

function patternUrl(
  appId: string,
  vars: { handle?: string; did?: string; rkey?: string },
  collection?: string,
): string | null {
  const patterns = APP_URL_PATTERNS[appId];
  if (!patterns) return null;

  if (patterns.urlPattern && shouldUseItemPattern(appId, collection)) {
    const url = interpolate(patterns.urlPattern, vars);
    if (url) return url;
  }
  if (patterns.profileUrlPattern) {
    const url = interpolate(patterns.profileUrlPattern, vars);
    if (url) return url;
  }
  return null;
}

/**
 * Valid tangled repo slug: alphanumeric, dot, dash, underscore. No whitespace,
 * slashes, or URL-encodable special characters. Multi-segment aggregate `name`
 * values produce 404 URLs, so callers fall back to the profile URL when
 * invalid. See sifa-web#1071 / sifa-web#1072.
 */
const TANGLED_REPO_SLUG = /^[a-zA-Z0-9._-]+$/;

function stringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// at://did:plc:xxx/community.lexicon.calendar.event/rkey
//   -> { did: "did:plc:xxx", rkey: "rkey" }
function parseAtUri(atUri: string): { did: string; rkey: string } | null {
  const match = atUri.match(/^at:\/\/(did:[^/]+)\/[^/]+\/(.+)$/);
  if (!match || !match[1] || !match[2]) return null;
  return { did: match[1], rkey: match[2] };
}

/**
 * Resolve the canonical clickable URL for an activity item — the same URL
 * the activity-card UI in sifa-web renders.
 *
 * Returns `null` when no link is appropriate (the card would render
 * non-clickable, or hide itself entirely).
 *
 * Used by:
 * - sifa-web activity cards (single source of truth for href)
 * - sifa-api external-URL health scanner (must match what the UI links to,
 *   so broken-link detection lines up with what users actually click)
 *
 * Resolution order:
 * 1. Per-collection bespoke logic (tangled, kipclip, margin, smokesignal
 *    rsvp, standard documents). These mirror the inline logic in the
 *    individual card components.
 * 2. Generic `record.url` field (used by hyperboards and similar).
 * 3. Pattern-based per-item / profile URL from the registry.
 */
export function resolveCardUrl(item: ActivityItemForUrl): string | null {
  const { collection, record, uri, rkey, authorDid, authorHandle } = item;
  const appId = getAppIdForCollection(collection);

  // --- Per-collection bespoke logic (mirrors the card components) ---

  // Tangled: prefer per-repo URL `https://tangled.sh/{handle}/{slug}`. The slug
  // is `record.name` (legacy format) or — when `name` is absent — the record's
  // rkey (newer repos use the slug as the rkey). The rkey fallback is scoped to
  // `sh.tangled.repo`; other tangled collections (e.g. feed.star) use TID rkeys
  // that are not repo slugs. Only when the slug is valid — multi-segment
  // aggregate names (whitespace, slashes, special chars) would 404. See
  // sifa-web#1071.
  if (collection.startsWith('sh.tangled.')) {
    const repoName = stringOrNull(record.name) ?? (collection === 'sh.tangled.repo' ? rkey : null);
    if (repoName && authorHandle && TANGLED_REPO_SLUG.test(repoName)) {
      return `https://tangled.sh/${authorHandle}/${repoName}`;
    }
    return patternUrl('tangled', { handle: authorHandle, did: authorDid, rkey }, collection);
  }

  // Kipclip / community.lexicon.bookmarks: the bookmark subject IS the URL
  if (
    collection.startsWith('com.kipclip.') ||
    collection.startsWith('community.lexicon.bookmarks.')
  ) {
    const subject = stringOrNull(record.subject);
    if (subject) return subject;
    return patternUrl('kipclip', { handle: authorHandle, did: authorDid, rkey });
  }

  // Margin bookmark: card returns null entirely without record.source
  if (collection === 'at.margin.bookmark') {
    const source = stringOrNull(record.source);
    if (source) return source;
    return null;
  }

  // Margin annotation: target.source -> fall back to margin app URL
  if (collection === 'at.margin.annotation') {
    const target = record.target;
    if (target != null && typeof target === 'object') {
      const source = stringOrNull((target as Record<string, unknown>).source);
      if (source) return source;
    }
    return APP_URL_PATTERNS.margin?.profileUrlPattern ?? null;
  }

  // Smokesignal RSVP: parse the linked event uri
  if (collection === 'community.lexicon.calendar.rsvp') {
    const subject = record.subject;
    if (subject != null && typeof subject === 'object') {
      const subjectUri = stringOrNull((subject as Record<string, unknown>).uri);
      if (subjectUri) {
        const parsed = parseAtUri(subjectUri);
        if (parsed) {
          return `https://smokesignal.events/${parsed.did}/${parsed.rkey}`;
        }
      }
    }
    return null;
  }

  // Smokesignal event itself: use item's own uri
  if (collection === 'community.lexicon.calendar.event') {
    const parsed = parseAtUri(uri);
    if (parsed) {
      return `https://smokesignal.events/${parsed.did}/${parsed.rkey}`;
    }
    return null;
  }

  // atmo.rsvp event itself: use item's own uri -> /p/{did}/e/{rkey}
  if (collection === 'quest.atmo.event') {
    const parsed = parseAtUri(uri);
    if (parsed) {
      return `https://atmo.rsvp/p/${parsed.did}/e/${parsed.rkey}`;
    }
    return null;
  }

  // atmo.rsvp checkin: parse the linked event uri (record.event) and link to
  // that event's page (mirrors smokesignal rsvp). The checkin's own rkey is
  // not addressable, so without a valid event reference it's non-clickable.
  if (collection === 'quest.atmo.checkin') {
    const eventUri = stringOrNull(record.event);
    if (eventUri) {
      const parsed = parseAtUri(eventUri);
      if (parsed) {
        return `https://atmo.rsvp/p/${parsed.did}/e/${parsed.rkey}`;
      }
    }
    return null;
  }

  // atstore reviews: no per-review URL exists on atstore.fyi, and user profile
  // pages don't exist either. Deep-link to the reviewed product instead.
  // The slug comes from record.listingMeta (enriched by sifa-api from the
  // review's `subject` at-uri → fyi.atstore.listing.detail record).
  if (collection === 'fyi.atstore.listing.review') {
    const listingMeta = record.listingMeta;
    if (listingMeta != null && typeof listingMeta === 'object') {
      const slug = stringOrNull((listingMeta as Record<string, unknown>).slug);
      if (slug) return `https://atstore.fyi/products/${encodeURIComponent(slug)}`;
    }
    return APP_URL_PATTERNS.atstore?.profileUrlPattern ?? null;
  }

  // Crate content: link to the canonical published location the maker
  // recorded (a YouTube/podcast/personal-site URL). Crate is an authoring
  // dashboard with no public per-record viewer, so `note` records — which
  // carry no canonicalUrl — render non-clickable (null).
  if (collection === 'social.crate.content') {
    return stringOrNull(record.canonicalUrl);
  }
  if (collection === 'social.crate.note') {
    return null;
  }

  // Standard documents: siteUrl + path (or just siteUrl)
  if (collection.startsWith('site.standard.')) {
    const siteUrl = stringOrNull(record.siteUrl);
    const path = stringOrNull(record.path);
    if (siteUrl && path) return `${siteUrl}${path}`;
    if (siteUrl) return siteUrl;
    // Fall through to generic record.url / patterns
  }

  // --- Generic fallbacks ---

  // record.url is a common ad-hoc per-item URL (hyperboards, etc.)
  const recordUrl = stringOrNull(record.url);
  if (recordUrl) return recordUrl;

  // Pattern-based fallback. Pass `collection` so app-specific guards (bluesky
  // restricting /post/{rkey} to app.bsky.feed.post) can apply.
  return patternUrl(appId, { handle: authorHandle, did: authorDid, rkey }, collection);
}
