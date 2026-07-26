import { describe, it, expect } from 'vitest';

import { groupSkillsForDisplay } from './skill-display-groups.js';
import type { ProfileSkill } from '../types/index.js';

function skill(name: string, subCategory?: string): ProfileSkill {
  return { rkey: name.toLowerCase(), name, category: 'technical', subCategory };
}

describe('groupSkillsForDisplay', () => {
  it('labels sub-categories once a category has two of them', () => {
    const { groups, showLabels } = groupSkillsForDisplay([
      skill('React', 'Frontend'),
      skill('Fastify', 'Backend'),
    ]);

    expect(showLabels).toBe(true);
    expect(groups.map(([label]) => label)).toEqual(['Backend', 'Frontend']);
  });

  it('withholds labels when only one sub-category is present', () => {
    const { showLabels } = groupSkillsForDisplay([
      skill('React', 'Frontend'),
      skill('Vue', 'Frontend'),
      skill('Bash'),
    ]);

    expect(showLabels).toBe(false);
  });

  it('withholds labels when no skill carries a sub-category', () => {
    const { groups, showLabels } = groupSkillsForDisplay([skill('React'), skill('Fastify')]);

    expect(showLabels).toBe(false);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.[0]).toBeNull();
  });

  it('trails the unlabelled bucket by default, matching inline chip rendering', () => {
    const { groups } = groupSkillsForDisplay([
      skill('Bash'),
      skill('React', 'Frontend'),
      skill('Fastify', 'Backend'),
    ]);

    expect(groups.map(([label]) => label)).toEqual(['Backend', 'Frontend', null]);
  });

  it('hoists the unlabelled bucket first when asked, for linear documents', () => {
    // In a document the unlabelled skills must sit directly under the category
    // heading; trailing them would read as belonging to the last sub-heading.
    const { groups } = groupSkillsForDisplay(
      [skill('Bash'), skill('React', 'Frontend'), skill('Fastify', 'Backend')],
      { ungroupedFirst: true },
    );

    expect(groups.map(([label]) => label)).toEqual([null, 'Backend', 'Frontend']);
  });

  it('is a no-op reorder when there is no unlabelled bucket', () => {
    const { groups } = groupSkillsForDisplay(
      [skill('React', 'Frontend'), skill('Fastify', 'Backend')],
      { ungroupedFirst: true },
    );

    expect(groups.map(([label]) => label)).toEqual(['Backend', 'Frontend']);
  });

  it('returns no groups for no skills', () => {
    const { groups, showLabels } = groupSkillsForDisplay([]);

    expect(groups).toEqual([]);
    expect(showLabels).toBe(false);
  });

  it('counts sub-categories case-insensitively, as the grouping does', () => {
    const { showLabels } = groupSkillsForDisplay([
      skill('React', 'Frontend'),
      skill('Vue', 'frontend'),
    ]);

    expect(showLabels).toBe(false);
  });

  it('keeps the ranking the grouping applies within each bucket', () => {
    const endorsed: ProfileSkill = {
      rkey: 'b',
      name: 'Beta',
      category: 'technical',
      subCategory: 'Frontend',
      endorsementCount: 5,
    };
    const plain: ProfileSkill = {
      rkey: 'a',
      name: 'Alpha',
      category: 'technical',
      subCategory: 'Frontend',
    };
    const { groups } = groupSkillsForDisplay([plain, endorsed, skill('X', 'Backend')]);
    const frontend = groups.find(([label]) => label === 'Frontend');

    expect(frontend?.[1].map((s) => s.name)).toEqual(['Beta', 'Alpha']);
  });
});
