import { z } from 'zod';

import rawTaxonomy from './activity-tiers.json' with { type: 'json' };

export type ActivityTier = 'creation' | 'action' | 'filtered';

export interface TierMeta {
  label: string | null;
  description: string;
  shownOnPublicProfile: boolean;
}

export interface LexiconEntry {
  tier: ActivityTier;
  app?: string;
  notes?: string;
}

export interface ActivityTaxonomy {
  version: string;
  updated: string;
  tiers: Record<ActivityTier, TierMeta>;
  lexicons: Record<string, LexiconEntry>;
}

const tierMetaSchema = z.object({
  label: z.string().nullable(),
  description: z.string(),
  shownOnPublicProfile: z.boolean(),
});

const lexiconEntrySchema = z.object({
  tier: z.enum(['creation', 'action', 'filtered']),
  app: z.string().optional(),
  notes: z.string().optional(),
});

const taxonomySchema = z.object({
  version: z.string(),
  updated: z.string(),
  tiers: z.object({
    creation: tierMetaSchema,
    action: tierMetaSchema,
    filtered: tierMetaSchema,
  }),
  lexicons: z.record(z.string(), lexiconEntrySchema),
});

const parsed: ActivityTaxonomy = taxonomySchema.parse(rawTaxonomy);

export const ACTIVITY_TIERS: Readonly<ActivityTaxonomy> = Object.freeze(parsed);

/**
 * Returns the activity tier for a given AT Protocol NSID.
 * Returns 'filtered' for unknown/unclassified NSIDs (safe default — won't
 * leak unknown records to public profile surfaces).
 */
export function getActivityTier(nsid: string): ActivityTier {
  if (!nsid) return 'filtered';
  const entry = ACTIVITY_TIERS.lexicons[nsid];
  return entry ? entry.tier : 'filtered';
}

/**
 * Returns the full lexicon entry (tier + app + notes), or null if unknown.
 */
export function getLexiconEntry(nsid: string): LexiconEntry | null {
  if (!nsid) return null;
  const entry = ACTIVITY_TIERS.lexicons[nsid];
  return entry ?? null;
}

/**
 * Returns tier metadata (label, description, public visibility).
 */
export function getTierMeta(tier: ActivityTier): TierMeta {
  return ACTIVITY_TIERS.tiers[tier];
}

/**
 * Returns the taxonomy version + updated date for diagnostics and
 * version-skew detection between SDK consumers and the canonical taxonomy.
 */
export function getActivityTaxonomyVersion(): { version: string; updated: string } {
  return { version: ACTIVITY_TIERS.version, updated: ACTIVITY_TIERS.updated };
}
