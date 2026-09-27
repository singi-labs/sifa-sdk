// This SDK is the source of truth for the activity taxonomy.
//
// It used to be synced from sifa-lexicons, but the taxonomy is editorial
// rather than protocol: none of it is published to a PDS, and it governs how
// Sifa renders records rather than what any record means. Keeping it in the
// lexicon repo meant it lived where nobody edited it, and the two copies
// drifted 60 entries apart before anything noticed.
//
// It is served publicly at https://sifa.id/.well-known/sifa-activity-tiers.json
// so third-party clients and sibling AppViews can read Sifa's choices rather
// than infer them.
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

// activity-tiers.json is checked against this shape in activity-tiers.test.ts.
// Only the taxonomy fields are copied, so the file's `$schema` key stays out.
const parsed: ActivityTaxonomy = {
  version: rawTaxonomy.version,
  updated: rawTaxonomy.updated,
  tiers: rawTaxonomy.tiers,
  lexicons: rawTaxonomy.lexicons as Record<string, LexiconEntry>,
};

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
