/**
 * Profile completeness scoring.
 *
 * Six binary signals, equal weight: headline filled, about filled, has at least
 * one position, education, skill, certification.
 *
 * Score: integer 0..6. Percent: round(score / 6 * 100) -- discrete values
 * {0, 17, 33, 50, 67, 83, 100}.
 *
 * Canonical source of truth for completeness scoring across Sifa clients.
 * sifa-api computes the underlying `ProfileCompletion` shape inline (in SQL
 * for admin-stats queries, in route handlers elsewhere) but defers scoring
 * to this module.
 */

export const COMPLETENESS_MAX_SCORE = 6;

export interface ProfileCompletion {
  hasHeadline: boolean;
  hasAbout: boolean;
  positionCount: number;
  educationCount: number;
  skillCount: number;
  certificationCount: number;
}

/** Pure-TS computation of the 0..6 score. */
export function completenessScore(c: ProfileCompletion): number {
  let filled = 0;
  if (c.hasHeadline) filled++;
  if (c.hasAbout) filled++;
  if (c.positionCount > 0) filled++;
  if (c.educationCount > 0) filled++;
  if (c.skillCount > 0) filled++;
  if (c.certificationCount > 0) filled++;
  return filled;
}

/** Completion as a rounded 0..100 integer percent (matches API serialisation). */
export function completenessPercent(c: ProfileCompletion): number {
  return Math.round((completenessScore(c) / COMPLETENESS_MAX_SCORE) * 100);
}
