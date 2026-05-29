import { z } from 'zod';

import {
  atUriSchema,
  datetimeSchema,
  didSchema,
  maxGraphemes,
  selfLabelsSchema,
  strongRefSchema,
  uriSchema,
} from '../schemas/shared.js';

/**
 * Zod schemas mirroring the canonical Standard.site lexicons that Sifa
 * consumes when rendering publication embeds.
 *
 * Canonical lexicons live at:
 *   DID:        did:plc:re3ebnp5v7ffagz6rb6xfei4
 *   PDS:        https://auriporia.us-west.host.bsky.network
 *   Collection: com.atproto.lexicon.schema
 *
 * Sifa does NOT own these lexicons; we vendor the validation shapes so
 * clients can parse augmented embeds and (in Phase 4) write subscription
 * records to viewers' PDSes. Re-check against the canonical PDS on each
 * SDK release to detect schema drift.
 */

const rgbColorSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
});

export type RgbColor = z.infer<typeof rgbColorSchema>;

/** site.standard.theme.basic */
export const BasicThemeSchema = z.object({
  background: rgbColorSchema,
  foreground: rgbColorSchema,
  accent: rgbColorSchema,
  accentForeground: rgbColorSchema,
});

export type BasicTheme = z.infer<typeof BasicThemeSchema>;

const blobRefSchema = z
  .object({
    $type: z.string().optional(),
    ref: z.unknown(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
  })
  .passthrough();

/** site.standard.publication */
export const StandardSitePublicationRecordSchema = z
  .object({
    url: uriSchema,
    name: z.string().min(1).refine(maxGraphemes(500)).max(5000),
    description: z.string().refine(maxGraphemes(3000)).max(30000).optional(),
    icon: blobRefSchema.optional(),
    basicTheme: BasicThemeSchema.optional(),
    labels: selfLabelsSchema.optional(),
    preferences: z
      .object({
        showInDiscover: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

export type StandardSitePublicationRecord = z.infer<typeof StandardSitePublicationRecordSchema>;

const contributorSchema = z
  .object({
    did: didSchema,
    role: z.string().refine(maxGraphemes(100)).max(1000).optional(),
    displayName: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  })
  .passthrough();

/** site.standard.document */
export const StandardSiteDocumentRecordSchema = z
  .object({
    site: z.string().min(1),
    title: z.string().min(1).refine(maxGraphemes(500)).max(5000),
    path: z.string().optional(),
    publishedAt: datetimeSchema,
    updatedAt: datetimeSchema.optional(),
    description: z.string().refine(maxGraphemes(3000)).max(30000).optional(),
    textContent: z.string().optional(),
    tags: z.array(z.string().refine(maxGraphemes(128)).max(1280)).optional(),
    coverImage: blobRefSchema.optional(),
    contributors: z.array(contributorSchema).optional(),
    bskyPostRef: strongRefSchema.optional(),
    labels: selfLabelsSchema.optional(),
  })
  .passthrough();

export type StandardSiteDocumentRecord = z.infer<typeof StandardSiteDocumentRecordSchema>;

/**
 * site.standard.graph.subscription
 *
 * Authored by a viewer to declare a subscription to a publication. Used
 * by Phase 4 inline-subscribe path. Record key is a TID; the AT-URI
 * shape is `at://<viewer-did>/site.standard.graph.subscription/<rkey>`.
 */
export const StandardSiteSubscriptionRecordSchema = z.object({
  publication: atUriSchema,
  createdAt: datetimeSchema.optional(),
});

export type StandardSiteSubscriptionRecord = z.infer<typeof StandardSiteSubscriptionRecordSchema>;

/**
 * site.standard.graph.recommend
 *
 * Document-level "like" record. Same scope as subscription via the
 * site.standard.authSocial OAuth permission-set, so Phase 4 unlocks
 * inline likes alongside inline subscribes.
 */
export const StandardSiteRecommendRecordSchema = z.object({
  document: atUriSchema,
  createdAt: datetimeSchema,
});

export type StandardSiteRecommendRecord = z.infer<typeof StandardSiteRecommendRecordSchema>;
