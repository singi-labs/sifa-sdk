import { getInvolvementKindHeading } from '../taxonomy/involvement-kind.js';
import type { ProfileInvolvement } from '../types/index.js';

/**
 * Fixed display order of involvement headings. A group renders only when it has
 * records. Charity + mapped legacy volunteering fall under "Volunteering".
 */
export const INVOLVEMENT_HEADING_ORDER = [
  'Open Source',
  'Community',
  'Volunteering',
  'Civic',
  'Other',
] as const;

export interface InvolvementGroup {
  heading: string;
  items: ProfileInvolvement[];
}

/**
 * Group involvement records by their kind's display heading, in the fixed order
 * above, most-recent first within a group. Empty groups are omitted. An unknown
 * kind falls under "Other" (via the shared heading map).
 */
export function groupInvolvementByHeading(items: ProfileInvolvement[]): InvolvementGroup[] {
  const byHeading = new Map<string, ProfileInvolvement[]>();
  for (const item of items) {
    const heading = getInvolvementKindHeading(item.kind);
    const bucket = byHeading.get(heading) ?? [];
    bucket.push(item);
    byHeading.set(heading, bucket);
  }
  const recency = (i: ProfileInvolvement) => i.endedAt ?? i.startedAt ?? '';
  const groups: InvolvementGroup[] = [];
  for (const heading of INVOLVEMENT_HEADING_ORDER) {
    const bucket = byHeading.get(heading);
    if (!bucket?.length) continue;
    const sorted = [...bucket].sort((a, b) => recency(b).localeCompare(recency(a)));
    groups.push({ heading, items: sorted });
  }
  return groups;
}
