import type { ProfileSkill } from '../types/index.js';

import { CATEGORY_ORDER, normalizeSkillCategory } from './skill-categories.js';

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
    const incomingSubCategory = skill.subCategory?.trim();
    if (incomingSubCategory && !existing.subCategory?.trim()) {
      existing.subCategory = incomingSubCategory;
    }
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
    // Accepts the lexicon's own ref form (id.sifa.defs#technical) as well as
    // the bare token, so a record written to spec is not bucketed as "other".
    const normalised = normalizeSkillCategory(skill.category) ?? '';
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

/**
 * Groups skills by their freeform `subCategory` label (#305), for renderers
 * that present skills in the user's own groups (Frontend, Backend, etc.).
 *
 * Labels are matched case-insensitively and surfaced under the first-seen
 * casing. Groups are ordered alphabetically by label; skills with no
 * `subCategory` collect under a trailing `null` bucket (omitted when empty).
 * Within each group: endorsementCount desc, then alphabetical by name.
 */
export function groupSkillsBySubCategory<T extends ProfileSkill>(
  skills: T[],
): [string | null, T[]][] {
  const labels = new Map<string, string>();
  const grouped = new Map<string, T[]>();

  for (const skill of skills) {
    const raw = skill.subCategory?.trim();
    const key = raw ? raw.toLowerCase() : '';
    if (raw && !labels.has(key)) labels.set(key, raw);
    const bucket = grouped.get(key) ?? [];
    bucket.push(skill);
    grouped.set(key, bucket);
  }

  // Clone before sorting so the caller's arrays are never mutated in place.
  const sortByRank = (groupSkills: T[]): T[] =>
    [...groupSkills].sort((a, b) => {
      const countDiff = (b.endorsementCount ?? 0) - (a.endorsementCount ?? 0);
      if (countDiff !== 0) return countDiff;
      return a.name.localeCompare(b.name);
    });

  const ordered: [string | null, T[]][] = [];
  for (const key of [...labels.keys()].sort((a, b) => a.localeCompare(b))) {
    const label = labels.get(key);
    const group = grouped.get(key);
    if (label && group?.length) ordered.push([label, sortByRank(group)]);
  }
  const ungrouped = grouped.get('');
  if (ungrouped?.length) ordered.push([null, sortByRank(ungrouped)]);

  return ordered;
}
