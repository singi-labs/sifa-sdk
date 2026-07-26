import type { ProfileSkill } from '../types/index.js';

import { groupSkillsBySubCategory } from './skill-grouping.js';

export interface SkillDisplayGroups<T extends ProfileSkill> {
  /** Sub-groups for one category; a `null` label is the unlabelled bucket. */
  groups: [string | null, T[]][];
  /**
   * Whether sub-category labels carry information here. False when the category
   * has fewer than two distinct sub-categories, where a lone label says nothing
   * the category heading does not already say.
   */
  showLabels: boolean;
}

export interface SkillDisplayGroupsOptions {
  /**
   * Put the unlabelled bucket first instead of last. Inline chip rendering
   * reads fine with it trailing, but in a linear document (markdown, docx,
   * print) trailing unlabelled entries appear to belong to the sub-heading
   * above them, so documents want it directly under the category heading.
   */
  ungroupedFirst?: boolean;
}

/**
 * Prepares one category's skills for display: the sub-groups, plus whether to
 * label them (the render rule from #314).
 *
 * Shared so the profile, print, markdown and docx surfaces group identically
 * rather than each re-deriving the threshold.
 */
export function groupSkillsForDisplay<T extends ProfileSkill>(
  skills: T[],
  options: SkillDisplayGroupsOptions = {},
): SkillDisplayGroups<T> {
  const grouped = groupSkillsBySubCategory(skills);
  const labelled = grouped.filter(([label]) => label !== null);

  const groups = options.ungroupedFirst
    ? [...grouped.filter(([label]) => label === null), ...labelled]
    : grouped;

  return { groups, showLabels: labelled.length >= 2 };
}
