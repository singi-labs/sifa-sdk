import { describe, expect, it } from 'vitest';

import type { ProfileSkill } from '../types/index.js';

import { CONTINENTS, getContinent } from './continents.js';
import { COUNTRIES } from './countries.js';
import {
  COMPANY_OPTIONAL_EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_GROUPS,
  EMPLOYMENT_TYPE_LABELS,
  getEmploymentTypeLabel,
  isCompanyRequired,
} from './employment-type.js';
import { INDUSTRY_OPTIONS } from './industry-taxonomy.js';
import {
  OPEN_TO_OPTIONS,
  OPEN_TO_TOKENS,
  OPEN_TO_TOKEN_TO_VALUE,
  OPEN_TO_VALUE_TO_TOKEN,
  getOpenToLabelKey,
  normalizeOpenTo,
  openToTokenToValue,
  openToValueToToken,
} from './open-to.js';
import {
  PLATFORM_LABELS,
  PLATFORM_OPTIONS,
  getFaviconUrl,
  getPlatformLabel,
  isKnownPlatform,
} from './platforms.js';
import { CATEGORY_LABELS, CATEGORY_ORDER, SKILL_CATEGORIES } from './skill-categories.js';
import { dedupeSkills, groupSkillsByCategory, groupSkillsBySubCategory } from './skill-grouping.js';
import {
  WORKPLACE_TYPE_LABELS,
  WORKPLACE_TYPE_OPTIONS,
  getWorkplaceTypeLabel,
  normalizeWorkplaceTypes,
} from './workplace-type.js';

const LEXICON_EMPLOYMENT_TYPE_KNOWN_VALUES = [
  'id.sifa.defs#fullTime',
  'id.sifa.defs#partTime',
  'id.sifa.defs#temporary',
  'id.sifa.defs#seasonal',
  'id.sifa.defs#contract',
  'id.sifa.defs#freelance',
  'id.sifa.defs#selfEmployed',
  'id.sifa.defs#independentWork',
  'id.sifa.defs#internship',
  'id.sifa.defs#apprenticeship',
  'id.sifa.defs#fellowship',
  'id.sifa.defs#trainee',
  'id.sifa.defs#volunteer',
] as const;

const LEXICON_OPEN_TO_KNOWN_VALUES = [
  'id.sifa.defs#fullTimeRoles',
  'id.sifa.defs#partTimeRoles',
  'id.sifa.defs#contractRoles',
  'id.sifa.defs#commissions',
  'id.sifa.defs#boardPositions',
  'id.sifa.defs#mentoringOthers',
  'id.sifa.defs#beingMentored',
  'id.sifa.defs#collaborations',
] as const;

const LEXICON_WORKPLACE_TYPE_KNOWN_VALUES = [
  'id.sifa.defs#onSite',
  'id.sifa.defs#remote',
  'id.sifa.defs#hybrid',
  'id.sifa.defs#remoteLocal',
  'id.sifa.defs#remoteRegion',
  'id.sifa.defs#remoteGlobal',
] as const;

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

describe('employment-type', () => {
  it('covers every lexicon knownValue with a label', () => {
    for (const v of LEXICON_EMPLOYMENT_TYPE_KNOWN_VALUES) {
      expect(EMPLOYMENT_TYPE_LABELS[v]).toBeDefined();
    }
  });

  it('groups cover the flat label map except legacy read-only tokens', () => {
    const grouped = EMPLOYMENT_TYPE_GROUPS.flatMap((g) => g.items.map((i) => i.value)).sort();
    const flat = Object.keys(EMPLOYMENT_TYPE_LABELS).sort();
    // Every dropdown option has a label.
    expect(flat).toEqual(expect.arrayContaining(grouped));
    // The label map retains exactly the legacy tokens no longer offered in the dropdown.
    const legacyOnly = flat.filter((v) => !grouped.includes(v));
    expect(legacyOnly).toEqual(['id.sifa.defs#volunteer']);
  });

  it('EMPLOYMENT_TYPE_GROUPS excludes the deprecated "volunteer" token', () => {
    const grouped = EMPLOYMENT_TYPE_GROUPS.flatMap((g) => g.items.map((i) => i.value));
    expect(grouped).not.toContain('id.sifa.defs#volunteer');
  });

  it('EMPLOYMENT_TYPE_LABELS still labels legacy "volunteer" for read-only display', () => {
    expect(EMPLOYMENT_TYPE_LABELS['id.sifa.defs#volunteer']).toBe('Volunteer');
  });

  it('every option uses the id.sifa.defs# namespace', () => {
    for (const v of Object.keys(EMPLOYMENT_TYPE_LABELS)) {
      expect(v.startsWith('id.sifa.defs#')).toBe(true);
    }
  });

  it('getEmploymentTypeLabel returns the label for known values', () => {
    expect(getEmploymentTypeLabel('id.sifa.defs#fullTime')).toBe('Full-time');
  });

  it('getEmploymentTypeLabel falls back to the raw value for unknown', () => {
    expect(getEmploymentTypeLabel('id.sifa.defs#unknown')).toBe('id.sifa.defs#unknown');
  });

  it('getEmploymentTypeLabel returns undefined for nullish input', () => {
    expect(getEmploymentTypeLabel(undefined)).toBeUndefined();
    expect(getEmploymentTypeLabel(null)).toBeUndefined();
    expect(getEmploymentTypeLabel('')).toBeUndefined();
  });
});

describe('isCompanyRequired', () => {
  const independentTypes = EMPLOYMENT_TYPE_GROUPS.find((g) => g.label === 'Independent')!.items.map(
    (i) => i.value,
  );

  it('is false for every Independent-group type (company optional)', () => {
    expect(independentTypes.length).toBeGreaterThan(0);
    for (const value of independentTypes) {
      expect(isCompanyRequired(value)).toBe(false);
    }
  });

  it('is true for employee, training, and volunteer types', () => {
    expect(isCompanyRequired('id.sifa.defs#fullTime')).toBe(true);
    expect(isCompanyRequired('id.sifa.defs#internship')).toBe(true);
    expect(isCompanyRequired('id.sifa.defs#volunteer')).toBe(true);
  });

  it('is true when employment type is unspecified (conservative default)', () => {
    expect(isCompanyRequired(undefined)).toBe(true);
    expect(isCompanyRequired(null)).toBe(true);
    expect(isCompanyRequired('')).toBe(true);
  });

  it('COMPANY_OPTIONAL_EMPLOYMENT_TYPES stays in sync with the Independent group', () => {
    expect([...COMPANY_OPTIONAL_EMPLOYMENT_TYPES].sort()).toEqual([...independentTypes].sort());
  });
});

describe('workplace-type', () => {
  it('covers every lexicon knownValue with a label', () => {
    for (const v of LEXICON_WORKPLACE_TYPE_KNOWN_VALUES) {
      expect(WORKPLACE_TYPE_LABELS[v]).toBeDefined();
    }
  });

  it('WORKPLACE_TYPE_OPTIONS excludes the deprecated bare "remote" token', () => {
    expect(WORKPLACE_TYPE_OPTIONS.map((o) => o.value)).not.toContain('id.sifa.defs#remote');
  });

  it('WORKPLACE_TYPE_LABELS still labels legacy "remote" for read-only display', () => {
    expect(WORKPLACE_TYPE_LABELS['id.sifa.defs#remote']).toBe('Remote');
  });

  it('getWorkplaceTypeLabel falls back to the raw value for unknown', () => {
    expect(getWorkplaceTypeLabel('id.sifa.defs#unknown')).toBe('id.sifa.defs#unknown');
  });

  it('normalizeWorkplaceTypes maps legacy "remote" to the scoped "remoteGlobal"', () => {
    expect(normalizeWorkplaceTypes(['id.sifa.defs#remote'])).toEqual(['id.sifa.defs#remoteGlobal']);
  });

  it('normalizeWorkplaceTypes dedups when both legacy "remote" and "remoteGlobal" are present', () => {
    expect(normalizeWorkplaceTypes(['id.sifa.defs#remote', 'id.sifa.defs#remoteGlobal'])).toEqual([
      'id.sifa.defs#remoteGlobal',
    ]);
  });

  it('normalizeWorkplaceTypes preserves first-seen order and other tokens', () => {
    expect(
      normalizeWorkplaceTypes([
        'id.sifa.defs#hybrid',
        'id.sifa.defs#remote',
        'id.sifa.defs#onSite',
      ]),
    ).toEqual(['id.sifa.defs#hybrid', 'id.sifa.defs#remoteGlobal', 'id.sifa.defs#onSite']);
  });

  it('normalizeWorkplaceTypes leaves unknown tokens untouched (forward-compat)', () => {
    expect(normalizeWorkplaceTypes(['id.sifa.defs#future'])).toEqual(['id.sifa.defs#future']);
  });

  it('normalizeWorkplaceTypes dedups exact duplicates', () => {
    expect(normalizeWorkplaceTypes(['id.sifa.defs#onSite', 'id.sifa.defs#onSite'])).toEqual([
      'id.sifa.defs#onSite',
    ]);
  });
});

describe('open-to', () => {
  it('covers every lexicon knownValue with a labelKey', () => {
    for (const v of LEXICON_OPEN_TO_KNOWN_VALUES) {
      expect(getOpenToLabelKey(v)).toBeDefined();
    }
  });

  it('every option uses the id.sifa.defs# namespace', () => {
    for (const opt of OPEN_TO_OPTIONS) {
      expect(opt.value.startsWith('id.sifa.defs#')).toBe(true);
    }
  });

  it('OPEN_TO_OPTIONS length matches the lexicon knownValues count', () => {
    expect(OPEN_TO_OPTIONS).toHaveLength(LEXICON_OPEN_TO_KNOWN_VALUES.length);
  });

  it('resolves the legacy mentoring alias to mentoringOthers', () => {
    expect(getOpenToLabelKey('id.sifa.defs#mentoring')).toBe('mentoringOthers');
  });

  it('normalizeOpenTo maps legacy "mentoring" to "mentoringOthers"', () => {
    expect(normalizeOpenTo(['id.sifa.defs#mentoring'])).toEqual(['id.sifa.defs#mentoringOthers']);
  });

  it('normalizeOpenTo dedups when both legacy "mentoring" and "mentoringOthers" are present', () => {
    expect(normalizeOpenTo(['id.sifa.defs#mentoring', 'id.sifa.defs#mentoringOthers'])).toEqual([
      'id.sifa.defs#mentoringOthers',
    ]);
  });

  it('normalizeOpenTo preserves first-seen order and leaves unknown tokens untouched', () => {
    expect(normalizeOpenTo(['id.sifa.defs#fullTimeRoles', 'id.sifa.defs#future'])).toEqual([
      'id.sifa.defs#fullTimeRoles',
      'id.sifa.defs#future',
    ]);
  });

  it('getOpenToLabelKey returns the labelKey for known values', () => {
    expect(getOpenToLabelKey('id.sifa.defs#commissions')).toBe('commissions');
    expect(getOpenToLabelKey('id.sifa.defs#fullTimeRoles')).toBe('fullTimeRoles');
  });

  it('getOpenToLabelKey returns undefined for unknown values', () => {
    expect(getOpenToLabelKey('id.sifa.defs#unknown')).toBeUndefined();
  });

  it('getOpenToLabelKey returns undefined for nullish input', () => {
    expect(getOpenToLabelKey(undefined)).toBeUndefined();
    expect(getOpenToLabelKey(null)).toBeUndefined();
    expect(getOpenToLabelKey('')).toBeUndefined();
  });

  it('every option has a unique short token', () => {
    const tokens = OPEN_TO_OPTIONS.map((o) => o.token);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it('every option has a valid group', () => {
    for (const opt of OPEN_TO_OPTIONS) {
      expect(['work', 'mentorship', 'peer']).toContain(opt.group);
    }
  });

  it('OPEN_TO_TOKENS exposes every option token', () => {
    expect(OPEN_TO_TOKENS).toHaveLength(OPEN_TO_OPTIONS.length);
    for (const opt of OPEN_TO_OPTIONS) {
      expect(OPEN_TO_TOKENS).toContain(opt.token);
    }
  });

  it('token <-> value maps round-trip', () => {
    for (const opt of OPEN_TO_OPTIONS) {
      expect(OPEN_TO_TOKEN_TO_VALUE[opt.token]).toBe(opt.value);
      expect(OPEN_TO_VALUE_TO_TOKEN[opt.value]).toBe(opt.token);
      expect(openToTokenToValue(opt.token)).toBe(opt.value);
      expect(openToValueToToken(opt.value)).toBe(opt.token);
    }
  });

  it('openToTokenToValue returns undefined for unknown / nullish tokens', () => {
    expect(openToTokenToValue('nope')).toBeUndefined();
    expect(openToTokenToValue(undefined)).toBeUndefined();
    expect(openToTokenToValue(null)).toBeUndefined();
    expect(openToTokenToValue('')).toBeUndefined();
  });

  it('openToValueToToken returns undefined for unknown / nullish values', () => {
    expect(openToValueToToken('id.sifa.defs#unknown')).toBeUndefined();
    expect(openToValueToToken(undefined)).toBeUndefined();
    expect(openToValueToToken(null)).toBeUndefined();
    expect(openToValueToToken('')).toBeUndefined();
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
    expect(getPlatformLabel('codeberg')).toBe('Codeberg');
    expect(getPlatformLabel('gitlab')).toBe('GitLab');
    expect(getPlatformLabel('forgejo')).toBe('Forgejo');
    expect(getPlatformLabel('gitea')).toBe('Gitea');
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

  it('carries subCategory onto the merged skill when the first row lacks it', () => {
    const input: ProfileSkill[] = [
      { rkey: 'a', name: 'Ruby' },
      { rkey: 'b', name: 'ruby', subCategory: 'Backend' },
    ];
    const merged = dedupeSkills(input);
    expect(merged[0]?.subCategory).toBe('Backend');
  });
});

describe('groupSkillsBySubCategory', () => {
  it('groups by subCategory alphabetically with the ungrouped bucket last', () => {
    const skills: ProfileSkill[] = [
      { rkey: '1', name: 'Loose' },
      { rkey: '2', name: 'React', subCategory: 'Frontend' },
      { rkey: '3', name: 'Postgres', subCategory: 'Databases' },
      { rkey: '4', name: 'Svelte', subCategory: 'frontend' },
    ];
    const groups = groupSkillsBySubCategory(skills);
    expect(groups.map(([k]) => k)).toEqual(['Databases', 'Frontend', null]);
  });

  it('merges case-insensitive subCategory labels under the first-seen casing', () => {
    const skills: ProfileSkill[] = [
      { rkey: '1', name: 'React', subCategory: 'Frontend' },
      { rkey: '2', name: 'Svelte', subCategory: 'frontend' },
    ];
    const groups = groupSkillsBySubCategory(skills);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.[0]).toBe('Frontend');
    expect(groups[0]?.[1]).toHaveLength(2);
  });

  it('sorts within a group by endorsementCount desc then name', () => {
    const skills: ProfileSkill[] = [
      { rkey: '1', name: 'React', subCategory: 'Frontend', endorsementCount: 1 },
      { rkey: '2', name: 'Vue', subCategory: 'Frontend', endorsementCount: 5 },
      { rkey: '3', name: 'Svelte', subCategory: 'Frontend', endorsementCount: 5 },
    ];
    const groups = groupSkillsBySubCategory(skills);
    expect(groups[0]?.[1].map((s) => s.name)).toEqual(['Svelte', 'Vue', 'React']);
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
