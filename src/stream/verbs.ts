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
  // Relational verbs: a reaction or reference to someone else's thing. These
  // read with the subject the two-tier line renders after them ("Commented on
  // {doc}", "Followed {person}").
  'commented',
  'replied',
  'rsvped',
  'liked',
  'followed',
  'bookmarked',
  'registered',
  'annotated',
  'streamed',
  'wrote',
  'wasAt',
  'metWith',
  'supported',
  'verified',
  // rpg.actor: accepting an equipment item, and (re)composing the character's
  // pixel-art sprite.
  'received',
  'styledCharacter',
] as const;

export type StreamVerb = (typeof STREAM_VERBS)[number];

export interface ActivityVerbMap {
  version: string;
  updated: string;
  /** Verb returned for any collection not present in `verbs`. */
  defaultVerb: StreamVerb;
  /** Verb keyed by lexicon NSID. */
  verbs: Record<string, StreamVerb>;
}

// verbs.json is checked against this shape in verbs.test.ts. Only the map
// fields are copied, so the file's `$schema` key stays out.
const parsed: ActivityVerbMap = {
  version: rawVerbs.version,
  updated: rawVerbs.updated,
  defaultVerb: rawVerbs.defaultVerb as StreamVerb,
  verbs: rawVerbs.verbs as Record<string, StreamVerb>,
};

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
