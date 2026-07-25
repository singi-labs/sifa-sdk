/**
 * Profile dimensions -- the routing signal used by the Sifa homepage to choose
 * between the V3 "still building" and V4 "established" variants.
 *
 * Six binary signals, equal weight: avatar, headline, about, current position,
 * minimum-skill threshold, and at least one education entry. The routing
 * threshold itself (e.g. ">= 4 of 6 -> ESTABLISHED") lives in the consumer
 * because different surfaces may want to cut at different bars over time.
 *
 * Canonical source of truth for dimension scoring across Sifa clients.
 * sifa-api computes the underlying `ProfileDimensionInputs` shape inline
 * (in SQL on the session route) but defers scoring to this module so the
 * frontend and backend cannot drift on what "filled" means.
 *
 * See `docs/plans/2026-04-27-homepage-variants.md` (sifa-web) for the
 * history of why these six were chosen over the original eight.
 */

import type { Profile, ProfilePosition } from '../types/index.js';

export const DIMENSIONS_MAX_SCORE = 6;
export const MIN_SKILLS = 3;

export type DimensionKey =
  'avatar' | 'headline' | 'about' | 'currentPosition' | 'skills' | 'education';

export type DimensionMap = Record<DimensionKey, boolean>;

/**
 * Minimal raw inputs needed to compute the dimension map. sifa-api can
 * populate this from a single composite SQL query without loading the full
 * Profile shape, which is the whole point of putting this in the SDK.
 */
export interface ProfileDimensionInputs {
  hasAvatar: boolean;
  hasHeadline: boolean;
  hasAbout: boolean;
  currentPositionCount: number;
  skillCount: number;
  educationCount: number;
}

function nonEmptyString(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Pure-TS computation of the 6-key boolean map from minimal inputs.
 * Use this when you already have aggregate counts (e.g. server-side).
 */
export function dimensionsFromInputs(inputs: ProfileDimensionInputs): DimensionMap {
  return {
    avatar: inputs.hasAvatar,
    headline: inputs.hasHeadline,
    about: inputs.hasAbout,
    currentPosition: inputs.currentPositionCount > 0,
    skills: inputs.skillCount >= MIN_SKILLS,
    education: inputs.educationCount > 0,
  };
}

/**
 * Derives `ProfileDimensionInputs` from a full Profile. Use this on the
 * client when you already have the profile loaded.
 */
export function profileToDimensionInputs(profile: Profile): ProfileDimensionInputs {
  const positions = profile.positions ?? [];
  const skills = profile.skills ?? [];
  const education = profile.education ?? [];
  const currentPositionCount = positions.filter((p: ProfilePosition) => !p.endedAt).length;
  return {
    hasAvatar: nonEmptyString(profile.avatar),
    hasHeadline: nonEmptyString(profile.headline),
    hasAbout: nonEmptyString(profile.about),
    currentPositionCount,
    skillCount: skills.length,
    educationCount: education.length,
  };
}

/** Convenience: full Profile -> dimension boolean map. */
export function getFilledDimensionsMap(profile: Profile): DimensionMap {
  return dimensionsFromInputs(profileToDimensionInputs(profile));
}

/** Count of filled dimensions, 0..6. Accepts either raw inputs or a full Profile. */
export function countFilledDimensions(input: ProfileDimensionInputs | Profile): number {
  const map = 'hasAvatar' in input ? dimensionsFromInputs(input) : getFilledDimensionsMap(input);
  let n = 0;
  for (const v of Object.values(map)) {
    if (v) n++;
  }
  return n;
}
