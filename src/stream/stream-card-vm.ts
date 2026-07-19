import type { RgbColor } from '../format/wcag-contrast.js';
import type { ActivityTier } from '../taxonomy/activity-tiers.js';
import type { StreamVerb } from './verbs.js';

/**
 * The app a stream item originated from, resolved from the app registry.
 * `color` is a design-token NAME (e.g. `slate`), never a hex literal — each
 * surface maps the token to a concrete value.
 */
export interface StreamSource {
  appId: string;
  label: string;
  color: string;
}

/**
 * A per-item theme distinct from the app-registry `source.color`. Publication
 * and standard-site cards carry a record-level RGB theme (WCAG-AA validated
 * before use). Absent for most items.
 */
export interface StreamTheme {
  background: RgbColor;
  foreground: RgbColor;
  accent: RgbColor;
}

/** Fields shared by every media variant. */
export interface StreamMediaBase {
  alt: string;
  aspectRatio?: { width: number; height: number };
  mimeType?: string;
}

/** A media item whose URL is already resolved (e.g. a poster URL). */
export interface StreamMediaResolved extends StreamMediaBase {
  url: string;
}

/**
 * A media item carried as a raw blob ref. The transform stays host-agnostic
 * and pure — it does NOT build CDN URLs. Each surface constructs the URL from
 * `did` + `cid` itself (sifa-web via `buildBlobUrl`, page.sifa.id via its own
 * CDN base).
 */
export interface StreamMediaBlob extends StreamMediaBase {
  did: string;
  cid: string;
}

export type StreamMedia = StreamMediaResolved | StreamMediaBlob;

/** An outbound link card (Bluesky external embed, bookmark subject, etc.). */
export interface StreamExternalLink {
  url: string;
  title?: string;
  thumb?: string;
}

/**
 * One span of a rich-text body. Built from `app.bsky.richtext.facet`-style
 * facets (byte-offset ranges over the plain `text`). Plain runs carry only
 * `text`; enriched runs additionally carry exactly one of `link` (resolved
 * URL), `mention` (DID), or `tag` (hashtag). `body.text` always holds the full
 * plain string, so a renderer can ignore `richSegments` and still show content.
 */
export interface StreamRichSegment {
  text: string;
  link?: string;
  mention?: string;
  tag?: string;
}

/** A geo coordinate pair (beacon `location`). */
export interface StreamGeo {
  latitude: number;
  longitude: number;
}

/** A structured postal address (beacon `addressDetails`). All parts optional. */
export interface StreamAddress {
  name?: string;
  street?: string;
  locality?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

/**
 * The primary content body. A small discriminated union so both the React and
 * the string-HTML renderer switch on one field. `track` is reserved (dame
 * music scrobbles; no sifa-web card uses it yet). The app-specific variants
 * (`github-pr`, `book`, ...) carry only structured data — enums, raw NSIDs,
 * dates, blob/URL refs — never pre-localized strings or built URLs, so each
 * surface renders identically.
 */
export type StreamCardBody =
  | {
      kind: 'text';
      text: string;
      /** Facet-derived spans over `text` (links/mentions/tags). Additive. */
      richSegments?: StreamRichSegment[];
      /** Hashtags carried alongside the text (e.g. asq questions). */
      tags?: string[];
    }
  | { kind: 'media'; text?: string; tags?: string[] }
  | { kind: 'link'; text?: string; tags?: string[] }
  | { kind: 'track'; text?: string; trackTitle?: string; artist?: string }
  | { kind: 'generic'; text?: string; tags?: string[] }
  // github.pull_request — a merged pull request with diff stats.
  | {
      kind: 'github-pr';
      repoOwner: string;
      repoName: string;
      prNumber: number;
      title: string;
      url?: string;
      /** GitHub language name (renderer maps to a color dot). */
      language?: string;
      additions: number;
      deletions: number;
      /** The card's display date is `mergedAt`, not `createdAt`. */
      mergedAt?: string;
    }
  // buzz.bookhive.book — a book log with an optional review and rating.
  | {
      kind: 'book';
      title: string;
      authors: string[];
      /** Rating on the lexicon's 1-10 scale. */
      stars?: number;
      /** Raw reading-status NSID, e.g. `buzz.bookhive.defs#finished`. */
      status?: string;
      review?: string;
    }
  // social.popfeed.feed.{post,note,review} — a media review / post / note.
  | {
      kind: 'media-review';
      /** Which popfeed collection this came from (drives the action label). */
      reviewKind: 'review' | 'post' | 'note' | 'other';
      title?: string;
      /** Raw creative-work type, e.g. `movie` (renderer maps to a label + icon). */
      mediaType?: string;
      /** Rating on the 1-10 scale. */
      rating?: number;
      mainCredit?: string;
      reviewText?: string;
      isRevisit: boolean;
    }
  // community.lexicon.calendar.rsvp — an RSVP to a calendar event.
  | {
      kind: 'event-rsvp';
      rsvpStatus: 'going' | 'interested' | 'notgoing' | 'unknown';
      eventName?: string;
      startsAt?: string;
      endsAt?: string;
      mode?: 'inperson' | 'virtual' | 'hybrid';
      locationName?: string;
      locationLocality?: string;
      locationCountry?: string;
    }
  // dev.keytrace.claim + app.bsky.graph.verification — an identity verification.
  | {
      kind: 'verification';
      /** Keytrace claim type (`github`, `dns`, ...) or `bluesky` for a bsky verification. */
      platform: string;
      verified: boolean;
      subjectLabel?: string;
      /** The verified handle (Bluesky verifications only). */
      handle?: string;
      profileUrl?: string;
    }
  // social.colibri.membership — joining a Colibri community.
  | {
      kind: 'membership';
      communityName?: string;
      description?: string;
      /** The community record's at-uri (renderer builds the outbound link). */
      communityUri?: string;
    }
  // app.beaconbits.beacon — a location check-in.
  | {
      kind: 'location';
      venueName?: string;
      shout?: string;
      address?: StreamAddress;
      geo?: StreamGeo;
    }
  // social.passports.travel.leg — a travel leg between two points.
  | {
      kind: 'travel';
      origin?: string;
      destination?: string;
      /** Raw transportation mode, e.g. `flight` (renderer maps to a label). */
      transportation?: string;
      carrier?: string;
      carrierCode?: string;
      startDate?: string;
      endDate?: string;
    }
  // site.standard.document — a Standard.site publication document.
  | {
      kind: 'standard-site';
      title?: string;
      description?: string;
      /** Publication base URL (renderer derives host / builds the canonical link). */
      siteUrl?: string;
      path?: string;
      /** Resolved from the publisher registry when the host is allowlisted. */
      publisherName?: string;
      /** Publication icon — a resolved CDN URL added by AppView enrichment. */
      icon?: string;
      /** Document cover — a resolved CDN URL added by AppView enrichment. */
      coverImageUrl?: string;
      /** Estimated reading time in minutes. */
      readingTime?: number;
      publishedAt?: string;
    };

/**
 * A repost / reply / quote target. Three shapes: a full post (normalized
 * through the same transform), a person (DID → hydrated client-side), or a
 * bare referenced record (e.g. the question an answer replies to).
 */
export type StreamCardSubject =
  | { kind: 'post'; post: StreamCardVM }
  | { kind: 'person'; did: string; handle?: string; displayName?: string; avatar?: string }
  | { kind: 'record'; uri: string; title?: string };

/**
 * Presentation-ready, framework-free, serializable view-model for one activity
 * item. Produced by {@link toStreamCardVM}. Common chrome fields are always
 * present; `body` is a discriminated union both renderers switch on.
 */
export interface StreamCardVM {
  /** at-uri: stable key + permalink source. */
  uri: string;
  cid: string;
  verb: StreamVerb;
  source: StreamSource;
  tier: ActivityTier;
  /** ISO 8601. Record `createdAt` when present, else the AppView index time. */
  timestamp: string;
  /** Human sentence fragment, verb-aware. */
  title: string;
  /**
   * Canonical http(s) permalink to this record on its source app (e.g. a
   * Bluesky post's `bsky.app` URL). Absent when no linkable URL is available —
   * see {@link resolveCardUrl}, which keys some apps on the author handle the
   * transform may not have. Consumers use this to make the card click through.
   */
  sourceUrl?: string;
  body?: StreamCardBody;
  media?: StreamMedia[];
  externalLink?: StreamExternalLink;
  theme?: StreamTheme;
  subject?: StreamCardSubject;
}
