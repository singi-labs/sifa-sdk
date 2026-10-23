/**
 * Splits a roadmap board item's body into its description and the issues
 * tracking it. Operator-written items end with a line like
 * `Tracking: https://github.com/singi-labs/sifa-workspace/issues/<n>, ...`.
 * Only issues in {@link ROADMAP_ISSUES_REPO} become links, and a tracking line
 * is removed from the description only when every entry on it is one of them,
 * so text written by anyone else is never lost.
 */
import { ROADMAP_ISSUES_REPO, roadmapIssueUrl } from './index.js';

export interface RoadmapIssueLink {
  number: number;
  url: string;
}

export interface RoadmapBodyParts {
  description: string | null;
  issues: RoadmapIssueLink[];
}

const TRACKING_LINE = /^tracking:\s*(.+)$/i;
const ISSUE_URL = new RegExp(
  `^https://github\\.com/${ROADMAP_ISSUES_REPO.replace(/[.-]/g, '\\$&')}/issues/(\\d+)$`,
);

/** Issue numbers on a tracking line, or null when any entry is not a roadmap issue. */
function parseTrackingLine(entries: string): number[] | null {
  const numbers: number[] = [];
  for (const raw of entries.split(/[,\s]+/)) {
    const candidate = raw.replace(/^</, '').replace(/[>.,;)]+$/, '');
    if (!candidate) continue;
    const match = ISSUE_URL.exec(candidate);
    if (!match) return null;
    numbers.push(Number(match[1]));
  }
  return numbers.length > 0 ? numbers : null;
}

export function splitRoadmapBody(body: string | null | undefined): RoadmapBodyParts {
  const issues: RoadmapIssueLink[] = [];
  const kept: string[] = [];
  for (const line of (body ?? '').split('\n')) {
    const tracking = TRACKING_LINE.exec(line.trim());
    const numbers = tracking ? parseTrackingLine(tracking[1] ?? '') : null;
    if (!numbers) {
      kept.push(line);
      continue;
    }
    for (const number of numbers) issues.push({ number, url: roadmapIssueUrl(number) });
  }
  const description = kept.join('\n').trim();
  return { description: description || null, issues };
}
