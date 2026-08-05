/**
 * Meta description for a profile page.
 *
 * Ported from sifa-web so the description and the JSON-LD `jobTitle` are
 * derived from one place. They previously used different rules for "which
 * position is current" and could name different roles on the same page.
 */

import { pickPrimaryPosition } from '../logic/primary-position.js';
import { filterHidden } from '../profile/section-model.js';
import type { LocationValue } from '../types/index.js';
import { formatLocation } from './location-utils.js';

/**
 * Treat a headline as meaningful only when it contains at least one letter or
 * digit. Profiles carry headlines that are a single emoji, which reads as
 * garbage in a search result snippet.
 */
const MEANINGFUL_TEXT_RE = /[\p{L}\p{N}]/u;

export interface MetaDescriptionPosition {
  readonly company?: string;
  readonly title?: string;
  readonly startedAt?: string;
  readonly endedAt?: string;
  readonly primary?: boolean;
  readonly hidden?: boolean;
}

export interface MetaDescriptionInput {
  readonly handle: string;
  readonly displayName?: string;
  readonly headline?: string;
  readonly location?: LocationValue | null;
  readonly positions?: readonly MetaDescriptionPosition[];
}

export function buildMetaDescription(profile: MetaDescriptionInput): string {
  const parts: string[] = [];

  if (typeof profile.headline === 'string' && MEANINGFUL_TEXT_RE.test(profile.headline)) {
    parts.push(profile.headline);
  }

  const positions = filterHidden(profile.positions ? [...profile.positions] : undefined);
  const currentPosition = pickPrimaryPosition(positions);
  if (currentPosition) {
    const positionParts: string[] = [];
    if (currentPosition.title) positionParts.push(currentPosition.title);
    if (currentPosition.company) positionParts.push(`at ${currentPosition.company}`);
    if (positionParts.length > 0) parts.push(positionParts.join(' '));
  }

  if (profile.location) {
    parts.push(formatLocation(profile.location));
  }

  if (parts.length === 0) {
    return `${profile.displayName ?? profile.handle} on Sifa`;
  }

  return parts.join(' · ');
}
