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

function patternUrl(
  appId: string,
  vars: { handle?: string; did?: string; rkey?: string },
): string | null {
  const patterns = APP_URL_PATTERNS[appId];
  if (!patterns) return null;

  if (patterns.urlPattern) {
    const url = interpolate(patterns.urlPattern, vars);
    if (url) return url;
  }
  if (patterns.profileUrlPattern) {
    const url = interpolate(patterns.profileUrlPattern, vars);
    if (url) return url;
  }
  return null;
}

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

  // Tangled: prefer per-repo URL `https://tangled.sh/{handle}/{record.name}`
  if (collection.startsWith('sh.tangled.')) {
    const repoName = stringOrNull(record.name);
    if (repoName && authorHandle) {
      return `https://tangled.sh/${authorHandle}/${repoName}`;
    }
    return patternUrl('tangled', { handle: authorHandle, did: authorDid, rkey });
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

  // Pattern-based fallback
  return patternUrl(appId, { handle: authorHandle, did: authorDid, rkey });
}
