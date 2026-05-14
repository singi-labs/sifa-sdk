import type { ProfileSkill } from '../types/index.js';

import { CATEGORY_ORDER } from './skill-categories.js';

export type MergedProfileSkill = ProfileSkill & {
  mergedRkeys: string[];
  positionRkeys?: string[];
};

/**
 * Collapses skills that resolve to the same name (case-insensitive, trimmed).
 *
 * LinkedIn import creates one skill record per (skill, position) pair, so a
 * profile can have several "Ruby" rows. We surface them as a single chip with
 * all underlying rkeys exposed via `mergedRkeys` so edit/delete can fan out.
 */
export function dedupeSkills(skills: ProfileSkill[]): MergedProfileSkill[] {
  const groups = new Map<string, MergedProfileSkill>();

  for (const skill of skills) {
    const key = skill.name.trim().toLowerCase();
    const existing = groups.get(key);
    const positions = (skill as ProfileSkill & { positionRkeys?: string[] }).positionRkeys ?? [];

    if (!existing) {
      groups.set(key, {
        ...skill,
        mergedRkeys: [skill.rkey],
        positionRkeys: [...positions],
      });
      continue;
    }

    existing.mergedRkeys.push(skill.rkey);
    if (!existing.category && skill.category) existing.category = skill.category;
    if ((skill.endorsementCount ?? 0) > (existing.endorsementCount ?? 0)) {
      existing.endorsementCount = skill.endorsementCount;
    }
    if (skill.endorsed) existing.endorsed = true;
    if (skill.activityBacked) existing.activityBacked = true;
    const merged = new Set([...(existing.positionRkeys ?? []), ...positions]);
    existing.positionRkeys = Array.from(merged);
  }

  return Array.from(groups.values());
}

/**
 * Groups skills by category in CATEGORY_ORDER, with unknown/empty categories
 * collected under "other". Within each group: sorted by endorsementCount desc,
 * then alphabetical by name. Empty groups are omitted.
 */
export function groupSkillsByCategory<T extends ProfileSkill>(skills: T[]): [string, T[]][] {
  const grouped = new Map<string, T[]>();

  for (const skill of skills) {
    const normalised = skill.category?.toLowerCase().trim() ?? '';
    const key = (CATEGORY_ORDER as readonly string[]).includes(normalised) ? normalised : 'other';
    const bucket = grouped.get(key) ?? [];
    bucket.push(skill);
    grouped.set(key, bucket);
  }

  for (const [, groupSkills] of grouped) {
    groupSkills.sort((a, b) => {
      const countDiff = (b.endorsementCount ?? 0) - (a.endorsementCount ?? 0);
      if (countDiff !== 0) return countDiff;
      return a.name.localeCompare(b.name);
    });
  }

  const ordered: [string, T[]][] = [];
  for (const cat of CATEGORY_ORDER) {
    const group = grouped.get(cat);
    if (group?.length) ordered.push([cat, group]);
  }
  const otherGroup = grouped.get('other');
  if (otherGroup?.length) ordered.push(['other', otherGroup]);

  return ordered;
}
