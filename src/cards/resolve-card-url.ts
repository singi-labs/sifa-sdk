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

/**
 * How the activity-card health scanner should verify a card is still live.
 *
 * - `record`: the URL is a first-party permalink that renders THIS record
 *   (e.g. a Bluesky post at bsky.app, a tangled repo, a smokesignal event).
 *   The authoritative liveness check is "does the record still exist on its
 *   PDS" — `com.atproto.repo.getRecord` on the item's own at-uri — NOT an
 *   HTTP probe of the rendering app. Rendering apps (bsky.app, tangled.sh)
 *   frequently answer HEAD with 404/405 while serving GET fine, which
 *   false-positives every permalink as broken.
 * - `url`: the URL is a foreign or derived target — a bookmarked page, an
 *   external publisher, a *different* record's page, or a profile page.
 *   Its reachability is independent of this record, so probe the URL.
 * - `none`: the card has no clickable URL; nothing to check.
 */
export type CardHealthStrategy = 'record' | 'url' | 'none';

export interface CardHealth {
  /** The clickable URL the card renders. Null when non-clickable. */
  url: string | null;
  /** How the scanner should verify liveness. See {@link CardHealthStrategy}. */
  strategy: CardHealthStrategy;
}

/** Build a `url`-strategy result (foreign/derived/profile target). */
function urlHealth(url: string | null): CardHealth {
  return url ? { url, strategy: 'url' } : { url: null, strategy: 'none' };
}

/** Build a `record`-strategy result (self-permalink of this record). */
function recordHealth(url: string | null): CardHealth {
  return url ? { url, strategy: 'record' } : { url: null, strategy: 'none' };
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

/**
 * Resolve a pattern-based URL, reporting which tier produced it:
 * - `item`: a per-item permalink (renders this specific record) -> record-checkable.
 * - `profile`: the app's profile page (not this record) -> url-checkable.
 * - `null`: no pattern applied.
 */
function patternHealth(
  appId: string,
  vars: { handle?: string; did?: string; rkey?: string },
  collection?: string,
): CardHealth {
  const patterns = APP_URL_PATTERNS[appId];
  if (!patterns) return { url: null, strategy: 'none' };

  if (patterns.urlPattern && shouldUseItemPattern(appId, collection)) {
    const url = interpolate(patterns.urlPattern, vars);
    if (url) return recordHealth(url);
  }
  if (patterns.profileUrlPattern) {
    const url = interpolate(patterns.profileUrlPattern, vars);
    if (url) return urlHealth(url);
  }
  return { url: null, strategy: 'none' };
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
 * Resolve the canonical clickable URL for an activity item **and** how its
 * liveness should be checked — the single source of truth shared by:
 * - sifa-web activity cards (which render `.url`), and
 * - the sifa-api link-health scanner (which switches on `.strategy`: probe the
 *   record's PDS for `record`-strategy cards, probe the URL for `url`).
 *
 * See {@link CardHealthStrategy} for why self-permalinks (bsky posts, etc.)
 * must be verified by record existence rather than an HTTP probe of the app.
 *
 * Resolution order:
 * 1. Per-collection bespoke logic (tangled, kipclip, margin, smokesignal
 *    rsvp, standard documents). These mirror the inline logic in the
 *    individual card components.
 * 2. Generic `record.url` field (used by hyperboards and similar).
 * 3. Pattern-based per-item / profile URL from the registry.
 */
export function resolveCardHealth(item: ActivityItemForUrl): CardHealth {
  const { collection, record, uri, rkey, authorDid, authorHandle } = item;
  const appId = getAppIdForCollection(collection);

  // --- Per-collection bespoke logic (mirrors the card components) ---

  // Tangled: prefer per-repo URL `https://tangled.sh/{handle}/{slug}`. The slug
  // is `record.name` (legacy format) or — when `name` is absent — the record's
  // rkey (newer repos use the slug as the rkey). The rkey fallback is scoped to
  // `sh.tangled.repo`; other tangled collections (e.g. feed.star) use TID rkeys
  // that are not repo slugs. Only when the slug is valid — multi-segment
  // aggregate names (whitespace, slashes, special chars) would 404. See
  // sifa-web#1071. The repo record itself is the card's subject, so it is
  // verified by the record's existence.
  if (collection.startsWith('sh.tangled.')) {
    const repoName = stringOrNull(record.name) ?? (collection === 'sh.tangled.repo' ? rkey : null);
    if (repoName && authorHandle && TANGLED_REPO_SLUG.test(repoName)) {
      return recordHealth(`https://tangled.sh/${authorHandle}/${repoName}`);
    }
    return patternHealth('tangled', { handle: authorHandle, did: authorDid, rkey }, collection);
  }

  // Kipclip / community.lexicon.bookmarks: the bookmark subject IS the URL —
  // a foreign page whose reachability is independent of the bookmark record.
  if (
    collection.startsWith('com.kipclip.') ||
    collection.startsWith('community.lexicon.bookmarks.')
  ) {
    const subject = stringOrNull(record.subject);
    if (subject) return urlHealth(subject);
    return patternHealth('kipclip', { handle: authorHandle, did: authorDid, rkey });
  }

  // Margin bookmark: card returns null entirely without record.source
  if (collection === 'at.margin.bookmark') {
    return urlHealth(stringOrNull(record.source));
  }

  // Margin note / annotation: both are W3C web annotations whose `target.source`
  // is the annotated page URL. Link to that source; fall back to the margin app.
  if (collection === 'at.margin.annotation' || collection === 'at.margin.note') {
    const target = record.target;
    if (target != null && typeof target === 'object') {
      const source = stringOrNull((target as Record<string, unknown>).source);
      if (source) return urlHealth(source);
    }
    return urlHealth(APP_URL_PATTERNS.margin?.profileUrlPattern ?? null);
  }

  // Community-calendar RSVP: parse the linked event uri. The URL points at a
  // *different* record (the event), so probe the URL, not this RSVP record.
  // Rendered via atmo.rsvp, which resolves any community.lexicon.calendar event
  // by did+rkey (Smoke Signal is decommissioned; its permalinks are retired).
  if (collection === 'community.lexicon.calendar.rsvp') {
    const subject = record.subject;
    if (subject != null && typeof subject === 'object') {
      const subjectUri = stringOrNull((subject as Record<string, unknown>).uri);
      if (subjectUri) {
        const parsed = parseAtUri(subjectUri);
        if (parsed) {
          return urlHealth(`https://atmo.rsvp/p/${parsed.did}/e/${parsed.rkey}`);
        }
      }
    }
    return { url: null, strategy: 'none' };
  }

  // Community-calendar event itself: use item's own uri -> self-permalink on
  // atmo.rsvp (same rationale as the RSVP block above).
  if (collection === 'community.lexicon.calendar.event') {
    const parsed = parseAtUri(uri);
    if (parsed) {
      return recordHealth(`https://atmo.rsvp/p/${parsed.did}/e/${parsed.rkey}`);
    }
    return { url: null, strategy: 'none' };
  }

  // atmo.rsvp event itself: use item's own uri -> self-permalink.
  if (collection === 'quest.atmo.event') {
    const parsed = parseAtUri(uri);
    if (parsed) {
      return recordHealth(`https://atmo.rsvp/p/${parsed.did}/e/${parsed.rkey}`);
    }
    return { url: null, strategy: 'none' };
  }

  // atmo.rsvp checkin: parse the linked event uri (record.event) and link to
  // that event's page (mirrors smokesignal rsvp). The URL points at a
  // *different* record (the event), so probe the URL. The checkin's own rkey is
  // not addressable, so without a valid event reference it's non-clickable.
  if (collection === 'quest.atmo.checkin') {
    const eventUri = stringOrNull(record.event);
    if (eventUri) {
      const parsed = parseAtUri(eventUri);
      if (parsed) {
        return urlHealth(`https://atmo.rsvp/p/${parsed.did}/e/${parsed.rkey}`);
      }
    }
    return { url: null, strategy: 'none' };
  }

  // atmoBB forum (atmobb.app): the universal viewer renders any thread at
  // /t/{thread-owner-did}/{thread-rkey}. A discussion reply has no own URL — it
  // lives inside its parent thread, so parse record.thread.uri and link there.
  // That URL points at a *different* record (the thread), so probe the URL.
  if (collection === 'app.atmobb.discussion.reply') {
    const thread = record.thread;
    if (thread != null && typeof thread === 'object') {
      const threadUri = stringOrNull((thread as Record<string, unknown>).uri);
      if (threadUri) {
        const parsed = parseAtUri(threadUri);
        if (parsed) {
          return urlHealth(`https://atmobb.app/t/${parsed.did}/${parsed.rkey}`);
        }
      }
    }
    return { url: null, strategy: 'none' };
  }

  // atmoBB thread itself: build the per-thread URL from the item's own uri — a
  // self-permalink for this record (record-checkable). Other app.atmobb.*
  // collections (actor.profile, forum.*) are excluded upstream by sifa-api and
  // never reach the resolver.
  if (collection === 'app.atmobb.discussion.thread') {
    const parsed = parseAtUri(uri);
    if (parsed) {
      return recordHealth(`https://atmobb.app/t/${parsed.did}/${parsed.rkey}`);
    }
    return { url: null, strategy: 'none' };
  }

  // atstore reviews: no per-review URL exists on atstore.fyi, and user profile
  // pages don't exist either. Deep-link to the reviewed product instead.
  // The slug comes from record.listingMeta (enriched by sifa-api from the
  // review's `subject` at-uri → fyi.atstore.listing.detail record). The product
  // page is a *different* subject, so probe the URL.
  if (collection === 'fyi.atstore.listing.review') {
    const listingMeta = record.listingMeta;
    if (listingMeta != null && typeof listingMeta === 'object') {
      const slug = stringOrNull((listingMeta as Record<string, unknown>).slug);
      if (slug) return urlHealth(`https://atstore.fyi/products/${encodeURIComponent(slug)}`);
    }
    return urlHealth(APP_URL_PATTERNS.atstore?.profileUrlPattern ?? null);
  }

  // Crate content: link to the canonical published location the maker
  // recorded (a YouTube/podcast/personal-site URL) — a foreign page. Crate is
  // an authoring dashboard with no public per-record viewer, so `note`
  // records — which carry no canonicalUrl — render non-clickable (null).
  if (collection === 'social.crate.content') {
    return urlHealth(stringOrNull(record.canonicalUrl));
  }
  if (collection === 'social.crate.note') {
    return { url: null, strategy: 'none' };
  }

  // Standard documents: siteUrl + path (or just siteUrl) — an external site.
  if (collection.startsWith('site.standard.')) {
    const siteUrl = stringOrNull(record.siteUrl);
    const path = stringOrNull(record.path);
    if (siteUrl && path) return urlHealth(`${siteUrl}${path}`);
    if (siteUrl) return urlHealth(siteUrl);
    // Fall through to generic record.url / patterns
  }

  // Kich recipe: always link to the Kich recipe page. record.url is the
  // *source* the recipe was imported from (a YouTube video, a blog), which the
  // card shows as secondary attribution — not the primary link. Must run before
  // the generic record.url fallback below, which would otherwise hijack it. The
  // recipe page is a first-party permalink for this record.
  if (collection === 'io.kich.recipe.recipe') {
    return patternHealth('kich', { handle: authorHandle, did: authorDid, rkey }, collection);
  }

  // recipe.exchange: same shape as Kich — the record's attribution.url points
  // at the original source (a blog/video), not the app. Always link to the
  // recipe.exchange page. Must run before the generic fallback below.
  if (collection === 'exchange.recipe.recipe') {
    return patternHealth('recipe', { handle: authorHandle, did: authorDid, rkey }, collection);
  }

  // --- Generic fallbacks ---

  // record.url is a common ad-hoc per-item URL (hyperboards, etc.). It is an
  // arbitrary foreign URL, so probe it directly.
  const recordUrl = stringOrNull(record.url);
  if (recordUrl) return urlHealth(recordUrl);

  // Pattern-based fallback. Pass `collection` so app-specific guards (bluesky
  // restricting /post/{rkey} to app.bsky.feed.post) can apply. The tier
  // (per-item vs profile) decides record- vs url-strategy.
  return patternHealth(appId, { handle: authorHandle, did: authorDid, rkey }, collection);
}

/**
 * Resolve the canonical clickable URL for an activity item — the same URL
 * the activity-card UI in sifa-web renders. Thin wrapper over
 * {@link resolveCardHealth}; returns `null` when no link is appropriate.
 */
export function resolveCardUrl(item: ActivityItemForUrl): string | null {
  return resolveCardHealth(item).url;
}
