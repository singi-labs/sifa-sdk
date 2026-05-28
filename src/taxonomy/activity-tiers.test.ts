import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_TIERS,
  getActivityTaxonomyVersion,
  getActivityTier,
  getLexiconEntry,
  getTierMeta,
} from './activity-tiers.js';

describe('getActivityTier', () => {
  it('returns "creation" for a known creation NSID', () => {
    expect(getActivityTier('app.bsky.feed.post')).toBe('creation');
  });

  it('returns "action" for a known action NSID', () => {
    expect(getActivityTier('app.bsky.feed.like')).toBe('action');
  });

  it('returns "filtered" for a known filtered NSID', () => {
    expect(getActivityTier('app.bsky.graph.block')).toBe('filtered');
  });

  it('returns "filtered" for an unknown NSID (safe default)', () => {
    expect(getActivityTier('com.example.not.real')).toBe('filtered');
  });

  it('returns "filtered" for an empty string without throwing', () => {
    expect(getActivityTier('')).toBe('filtered');
  });

  it('handles malformed input cleanly', () => {
    expect(getActivityTier('not-an-nsid')).toBe('filtered');
    expect(getActivityTier('.....')).toBe('filtered');
  });
});

describe('getLexiconEntry', () => {
  it('returns the full entry for a known NSID', () => {
    const entry = getLexiconEntry('app.bsky.feed.like');
    expect(entry).not.toBeNull();
    expect(entry?.tier).toBe('action');
    expect(entry?.app).toBe('bluesky');
  });

  it('includes notes when present in the taxonomy', () => {
    const entry = getLexiconEntry('app.bsky.graph.block');
    expect(entry?.notes).toBeTypeOf('string');
  });

  it('returns null for unknown NSIDs', () => {
    expect(getLexiconEntry('com.example.not.real')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getLexiconEntry('')).toBeNull();
  });
});

describe('getTierMeta', () => {
  it('returns metadata for creation tier', () => {
    const meta = getTierMeta('creation');
    expect(meta.label).toBe('Made');
    expect(meta.shownOnPublicProfile).toBe(true);
    expect(meta.description).toBeTypeOf('string');
    expect(meta.description.length).toBeGreaterThan(0);
  });

  it('returns metadata for action tier', () => {
    const meta = getTierMeta('action');
    expect(meta.label).toBe('Did');
    expect(meta.shownOnPublicProfile).toBe(false);
  });

  it('returns metadata for filtered tier with null label', () => {
    const meta = getTierMeta('filtered');
    expect(meta.label).toBeNull();
    expect(meta.shownOnPublicProfile).toBe(false);
  });
});

describe('getActivityTaxonomyVersion', () => {
  it('returns the version and updated date from the taxonomy JSON', () => {
    const version = getActivityTaxonomyVersion();
    expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(version.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('ACTIVITY_TIERS taxonomy', () => {
  it('loads more than 100 lexicon entries (sanity check)', () => {
    expect(Object.keys(ACTIVITY_TIERS.lexicons).length).toBeGreaterThan(100);
  });

  it('every entry has a valid tier value', () => {
    const validTiers = new Set(['creation', 'action', 'filtered']);
    for (const entry of Object.values(ACTIVITY_TIERS.lexicons)) {
      expect(validTiers.has(entry.tier)).toBe(true);
    }
  });
});
