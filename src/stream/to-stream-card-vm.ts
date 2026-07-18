import { isVisibleActivityItem } from '../cards/visibility.js';
import { isValidRgbColor } from '../format/wcag-contrast.js';
import { matchPublisherByUri } from '../publishing/index.js';
import { getActivityTier } from '../taxonomy/activity-tiers.js';
import type { ActivityItem } from './activity-item.js';
import type {
  StreamAddress,
  StreamCardBody,
  StreamCardSubject,
  StreamCardVM,
  StreamExternalLink,
  StreamGeo,
  StreamMedia,
  StreamRichSegment,
  StreamSource,
  StreamTheme,
} from './stream-card-vm.js';
import { verbForCollection, type StreamVerb } from './verbs.js';

/** Neutral fallback token — matches sifa-api's synthetic app-registry entry. */
const DEFAULT_SOURCE_COLOR = 'slate';

/**
 * Options for {@link toStreamCardVM}. Kept out of the record so the transform
 * stays pure (no I/O): the app registry is runtime data, so callers inject a
 * color resolver built from the registry they already fetched.
 */
export interface ToStreamCardVMOptions {
  /**
   * Resolve an app's design-token color NAME (not a hex literal) from its
   * appId. Falls back to `slate` when unresolved.
   */
  resolveSourceColor?: (appId: string) => string | undefined;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** at://did:plc:xxx/collection/rkey → the authoring DID. */
function didFromUri(uri: string): string | undefined {
  const match = uri.match(/^at:\/\/(did:[^/]+)\//);
  return match?.[1];
}

/** Extract the CID from an AT Protocol blob ref (`ref.$link` or a bare string). */
function blobCid(blob: unknown): string | undefined {
  const rec = asRecord(blob);
  if (!rec) return undefined;
  const ref = rec.ref;
  if (typeof ref === 'string') return ref;
  const link = asRecord(ref)?.['$link'];
  return typeof link === 'string' ? link : undefined;
}

function aspectRatio(value: unknown): { width: number; height: number } | undefined {
  const rec = asRecord(value);
  const width = rec?.width;
  const height = rec?.height;
  if (typeof width === 'number' && typeof height === 'number') return { width, height };
  return undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Extract a blob CID tolerating both a proper blob (`ref.$link`) and the
 * denormalized `{ cid }` shape some apps (BookHive, Colibri) store.
 */
function looseBlobCid(value: unknown): string | undefined {
  const viaRef = blobCid(value);
  if (viaRef) return viaRef;
  const cid = asRecord(value)?.cid;
  return typeof cid === 'string' && cid.length > 0 ? cid : undefined;
}

/** A single blob-ref media item from a blob value, or undefined when absent. */
function blobMedia(value: unknown, did: string, alt: string): StreamMedia | undefined {
  const cid = looseBlobCid(value);
  if (!cid) return undefined;
  const media: StreamMedia = { did, cid, alt };
  const ratio = aspectRatio(asRecord(value)?.aspectRatio);
  if (ratio) media.aspectRatio = ratio;
  const mimeType = asNonEmptyString(asRecord(value)?.mimeType);
  if (mimeType) media.mimeType = mimeType;
  return media;
}

/** The `#suffix` of an NSID-with-hash value (`x#going` → `#going`), else ''. */
function hashSuffix(value: string): string {
  const i = value.lastIndexOf('#');
  return i >= 0 ? value.slice(i) : '';
}

const WORDS_PER_MINUTE = 200;

/** Estimated reading time in minutes from body text (matches sifa-web). */
function estimateReadingTime(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return undefined;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Parse a beacon `location` into numeric geo. Lat/long may be string or number. */
function beaconGeo(value: unknown): StreamGeo | undefined {
  const rec = asRecord(value);
  if (!rec) return undefined;
  const { latitude, longitude } = rec;
  const okType = (v: unknown): v is string | number =>
    typeof v === 'string' || typeof v === 'number';
  if (!okType(latitude) || !okType(longitude)) return undefined;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { latitude: lat, longitude: lng };
}

/** Parse a beacon `addressDetails` into a structured address, or undefined. */
function beaconAddress(value: unknown): StreamAddress | undefined {
  const rec = asRecord(value);
  if (!rec) return undefined;
  const address: StreamAddress = {};
  const name = asNonEmptyString(rec.name);
  if (name) address.name = name;
  const street = asNonEmptyString(rec.street);
  if (street) address.street = street;
  const locality = asNonEmptyString(rec.locality);
  if (locality) address.locality = locality;
  const region = asNonEmptyString(rec.region);
  if (region) address.region = region;
  const country = asNonEmptyString(rec.country);
  if (country) address.country = country;
  const postalCode = asNonEmptyString(rec.postalCode);
  if (postalCode) address.postalCode = postalCode;
  return Object.keys(address).length > 0 ? address : undefined;
}

/** Split BookHive's tab-separated authors into a trimmed, non-empty list. */
function parseAuthors(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split('\t')
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function buildSource(item: ActivityItem, options: ToStreamCardVMOptions): StreamSource {
  return {
    appId: item.appId,
    label: item.appName,
    color: options.resolveSourceColor?.(item.appId) ?? DEFAULT_SOURCE_COLOR,
  };
}

const TITLE_BY_VERB: Record<StreamVerb, (label: string) => string> = {
  posted: (label) => `Posted on ${label}`,
  reposted: () => 'Reposted a post',
  published: (label) => `Published on ${label}`,
  presented: () => 'Gave a presentation',
  endorsed: () => 'Wrote an endorsement',
  joined: (label) => `Joined ${label}`,
  shipped: (label) => `Shipped on ${label}`,
  created: (label) => `Created a record on ${label}`,
};

function buildTitle(verb: StreamVerb, label: string): string {
  return TITLE_BY_VERB[verb](label);
}

/** Per-record RGB theme (publication / standard-site cards). Validated. */
function readTheme(record: Record<string, unknown> | null): StreamTheme | undefined {
  const theme = asRecord(record?.publicationTheme ?? record?.theme);
  if (!theme) return undefined;
  const { background, foreground, accent } = theme;
  if (isValidRgbColor(background) && isValidRgbColor(foreground) && isValidRgbColor(accent)) {
    return { background, foreground, accent };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Bluesky post body
// ---------------------------------------------------------------------------

function bskyImages(embed: Record<string, unknown>, did: string): StreamMedia[] {
  const images = embed.images;
  if (!Array.isArray(images)) return [];
  const out: StreamMedia[] = [];
  for (const raw of images) {
    const img = asRecord(raw);
    if (!img) continue;
    const cid = blobCid(img.image);
    if (!cid) continue;
    const media: StreamMedia = { did, cid, alt: asNonEmptyString(img.alt) ?? '' };
    const ratio = aspectRatio(img.aspectRatio);
    if (ratio) media.aspectRatio = ratio;
    const mimeType = asNonEmptyString(asRecord(img.image)?.mimeType);
    if (mimeType) media.mimeType = mimeType;
    out.push(media);
  }
  return out;
}

function bskyExternal(embed: Record<string, unknown>): StreamExternalLink | undefined {
  const external = asRecord(embed.external);
  if (!external) return undefined;
  const url = asNonEmptyString(external.uri);
  if (!url) return undefined;
  const link: StreamExternalLink = { url };
  const title = asNonEmptyString(external.title);
  if (title) link.title = title;
  // The raw record's `external.thumb` is a blob, not a URL. Resolving it would
  // require building a CDN URL, which is a surface concern — leave `thumb`
  // unset for now (M2 widens externalLink to carry blob refs if needed).
  return link;
}

interface BskyEmbedContent {
  media?: StreamMedia[];
  externalLink?: StreamExternalLink;
}

function bskyEmbedContent(record: Record<string, unknown>, did: string): BskyEmbedContent {
  const embed = asRecord(record.embed);
  if (!embed) return {};

  // recordWithMedia wraps the media (images/external) alongside a quoted record.
  const type = asNonEmptyString(embed['$type']);
  const target = type === 'app.bsky.embed.recordWithMedia' ? asRecord(embed.media) : embed;
  if (!target) return {};

  if (Array.isArray(target.images)) {
    const media = bskyImages(target, did);
    return media.length > 0 ? { media } : {};
  }
  if (target.external != null) {
    const externalLink = bskyExternal(target);
    return externalLink ? { externalLink } : {};
  }
  return {};
}

function applyBskyPost(
  vm: StreamCardVM,
  item: ActivityItem,
  record: Record<string, unknown> | null,
): StreamCardVM {
  if (!record) {
    vm.body = { kind: 'generic' };
    return vm;
  }

  const did = didFromUri(item.uri);
  const text = asNonEmptyString(record.text);
  const { media, externalLink } = did ? bskyEmbedContent(record, did) : {};
  if (media) vm.media = media;
  if (externalLink) vm.externalLink = externalLink;

  let body: StreamCardBody;
  if (text) body = { kind: 'text', text };
  else if (vm.media) body = { kind: 'media' };
  else if (vm.externalLink) body = { kind: 'link' };
  else body = { kind: 'generic' };
  vm.body = body;
  return vm;
}

// ---------------------------------------------------------------------------
// App-specific body variants
// ---------------------------------------------------------------------------

/** Fall back to a generic body when the record is missing/invalid. */
function withGeneric(vm: StreamCardVM): StreamCardVM {
  vm.body = { kind: 'generic' };
  return vm;
}

function applyGithubPr(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const body: Extract<StreamCardBody, { kind: 'github-pr' }> = {
    kind: 'github-pr',
    repoOwner: asNonEmptyString(record.repoOwner) ?? '',
    repoName: asNonEmptyString(record.repoName) ?? '',
    prNumber: asFiniteNumber(record.prNumber) ?? 0,
    title: asNonEmptyString(record.title) ?? '',
    additions: asFiniteNumber(record.additions) ?? 0,
    deletions: asFiniteNumber(record.deletions) ?? 0,
  };
  const url = asNonEmptyString(record.url);
  if (url) body.url = url;
  const language = asNonEmptyString(record.language);
  if (language) body.language = language;
  const mergedAt = asNonEmptyString(record.mergedAt);
  if (mergedAt) body.mergedAt = mergedAt;
  vm.body = body;
  return vm;
}

function applyBook(
  vm: StreamCardVM,
  item: ActivityItem,
  record: Record<string, unknown>,
): StreamCardVM {
  const title = asNonEmptyString(record.title) ?? 'Untitled book';
  const body: Extract<StreamCardBody, { kind: 'book' }> = {
    kind: 'book',
    title,
    authors: parseAuthors(record.authors),
  };
  const stars = asFiniteNumber(record.stars);
  if (stars !== undefined && stars > 0) body.stars = stars;
  const status = asNonEmptyString(record.status);
  if (status) body.status = status;
  const review = asNonEmptyString(
    typeof record.review === 'string' ? record.review.trim() : undefined,
  );
  if (review) body.review = review;
  vm.body = body;

  const did = didFromUri(item.uri);
  if (did) {
    const cover = blobMedia(record.cover, did, `The cover of ${title}`);
    if (cover) vm.media = [cover];
  }
  return vm;
}

function popfeedReviewKind(collection: string): 'review' | 'post' | 'note' | 'other' {
  if (collection.endsWith('.review')) return 'review';
  if (collection.endsWith('.post')) return 'post';
  if (collection.endsWith('.note')) return 'note';
  return 'other';
}

function applyMediaReview(
  vm: StreamCardVM,
  item: ActivityItem,
  record: Record<string, unknown>,
): StreamCardVM {
  const title = asNonEmptyString(record.title) ?? asNonEmptyString(record.name);
  const body: Extract<StreamCardBody, { kind: 'media-review' }> = {
    kind: 'media-review',
    reviewKind: popfeedReviewKind(item.collection),
    isRevisit: record.isRevisit === true,
  };
  if (title) body.title = title;
  const mediaType = asNonEmptyString(record.creativeWorkType);
  if (mediaType) body.mediaType = mediaType;
  const rating = asFiniteNumber(record.rating);
  if (rating !== undefined) body.rating = rating;
  const mainCredit = asNonEmptyString(record.mainCredit);
  if (mainCredit) body.mainCredit = mainCredit;
  const reviewText = asNonEmptyString(record.text);
  if (reviewText) body.reviewText = reviewText;
  vm.body = body;

  const posterUrl = asNonEmptyString(record.posterUrl);
  if (posterUrl) vm.media = [{ url: posterUrl, alt: title ? `${title} poster` : '' }];
  return vm;
}

const RSVP_STATUS: Record<string, 'going' | 'interested' | 'notgoing'> = {
  '#going': 'going',
  '#interested': 'interested',
  '#notgoing': 'notgoing',
};

const RSVP_MODE: Record<string, 'inperson' | 'virtual' | 'hybrid'> = {
  '#inperson': 'inperson',
  '#virtual': 'virtual',
  '#hybrid': 'hybrid',
};

function applyEventRsvp(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const status = asNonEmptyString(record.status);
  const body: Extract<StreamCardBody, { kind: 'event-rsvp' }> = {
    kind: 'event-rsvp',
    rsvpStatus: (status ? RSVP_STATUS[hashSuffix(status)] : undefined) ?? 'unknown',
  };
  const meta = asRecord(record.eventMeta);
  if (meta) {
    const eventName = asNonEmptyString(meta.name);
    if (eventName) body.eventName = eventName;
    const startsAt = asNonEmptyString(meta.startsAt);
    if (startsAt) body.startsAt = startsAt;
    const endsAt = asNonEmptyString(meta.endsAt);
    if (endsAt) body.endsAt = endsAt;
    const mode = asNonEmptyString(meta.mode);
    const modeEnum = mode ? RSVP_MODE[hashSuffix(mode)] : undefined;
    if (modeEnum) body.mode = modeEnum;
    const locationName = asNonEmptyString(meta.locationName);
    if (locationName) body.locationName = locationName;
    const locationLocality = asNonEmptyString(meta.locationLocality);
    if (locationLocality) body.locationLocality = locationLocality;
    const locationCountry = asNonEmptyString(meta.locationCountry);
    if (locationCountry) body.locationCountry = locationCountry;
  }
  vm.body = body;
  return vm;
}

function applyKeytraceVerification(
  vm: StreamCardVM,
  record: Record<string, unknown>,
): StreamCardVM {
  const identity = asRecord(record.identity) ?? {};
  const subject = asNonEmptyString(identity.subject);
  const displayName = asNonEmptyString(identity.displayName);
  const body: Extract<StreamCardBody, { kind: 'verification' }> = {
    kind: 'verification',
    platform: asNonEmptyString(record.type) ?? 'unknown',
    verified: record.status === 'verified',
  };
  const subjectLabel = displayName ?? subject;
  if (subjectLabel) body.subjectLabel = subjectLabel;
  const profileUrl = asNonEmptyString(identity.profileUrl);
  if (profileUrl) body.profileUrl = profileUrl;
  vm.body = body;
  return vm;
}

function applyBskyVerification(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const handle = asNonEmptyString(record.handle);
  const displayName = asNonEmptyString(record.displayName);
  const body: Extract<StreamCardBody, { kind: 'verification' }> = {
    kind: 'verification',
    platform: 'bluesky',
    verified: true,
  };
  const subjectLabel = displayName ?? handle;
  if (subjectLabel) body.subjectLabel = subjectLabel;
  if (handle) body.handle = handle;
  vm.body = body;
  return vm;
}

function applyMembership(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const body: Extract<StreamCardBody, { kind: 'membership' }> = { kind: 'membership' };
  const communityUri = asNonEmptyString(record.community);
  if (communityUri) body.communityUri = communityUri;

  const meta = asRecord(record.communityMeta);
  const communityName = meta ? asNonEmptyString(meta.name) : undefined;
  if (communityName) body.communityName = communityName;
  const description = meta ? asNonEmptyString(meta.description) : undefined;
  if (description) body.description = description;
  vm.body = body;

  if (meta) {
    const ownerDid =
      asNonEmptyString(meta.ownerDid) ?? (communityUri ? didFromUri(communityUri) : undefined);
    if (ownerDid) {
      const picture = blobMedia(meta.picture, ownerDid, communityName ?? '');
      if (picture) vm.media = [picture];
    }
  }
  return vm;
}

function applyLocation(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const body: Extract<StreamCardBody, { kind: 'location' }> = { kind: 'location' };
  const venueName = asNonEmptyString(record.venueName);
  if (venueName) body.venueName = venueName;
  const shout = asNonEmptyString(record.shout);
  if (shout) body.shout = shout;
  const address = beaconAddress(record.addressDetails);
  if (address) body.address = address;
  const geo = beaconGeo(record.location);
  if (geo) body.geo = geo;
  vm.body = body;
  return vm;
}

function applyTravel(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const body: Extract<StreamCardBody, { kind: 'travel' }> = { kind: 'travel' };
  const origin = asNonEmptyString(record.originTransportCode);
  if (origin) body.origin = origin;
  const destination = asNonEmptyString(record.destinationTransportCode);
  if (destination) body.destination = destination;
  const transportation = asNonEmptyString(record.transportation);
  if (transportation) body.transportation = transportation;
  const carrier = asNonEmptyString(record.carrier);
  if (carrier) body.carrier = carrier;
  const carrierCode = asNonEmptyString(record.carrierCode);
  if (carrierCode) body.carrierCode = carrierCode;
  const startDate = asNonEmptyString(record.startDate);
  if (startDate) body.startDate = startDate;
  const endDate = asNonEmptyString(record.endDate);
  if (endDate) body.endDate = endDate;
  vm.body = body;
  return vm;
}

function applyStandardSite(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const body: Extract<StreamCardBody, { kind: 'standard-site' }> = { kind: 'standard-site' };
  const title = asNonEmptyString(record.title);
  if (title) body.title = title;
  const description = asNonEmptyString(record.description);
  if (description) body.description = description;
  const siteUrl = asNonEmptyString(record.siteUrl);
  if (siteUrl) {
    body.siteUrl = siteUrl;
    const publisherName = matchPublisherByUri(siteUrl)?.name;
    if (publisherName) body.publisherName = publisherName;
  }
  const path = asNonEmptyString(record.path);
  if (path) body.path = path;
  const icon = asNonEmptyString(record.publicationIcon);
  if (icon) body.icon = icon;
  const coverImageUrl = asNonEmptyString(record.coverImageUrl);
  if (coverImageUrl) body.coverImageUrl = coverImageUrl;
  const readingTime = estimateReadingTime(asNonEmptyString(record.textContent));
  if (readingTime !== undefined) body.readingTime = readingTime;
  const publishedAt = asNonEmptyString(record.publishedAt);
  if (publishedAt) body.publishedAt = publishedAt;
  vm.body = body;
  return vm;
}

/** at.youandme.connection: the record's `subject` is a bare person DID. */
function applyYouAndMe(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const did = asNonEmptyString(record.subject);
  if (did) vm.subject = { kind: 'person', did };
  vm.body = { kind: 'generic' };
  return vm;
}

/** fyi.asq.answer: the record's `subject.uri` is the answered question. */
function applyAsqAnswer(vm: StreamCardVM, record: Record<string, unknown>): StreamCardVM {
  const uri = asNonEmptyString(asRecord(record.subject)?.uri);
  if (uri) vm.subject = { kind: 'record', uri };
  vm.body = { kind: 'generic' };
  return vm;
}

// ---------------------------------------------------------------------------
// Generic content extraction (base collections + unknown / future apps)
// ---------------------------------------------------------------------------
//
// Collections without a typed body variant (Margin, Tangled, KipClip, Grain,
// asq questions, Semble, Passports fifty-states, Streamplace, and every
// unrecognized/future app) fall here. The rules below are GROUNDED in the
// sifa-web card sources so each base collection reproduces the visible content
// its dedicated card renders; for genuinely unknown records the same shapes act
// as a best-effort heuristic, degrading to an empty generic body when a record
// carries no recognizable text, media, link, or subject.

/** A string with at least one non-whitespace character, else undefined. */
function nonBlankString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/** Read a `body` field that is a plain string OR `{ value: string }` (Margin). */
function readBodyField(value: unknown): string | undefined {
  const direct = nonBlankString(value);
  if (direct) return direct;
  return nonBlankString(asRecord(value)?.value);
}

/** An http(s) URL string, else undefined. */
function httpUrl(value: unknown): string | undefined {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : undefined;
}

/**
 * Ordered human-visible text fields. `body` (handled specially for the
 * `{ value }` shape) sits between `content` and `message`. Mirrors the union of
 * fields the base cards read (generic `text|title|name|description|content`,
 * Tangled `name|title|text|message`, Margin `body`, asq `title|body`).
 */
const GENERIC_TEXT_ORDER = [
  'text',
  'title',
  'name',
  'description',
  'content',
  'body',
  'message',
  'note',
  'caption',
  'summary',
  'status',
] as const;

/** The record's primary human-visible text, or undefined. */
function genericText(collection: string, record: Record<string, unknown>): string | undefined {
  // Passports fifty-states carries no free-text field — its card composes
  // "Visited {city}, {state}". Only `city` is a real record string; the state
  // name mapping (US-NC → North Carolina) and the verb are surface concerns, so
  // the VM text is just the city (intentionally partial, never invented).
  if (collection === 'social.passports.fiftyStates.visit') {
    return nonBlankString(record.city);
  }
  for (const field of GENERIC_TEXT_ORDER) {
    if (field === 'body') {
      const body = readBodyField(record.body);
      if (body) return body;
      continue;
    }
    const value = nonBlankString(record[field]);
    if (value) return value;
  }
  return undefined;
}

/** Non-empty string tags off `record.tags`, or undefined. */
function genericTags(record: Record<string, unknown>): string[] | undefined {
  const tags = record.tags;
  if (!Array.isArray(tags)) return undefined;
  const out = tags.filter((t): t is string => typeof t === 'string' && t.length > 0);
  return out.length > 0 ? out : undefined;
}

/**
 * Blob-ref image media from the common record shapes (reuses M1's blob helpers;
 * never builds a URL). Prefers an `images[]` / `embed.images[]` array (all
 * valid items), then single-blob fields, then Grain's bare `galleryMeta
 * .coverPhotoCid`.
 */
function genericMedia(record: Record<string, unknown>, did: string, alt: string): StreamMedia[] {
  const fromArray = (raw: unknown): StreamMedia | undefined => {
    const img = asRecord(raw);
    if (!img) return undefined;
    return blobMedia(img.image ?? raw, did, asNonEmptyString(img.alt) ?? alt);
  };

  const images = record.images;
  if (Array.isArray(images)) {
    const out = images.map(fromArray).filter((m): m is StreamMedia => m !== undefined);
    if (out.length > 0) return out;
  }

  const embed = asRecord(record.embed);
  if (embed && Array.isArray(embed.images)) {
    const out = embed.images.map(fromArray).filter((m): m is StreamMedia => m !== undefined);
    if (out.length > 0) return out;
  }

  const single =
    blobMedia(record.image, did, alt) ??
    blobMedia(record.thumbnail, did, alt) ??
    blobMedia(record.thumb, did, alt) ??
    blobMedia(record.photo, did, alt) ??
    (embed ? blobMedia(embed.thumbnail, did, alt) : undefined);
  if (single) return [single];

  // Grain galleries store the cover as a bare CID string, not a blob object.
  const coverCid = asRecord(record.galleryMeta)?.coverPhotoCid;
  if (typeof coverCid === 'string' && coverCid.length > 0) {
    return [{ did, cid: coverCid, alt }];
  }
  return [];
}

/**
 * An outbound link from the common shapes: a Bluesky-style `embed.external`,
 * then a bare URL in `source` (Margin bookmark), `subject` (KipClip), or `url`.
 */
function genericExternalLink(record: Record<string, unknown>): StreamExternalLink | undefined {
  const embed = asRecord(record.embed);
  if (embed) {
    const fromEmbed = bskyExternal(embed);
    if (fromEmbed) return fromEmbed;
  }
  const url = httpUrl(record.source) ?? httpUrl(record.subject) ?? httpUrl(record.url);
  return url ? { url } : undefined;
}

/**
 * A reply/quote/answer target from common reference shapes: `subject` as an
 * `at://` uri or a bare `did:` (person), or `subject.uri` (strongRef). A bare
 * http(s) `subject` is a bookmark target, handled as `externalLink` instead.
 */
function genericSubject(record: Record<string, unknown>): StreamCardSubject | undefined {
  const subject = record.subject;
  if (typeof subject === 'string') {
    if (subject.startsWith('at://')) return { kind: 'record', uri: subject };
    if (subject.startsWith('did:')) return { kind: 'person', did: subject };
    return undefined;
  }
  const uri = nonBlankString(asRecord(subject)?.uri);
  if (uri && uri.startsWith('at://')) return { kind: 'record', uri };
  return undefined;
}

/** Recognize one facet feature (link / mention / tag), tolerating a missing $type. */
function parseFacetFeature(
  features: unknown[],
): Pick<StreamRichSegment, 'link' | 'mention' | 'tag'> | undefined {
  for (const raw of features) {
    const feat = asRecord(raw);
    if (!feat) continue;
    const type = asNonEmptyString(feat['$type']) ?? '';
    const uri = asNonEmptyString(feat.uri);
    const did = asNonEmptyString(feat.did);
    const tag = asNonEmptyString(feat.tag);
    if (type.endsWith('#link') && uri) return { link: uri };
    if (type.endsWith('#mention') && did) return { mention: did };
    if (type.endsWith('#tag') && tag) return { tag };
    // No / unknown $type: fall back to whichever identifying field is present.
    if (uri) return { link: uri };
    if (did) return { mention: did };
    if (tag) return { tag };
  }
  return undefined;
}

/**
 * Slice `text` into rich segments using `app.bsky.richtext.facet`-style
 * byte-offset facets. Heuristic and additive: `body.text` always holds the full
 * plain string, so a renderer may ignore this. Returns undefined unless at least
 * one enriched (link/mention/tag) span is produced.
 */
function genericRichSegments(
  text: string,
  record: Record<string, unknown>,
): StreamRichSegment[] | undefined {
  const facets = record.facets;
  if (!Array.isArray(facets)) return undefined;

  const parsed: { start: number; end: number; link?: string; mention?: string; tag?: string }[] =
    [];
  for (const raw of facets) {
    const facet = asRecord(raw);
    const index = asRecord(facet?.index);
    const start = asFiniteNumber(index?.byteStart);
    const end = asFiniteNumber(index?.byteEnd);
    if (start === undefined || end === undefined || start < 0 || end <= start) continue;
    const features = facet?.features;
    if (!Array.isArray(features)) continue;
    const feature = parseFacetFeature(features);
    if (!feature) continue;
    parsed.push({ start, end, ...feature });
  }
  if (parsed.length === 0) return undefined;

  const bytes = new TextEncoder().encode(text);
  const decoder = new TextDecoder();
  parsed.sort((a, b) => a.start - b.start);

  const segments: StreamRichSegment[] = [];
  let cursor = 0;
  for (const span of parsed) {
    if (span.start < cursor || span.start > bytes.length) continue; // overlap / OOB
    const end = Math.min(span.end, bytes.length);
    if (span.start > cursor) {
      const plain = decoder.decode(bytes.slice(cursor, span.start));
      if (plain) segments.push({ text: plain });
    }
    const seg: StreamRichSegment = { text: decoder.decode(bytes.slice(span.start, end)) };
    if (span.link) seg.link = span.link;
    if (span.mention) seg.mention = span.mention;
    if (span.tag) seg.tag = span.tag;
    segments.push(seg);
    cursor = end;
  }
  if (cursor < bytes.length) {
    const rest = decoder.decode(bytes.slice(cursor));
    if (rest) segments.push({ text: rest });
  }

  return segments.some((s) => s.link ?? s.mention ?? s.tag) ? segments : undefined;
}

/**
 * Populate a generic body with any real content the record carries — text,
 * media (blob refs), an external link, and a reply/quote/answer subject —
 * choosing `body.kind` the same way the Bluesky path does (text, else media,
 * else link, else generic).
 */
function applyGeneric(
  vm: StreamCardVM,
  item: ActivityItem,
  record: Record<string, unknown> | null,
): StreamCardVM {
  if (!record) return withGeneric(vm);

  const text = genericText(item.collection, record);
  const tags = genericTags(record);
  const did = didFromUri(item.uri);
  if (did) {
    const media = genericMedia(record, did, text ?? '');
    if (media.length > 0) vm.media = media;
  }
  const externalLink = genericExternalLink(record);
  if (externalLink) vm.externalLink = externalLink;
  // Don't clobber a repost/reply subject already normalized from item.subject.
  if (!vm.subject) {
    const subject = genericSubject(record);
    if (subject) vm.subject = subject;
  }

  let body: StreamCardBody;
  if (text) {
    body = { kind: 'text', text };
    const richSegments = genericRichSegments(text, record);
    if (richSegments) body.richSegments = richSegments;
    if (tags) body.tags = tags;
  } else if (vm.media) {
    body = { kind: 'media' };
    if (tags) body.tags = tags;
  } else if (vm.externalLink) {
    body = { kind: 'link' };
    if (tags) body.tags = tags;
  } else {
    body = { kind: 'generic' };
    if (tags) body.tags = tags;
  }
  vm.body = body;
  return vm;
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Normalize one {@link ActivityItem} into a framework-free {@link StreamCardVM}.
 * Pure: no I/O, no React, no DOM, and no resolved CDN URLs (media carries raw
 * blob refs so each surface builds its own URL). Total: always returns a VM.
 *
 * Reference implementations: the generic/unknown case, `app.bsky.feed.post`
 * (text + images + external embed), and reposts (whose `subject` is normalized
 * through this same function). Collections with a typed body variant
 * (`github-pr`, `book`, `media-review`, `event-rsvp`, `verification`,
 * `membership`, `location`, `travel`, `standard-site`) are enriched from their
 * raw record below; `at.youandme.connection` and `fyi.asq.answer` populate a
 * person / record `subject`. Everything else (base collections + unknown apps)
 * flows through {@link applyGeneric}, which extracts text / media / link /
 * subject from common record shapes, degrading to an empty generic body.
 */
export function toStreamCardVM(
  item: ActivityItem,
  options: ToStreamCardVMOptions = {},
): StreamCardVM {
  const verb = verbForCollection(item.collection);
  const source = buildSource(item, options);
  const record = asRecord(item.record);
  const timestamp = (record ? asNonEmptyString(record.createdAt) : undefined) ?? item.indexedAt;

  const vm: StreamCardVM = {
    uri: item.uri,
    cid: item.cid,
    verb,
    source,
    tier: getActivityTier(item.collection),
    timestamp,
    title: buildTitle(verb, source.label),
  };

  const theme = readTheme(record);
  if (theme) vm.theme = theme;

  // Repost / reply target, normalized through the same transform.
  if (item.subject) {
    vm.subject = { kind: 'post', post: toStreamCardVM(item.subject, options) };
  }

  switch (item.collection) {
    case 'app.bsky.feed.post':
      return applyBskyPost(vm, item, record);
    case 'github.pull_request':
      return record ? applyGithubPr(vm, record) : withGeneric(vm);
    case 'buzz.bookhive.book':
      return record ? applyBook(vm, item, record) : withGeneric(vm);
    case 'community.lexicon.calendar.rsvp':
      return record ? applyEventRsvp(vm, record) : withGeneric(vm);
    case 'dev.keytrace.claim':
      return record ? applyKeytraceVerification(vm, record) : withGeneric(vm);
    case 'app.bsky.graph.verification':
      return record ? applyBskyVerification(vm, record) : withGeneric(vm);
    case 'social.colibri.membership':
      return record ? applyMembership(vm, record) : withGeneric(vm);
    case 'app.beaconbits.beacon':
      return record ? applyLocation(vm, record) : withGeneric(vm);
    case 'social.passports.travel.leg':
      return record ? applyTravel(vm, record) : withGeneric(vm);
    case 'site.standard.document':
      return record ? applyStandardSite(vm, record) : withGeneric(vm);
    case 'at.youandme.connection':
      return record ? applyYouAndMe(vm, record) : withGeneric(vm);
    case 'fyi.asq.answer':
      return record ? applyAsqAnswer(vm, record) : withGeneric(vm);
  }

  // social.popfeed.feed.{post,note,review} — registered by prefix in sifa-web.
  if (record && item.collection.startsWith('social.popfeed.feed.')) {
    return applyMediaReview(vm, item, record);
  }

  // Base collections + unknown / future apps: extract real content generically.
  return applyGeneric(vm, item, record);
}

/**
 * Map a list of activity items to VMs, applying {@link isVisibleActivityItem}
 * first so both surfaces (sifa-web, page.sifa.id) filter identically — a
 * filtered item produces no VM rather than a null-rendering card.
 */
export function toStreamCardVMs(
  items: ActivityItem[],
  options: ToStreamCardVMOptions = {},
): StreamCardVM[] {
  const out: StreamCardVM[] = [];
  for (const item of items) {
    if (isVisibleActivityItem(item.collection, item.record)) {
      out.push(toStreamCardVM(item, options));
    }
  }
  return out;
}
