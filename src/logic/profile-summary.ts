/**
 * Compact professional summary derived from a {@link ProfileView}.
 *
 * The full `id.sifa.getProfileView` payload carries every section (all
 * positions, education, skills, publications, talks, and more). Third-party
 * surfaces that only want to show "who is this, what do they do now" — a badge,
 * a maintainer card, a byline — need a much smaller shape. This is that shape,
 * derived with the same canonical rules the Sifa web app uses (see
 * {@link pickPrimaryPosition}) so an embedded summary matches the profile page.
 *
 * Pure and I/O-free: pass it a view you already fetched. For the fetch +
 * summarize convenience, use `fetchProfileSummary` from `@singi-labs/sifa-sdk`.
 */

import type { ProfileView } from '../types/profile-view.js';
import { pickPrimaryPosition } from './primary-position.js';

export interface ProfileSummary {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  pronouns?: string;
  headline?: string;
  /** Title of the current primary role, if the person has an active position. */
  currentTitle?: string;
  /** Current employer: the resolved entity name when linked, else the free-text company. */
  currentCompany?: string;
  /** Skill names in the order the AppView returns them, capped by `maxSkills`. */
  topSkills: string[];
  /** Whether the profile is claimed by its owner (vs an unclaimed placeholder). */
  claimed: boolean;
}

export interface SummarizeProfileViewOptions {
  /** Maximum number of skills to include in `topSkills`. Default 5; negatives clamp to 0. */
  maxSkills?: number;
}

const DEFAULT_MAX_SKILLS = 5;

export function summarizeProfileView(
  view: ProfileView,
  options: SummarizeProfileViewOptions = {},
): ProfileSummary {
  const limit = Math.max(0, options.maxSkills ?? DEFAULT_MAX_SKILLS);
  const primary = pickPrimaryPosition(view.positions);

  return {
    did: view.did,
    handle: view.handle,
    displayName: view.displayName,
    avatar: view.avatar,
    pronouns: view.pronouns,
    headline: view.headline,
    currentTitle: primary?.title,
    currentCompany: primary ? (primary.entityName ?? primary.company) : undefined,
    topSkills: (view.skills ?? []).slice(0, limit).map((s) => s.name),
    claimed: view.claimed ?? false,
  };
}
