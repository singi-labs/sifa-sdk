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
 * The primary content body. A small discriminated union so both the React and
 * the string-HTML renderer switch on one field. `track` is reserved (dame
 * music scrobbles; no sifa-web card uses it yet). App-specific variants
 * (github-pr, book, event-rsvp, ...) layer in additively in later milestones.
 */
export type StreamCardBody =
  | { kind: 'text'; text: string }
  | { kind: 'media'; text?: string }
  | { kind: 'link'; text?: string }
  | { kind: 'track'; text?: string; trackTitle?: string; artist?: string }
  | { kind: 'generic'; text?: string };

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
  body?: StreamCardBody;
  media?: StreamMedia[];
  externalLink?: StreamExternalLink;
  theme?: StreamTheme;
  subject?: StreamCardSubject;
}
