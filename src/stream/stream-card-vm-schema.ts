import { z } from 'zod';

import type {
  StreamAddress,
  StreamAuthor,
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
import { streamVerbSchema } from './verbs.js';

/** RGB channel: finite number in [0, 255] (mirrors `isValidRgbColor`). */
const rgbChannelSchema = z.number().min(0).max(255);
const rgbColorSchema = z.object({
  r: rgbChannelSchema,
  g: rgbChannelSchema,
  b: rgbChannelSchema,
});

const aspectRatioSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const streamSourceSchema: z.ZodType<StreamSource> = z.object({
  appId: z.string(),
  label: z.string(),
  color: z.string(),
});

export const streamAuthorSchema: z.ZodType<StreamAuthor> = z.object({
  did: z.string().optional(),
  handle: z.string().optional(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
});

export const streamThemeSchema: z.ZodType<StreamTheme> = z.object({
  background: rgbColorSchema,
  foreground: rgbColorSchema,
  accent: rgbColorSchema,
});

const streamMediaResolvedSchema = z.object({
  url: z.string(),
  alt: z.string(),
  aspectRatio: aspectRatioSchema.optional(),
  mimeType: z.string().optional(),
});

const streamMediaBlobSchema = z.object({
  did: z.string(),
  cid: z.string(),
  alt: z.string(),
  aspectRatio: aspectRatioSchema.optional(),
  mimeType: z.string().optional(),
});

export const streamMediaSchema: z.ZodType<StreamMedia> = z.union([
  streamMediaResolvedSchema,
  streamMediaBlobSchema,
]);

export const streamExternalLinkSchema: z.ZodType<StreamExternalLink> = z.object({
  url: z.string(),
  title: z.string().optional(),
  thumb: z.string().optional(),
});

export const streamGeoSchema: z.ZodType<StreamGeo> = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const streamAddressSchema: z.ZodType<StreamAddress> = z.object({
  name: z.string().optional(),
  street: z.string().optional(),
  locality: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

export const streamRichSegmentSchema: z.ZodType<StreamRichSegment> = z.object({
  text: z.string(),
  link: z.string().optional(),
  mention: z.string().optional(),
  tag: z.string().optional(),
});

export const streamCardBodySchema: z.ZodType<StreamCardBody> = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    text: z.string(),
    richSegments: z.array(streamRichSegmentSchema).optional(),
    tags: z.array(z.string()).optional(),
  }),
  z.object({
    kind: z.literal('media'),
    text: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  z.object({
    kind: z.literal('link'),
    text: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  z.object({
    kind: z.literal('track'),
    text: z.string().optional(),
    trackTitle: z.string().optional(),
    artist: z.string().optional(),
  }),
  z.object({
    kind: z.literal('generic'),
    text: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  z.object({
    kind: z.literal('github-pr'),
    repoOwner: z.string(),
    repoName: z.string(),
    prNumber: z.number(),
    title: z.string(),
    url: z.string().optional(),
    language: z.string().optional(),
    additions: z.number(),
    deletions: z.number(),
    mergedAt: z.string().optional(),
  }),
  z.object({
    kind: z.literal('book'),
    title: z.string(),
    authors: z.array(z.string()),
    stars: z.number().optional(),
    status: z.string().optional(),
    review: z.string().optional(),
  }),
  z.object({
    kind: z.literal('media-review'),
    reviewKind: z.enum(['review', 'post', 'note', 'other']),
    title: z.string().optional(),
    mediaType: z.string().optional(),
    rating: z.number().optional(),
    mainCredit: z.string().optional(),
    reviewText: z.string().optional(),
    isRevisit: z.boolean(),
  }),
  z.object({
    kind: z.literal('event-rsvp'),
    rsvpStatus: z.enum(['going', 'interested', 'notgoing', 'unknown']),
    eventName: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    mode: z.enum(['inperson', 'virtual', 'hybrid']).optional(),
    locationName: z.string().optional(),
    locationLocality: z.string().optional(),
    locationCountry: z.string().optional(),
  }),
  z.object({
    kind: z.literal('verification'),
    platform: z.string(),
    verified: z.boolean(),
    subjectLabel: z.string().optional(),
    handle: z.string().optional(),
    profileUrl: z.string().optional(),
  }),
  z.object({
    kind: z.literal('membership'),
    communityName: z.string().optional(),
    description: z.string().optional(),
    communityUri: z.string().optional(),
  }),
  z.object({
    kind: z.literal('location'),
    venueName: z.string().optional(),
    shout: z.string().optional(),
    address: streamAddressSchema.optional(),
    geo: streamGeoSchema.optional(),
  }),
  z.object({
    kind: z.literal('travel'),
    origin: z.string().optional(),
    destination: z.string().optional(),
    transportation: z.string().optional(),
    carrier: z.string().optional(),
    carrierCode: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  z.object({
    kind: z.literal('standard-site'),
    title: z.string().optional(),
    description: z.string().optional(),
    siteUrl: z.string().optional(),
    path: z.string().optional(),
    publisherName: z.string().optional(),
    icon: z.string().optional(),
    coverImageUrl: z.string().optional(),
    readingTime: z.number().optional(),
    publishedAt: z.string().optional(),
  }),
]);

/**
 * A stream item's repost / reply / quote target. The `post` variant nests a
 * full {@link streamCardVMSchema} (deferred via `z.lazy` for recursion).
 */
export const streamCardSubjectSchema: z.ZodType<StreamCardSubject> = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('post'),
    post: z.lazy(() => streamCardVMSchema),
  }),
  z.object({
    kind: z.literal('person'),
    did: z.string(),
    handle: z.string().optional(),
    displayName: z.string().optional(),
    avatar: z.string().optional(),
  }),
  z.object({
    kind: z.literal('record'),
    uri: z.string(),
    title: z.string().optional(),
  }),
]);

/** Zod schema for a {@link StreamCardVM}. Recursive through `subject.post`. */
export const streamCardVMSchema: z.ZodType<StreamCardVM> = z.lazy(() =>
  z.object({
    uri: z.string(),
    cid: z.string(),
    verb: streamVerbSchema,
    source: streamSourceSchema,
    author: streamAuthorSchema.optional(),
    tier: z.enum(['creation', 'action', 'filtered']),
    timestamp: z.string(),
    title: z.string(),
    sourceUrl: z.string().optional(),
    body: streamCardBodySchema.optional(),
    media: z.array(streamMediaSchema).optional(),
    externalLink: streamExternalLinkSchema.optional(),
    theme: streamThemeSchema.optional(),
    subject: z.lazy(() => streamCardSubjectSchema).optional(),
  }),
);
