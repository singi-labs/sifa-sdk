import { isVisibleActivityItem } from '../cards/visibility.js';
import { isValidRgbColor } from '../format/wcag-contrast.js';
import { matchPublisherByUri } from '../publishing/index.js';
import { getActivityTier } from '../taxonomy/activity-tiers.js';
import type { ActivityItem } from './activity-item.js';
import type {
  StreamAddress,
  StreamCardBody,
  StreamCardVM,
  StreamExternalLink,
  StreamGeo,
  StreamMedia,
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
 * person / record `subject`. Everything else falls through to `generic`.
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

  return withGeneric(vm);
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
