import { describe, expect, it } from 'vitest';

import type { ProfileSkill } from '../types/index.js';

import { CONTINENTS, getContinent } from './continents.js';
import { COUNTRIES } from './countries.js';
import { INDUSTRY_OPTIONS } from './industry-taxonomy.js';
import {
  PLATFORM_LABELS,
  PLATFORM_OPTIONS,
  getFaviconUrl,
  getPlatformLabel,
  isKnownPlatform,
} from './platforms.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, SKILL_CATEGORIES } from './skill-categories.js';
import { dedupeSkills, groupSkillsByCategory } from './skill-grouping.js';

describe('continents', () => {
  it('lists seven continents', () => {
    expect(CONTINENTS).toHaveLength(7);
  });

  it('maps NL to EU', () => {
    expect(getContinent('NL')).toBe('EU');
  });

  it('uppercases the input', () => {
    expect(getContinent('us')).toBe('NA');
  });

  it('returns null for empty input', () => {
    expect(getContinent('')).toBeNull();
  });

  it('returns null for unknown country code', () => {
    expect(getContinent('ZZ')).toBeNull();
  });
});

describe('countries', () => {
  it('contains a non-empty list with ISO codes', () => {
    expect(COUNTRIES.length).toBeGreaterThan(100);
    expect(COUNTRIES.every((c) => /^[A-Z]{2}$/.test(c.code))).toBe(true);
  });
});

describe('industry-taxonomy', () => {
  it('contains industries with hierarchical domain options', () => {
    expect(INDUSTRY_OPTIONS.length).toBeGreaterThan(0);
    // All industries except the "Other" catch-all should have domains
    const withDomains = INDUSTRY_OPTIONS.filter((i) => i.domains.length > 0);
    expect(withDomains.length).toBeGreaterThan(0);
  });

  it('every option uses the id.sifa.defs# namespace', () => {
    expect(INDUSTRY_OPTIONS.every((i) => i.value.startsWith('id.sifa.defs#'))).toBe(true);
  });
});

describe('platforms', () => {
  it('isKnownPlatform narrows the input', () => {
    expect(isKnownPlatform('github')).toBe(true);
    expect(isKnownPlatform('unknown')).toBe(false);
  });

  it('falls back to website for unknown platforms', () => {
    expect(getPlatformLabel('github')).toBe('GitHub');
    expect(getPlatformLabel('unknown')).toBe(PLATFORM_LABELS.website);
  });

  it('PLATFORM_OPTIONS excludes auto-derived platforms', () => {
    const ids = PLATFORM_OPTIONS.map((p) => p.value);
    expect(ids).not.toContain('bluesky');
    expect(ids).not.toContain('dns');
    expect(ids).not.toContain('tangled');
  });

  it('getFaviconUrl returns a Google favicon URL for valid input', () => {
    expect(getFaviconUrl('https://example.com/page')).toBe(
      'https://www.google.com/s2/favicons?domain=example.com&sz=32',
    );
  });

  it('getFaviconUrl returns null for invalid input', () => {
    expect(getFaviconUrl('not a url')).toBeNull();
  });
});

describe('skill-categories', () => {
  it('SKILL_CATEGORIES and CATEGORY_ORDER stay in sync', () => {
    expect(CATEGORY_ORDER).toEqual(SKILL_CATEGORIES.map((c) => c.value));
  });

  it('CATEGORY_LABELS covers every category plus "other"', () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    }
    expect(CATEGORY_LABELS.other).toBe('Other');
  });
});

describe('dedupeSkills', () => {
  it('merges case-insensitive duplicates and unions positionRkeys', () => {
    const input: ProfileSkill[] = [
      { rkey: 'a', name: 'Ruby', endorsementCount: 1, endorsed: false },
      { rkey: 'b', name: 'ruby', endorsementCount: 3, endorsed: true },
      { rkey: 'c', name: 'Go', endorsementCount: 0 },
    ];
    const merged = dedupeSkills(input);
    expect(merged).toHaveLength(2);
    const ruby = merged.find((m) => m.name === 'Ruby');
    expect(ruby?.mergedRkeys).toEqual(['a', 'b']);
    expect(ruby?.endorsementCount).toBe(3);
    expect(ruby?.endorsed).toBe(true);
  });

  it('preserves first-seen display name and rkey', () => {
    const input: ProfileSkill[] = [
      { rkey: 'first', name: 'TypeScript' },
      { rkey: 'second', name: 'typescript' },
    ];
    const merged = dedupeSkills(input);
    expect(merged[0]?.name).toBe('TypeScript');
    expect(merged[0]?.rkey).toBe('first');
  });
});

describe('groupSkillsByCategory', () => {
  it('orders groups per CATEGORY_ORDER with "other" last', () => {
    const skills: ProfileSkill[] = [
      { rkey: '1', name: 'Cooking', category: 'unknown' },
      { rkey: '2', name: 'TypeScript', category: 'technical' },
      { rkey: '3', name: 'Marketing', category: 'business' },
    ];
    const groups = groupSkillsByCategory(skills);
    expect(groups.map(([k]) => k)).toEqual(['technical', 'business', 'other']);
  });

  it('sorts by endorsementCount desc, then name', () => {
    const skills: ProfileSkill[] = [
      { rkey: '1', name: 'TypeScript', category: 'technical', endorsementCount: 1 },
      { rkey: '2', name: 'Rust', category: 'technical', endorsementCount: 5 },
      { rkey: '3', name: 'Go', category: 'technical', endorsementCount: 5 },
    ];
    const groups = groupSkillsByCategory(skills);
    expect(groups[0]?.[1].map((s) => s.name)).toEqual(['Go', 'Rust', 'TypeScript']);
  });

  it('omits empty groups', () => {
    const skills: ProfileSkill[] = [{ rkey: '1', name: 'Python', category: 'technical' }];
    const groups = groupSkillsByCategory(skills);
    expect(groups).toHaveLength(1);
  });
});
