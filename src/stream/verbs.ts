import { z } from 'zod';

import rawVerbs from './verbs.json' with { type: 'json' };

/**
 * The human action a stream item represents — a layer on top of `collection`
 * + `tier`. Groups semantically across apps ("published" spans WhiteWind and
 * standard-site; "posted" spans Bluesky and Picosky) so a day-grouped feed
 * reads like sentences.
 */
export const STREAM_VERBS = [
  'posted',
  'reposted',
  'published',
  'presented',
  'endorsed',
  'joined',
  'shipped',
  'reviewed',
  'created',
] as const;

export type StreamVerb = (typeof STREAM_VERBS)[number];

/** Zod enum for a {@link StreamVerb}, shared with the view-model schema. */
export const streamVerbSchema = z.enum(STREAM_VERBS);

export interface ActivityVerbMap {
  version: string;
  updated: string;
  /** Verb returned for any collection not present in `verbs`. */
  defaultVerb: StreamVerb;
  /** Verb keyed by lexicon NSID. */
  verbs: Record<string, StreamVerb>;
}

const verbMapSchema = z.object({
  version: z.string(),
  updated: z.string(),
  defaultVerb: streamVerbSchema,
  verbs: z.record(z.string(), streamVerbSchema),
});

const parsed: ActivityVerbMap = verbMapSchema.parse(rawVerbs);

/**
 * The verb map, keyed by lexicon NSID. Versioned independently from
 * `activity-tiers.json` so tier and verb evolve on their own cadence.
 */
export const ACTIVITY_VERBS: Readonly<ActivityVerbMap> = Object.freeze(parsed);

/**
 * Returns the {@link StreamVerb} for an AT Protocol collection NSID. Unknown
 * or empty collections fall back to the map's `defaultVerb` (`created`).
 */
export function verbForCollection(collection: string): StreamVerb {
  if (!collection) return ACTIVITY_VERBS.defaultVerb;
  return ACTIVITY_VERBS.verbs[collection] ?? ACTIVITY_VERBS.defaultVerb;
}

/** Verb-map version + updated date, for diagnostics and version-skew checks. */
export function getActivityVerbsVersion(): { version: string; updated: string } {
  return { version: ACTIVITY_VERBS.version, updated: ACTIVITY_VERBS.updated };
}
