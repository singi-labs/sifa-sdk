import { z } from 'zod';

import type {
  StreamCardBody,
  StreamCardSubject,
  StreamCardVM,
  StreamExternalLink,
  StreamMedia,
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

export const streamCardBodySchema: z.ZodType<StreamCardBody> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string() }),
  z.object({ kind: z.literal('media'), text: z.string().optional() }),
  z.object({ kind: z.literal('link'), text: z.string().optional() }),
  z.object({
    kind: z.literal('track'),
    text: z.string().optional(),
    trackTitle: z.string().optional(),
    artist: z.string().optional(),
  }),
  z.object({ kind: z.literal('generic'), text: z.string().optional() }),
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
    tier: z.enum(['creation', 'action', 'filtered']),
    timestamp: z.string(),
    title: z.string(),
    body: streamCardBodySchema.optional(),
    media: z.array(streamMediaSchema).optional(),
    externalLink: streamExternalLinkSchema.optional(),
    theme: streamThemeSchema.optional(),
    subject: z.lazy(() => streamCardSubjectSchema).optional(),
  }),
);
