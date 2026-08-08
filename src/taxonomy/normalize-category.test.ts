import { describe, it, expect } from 'vitest';

import { normalizeSkillCategory } from './skill-categories.js';
import { groupSkillsByCategory } from './skill-grouping.js';
import type { ProfileSkill } from '../types/index.js';

describe('normalizeSkillCategory', () => {
  it('passes a bare token through', () => {
    expect(normalizeSkillCategory('technical')).toBe('technical');
  });

  it('strips the lexicon ref prefix', () => {
    // id.sifa.profile.skill publishes these as its knownValues, so a client
    // writing the ref form is following the lexicon, not misbehaving.
    expect(normalizeSkillCategory('id.sifa.defs#technical')).toBe('technical');
  });

  it('strips any nsid, not just id.sifa.defs', () => {
    expect(normalizeSkillCategory('com.example.defs#creative')).toBe('creative');
  });

  it('lowercases and trims', () => {
    expect(normalizeSkillCategory('  Technical  ')).toBe('technical');
    expect(normalizeSkillCategory('id.sifa.defs#Creative')).toBe('creative');
  });

  it('returns undefined for absent or empty input', () => {
    expect(normalizeSkillCategory(undefined)).toBeUndefined();
    expect(normalizeSkillCategory('')).toBeUndefined();
    expect(normalizeSkillCategory('   ')).toBeUndefined();
    expect(normalizeSkillCategory('#')).toBeUndefined();
  });

  it('keeps an unrecognised value rather than inventing one', () => {
    // Callers bucket unknowns as "other"; normalising is not validating.
    expect(normalizeSkillCategory('id.sifa.defs#nonsense')).toBe('nonsense');
  });
});

describe('groupSkillsByCategory with lexicon ref values', () => {
  const skill = (rkey: string, name: string, category?: string): ProfileSkill => ({
    rkey,
    name,
    category,
  });

  it('groups a ref-form category under its real category, not "other"', () => {
    const groups = groupSkillsByCategory([skill('a', 'React', 'id.sifa.defs#technical')]);

    expect(groups.map(([key]) => key)).toEqual(['technical']);
  });

  it('merges ref-form and bare-token skills into one group', () => {
    const groups = groupSkillsByCategory([
      skill('a', 'React', 'id.sifa.defs#technical'),
      skill('b', 'Fastify', 'technical'),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.[0]).toBe('technical');
    expect(groups[0]?.[1]).toHaveLength(2);
  });

  it('still buckets a genuinely unknown category as other', () => {
    const groups = groupSkillsByCategory([skill('a', 'Thing', 'id.sifa.defs#nonsense')]);

    expect(groups.map(([key]) => key)).toEqual(['other']);
  });

  it('still buckets a missing category as other', () => {
    const groups = groupSkillsByCategory([skill('a', 'Thing')]);

    expect(groups.map(([key]) => key)).toEqual(['other']);
  });
});
