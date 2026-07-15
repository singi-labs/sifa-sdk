/**
 * Per-section item sorts, shared by every profile surface so ordering can't
 * diverge between the HTML page and the Markdown / DOCX / print exports and the
 * standalone personal-site renderer. Thin wrappers over the SDK date extractors
 * plus the range/language sorts in this directory.
 */

import type {
  ProfilePosition,
  ProfileEducation,
  ProfileProject,
  ProfilePublication,
  ProfileCertification,
  ProfileHonor,
  ProfileLanguage,
} from '../types/index.js';
import {
  sortByDateDesc,
  lexiconDateExtractor,
  singleDateExtractor,
  certDateExtractor,
} from '../format/sort-by-date.js';
import { sortByActiveDateRange } from './range-sort.js';
import { sortLanguagesByProficiency } from './language-sort.js';

/**
 * Move a `primary && !endedAt` position to the top, matching the HTML career
 * section, so the current primary role always leads.
 */
export function hoistPrimary(positions: ProfilePosition[]): ProfilePosition[] {
  const idx = positions.findIndex((p) => p.primary && !p.endedAt);
  if (idx <= 0) return positions;
  const primary = positions[idx]!;
  return [primary, ...positions.slice(0, idx), ...positions.slice(idx + 1)];
}

export const sortPositions = (items: ProfilePosition[]): ProfilePosition[] =>
  hoistPrimary(sortByDateDesc(items, lexiconDateExtractor));

export const sortEducation = (items: ProfileEducation[]): ProfileEducation[] =>
  sortByDateDesc(items, lexiconDateExtractor);

export const sortProjects = (items: ProfileProject[]): ProfileProject[] =>
  sortByActiveDateRange(items);

export const sortPublications = (items: ProfilePublication[]): ProfilePublication[] =>
  sortByDateDesc(items, singleDateExtractor);

export const sortCertifications = (items: ProfileCertification[]): ProfileCertification[] =>
  sortByDateDesc(items, certDateExtractor);

export const sortHonors = (items: ProfileHonor[]): ProfileHonor[] =>
  sortByDateDesc(items, singleDateExtractor);

export const sortLanguages = (items: ProfileLanguage[]): ProfileLanguage[] =>
  sortLanguagesByProficiency(items);
