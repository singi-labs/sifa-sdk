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

const TRACKING_PREFIX = 'tracking:';
const ISSUE_PATH_PREFIX = `/${ROADMAP_ISSUES_REPO}/issues/`;
const TRAILING_PUNCTUATION = new Set(['>', '.', ',', ';', ')']);

/** The issue number when `candidate` is an issue URL in the roadmap repo. */
function roadmapIssueNumber(candidate: string): number | null {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
  if (url.search || url.hash || !url.pathname.startsWith(ISSUE_PATH_PREFIX)) return null;
  const rest = url.pathname.slice(ISSUE_PATH_PREFIX.length);
  if (rest.length === 0 || rest.length > 9) return null;
  for (const ch of rest) if (ch < '0' || ch > '9') return null;
  return Number(rest);
}

function trimEntry(raw: string): string {
  const start = raw.startsWith('<') ? 1 : 0;
  let end = raw.length;
  while (end > start && TRAILING_PUNCTUATION.has(raw[end - 1] ?? '')) end--;
  return raw.slice(start, end);
}

/** Issue numbers on a tracking line, or null when any entry is not a roadmap issue. */
function parseTrackingLine(entries: string): number[] | null {
  const numbers: number[] = [];
  for (const raw of entries.split(',').flatMap((part) => part.split(' '))) {
    const candidate = trimEntry(raw.trim());
    if (!candidate) continue;
    const number = roadmapIssueNumber(candidate);
    if (number === null) return null;
    numbers.push(number);
  }
  return numbers.length > 0 ? numbers : null;
}

export function splitRoadmapBody(body: string | null | undefined): RoadmapBodyParts {
  const issues: RoadmapIssueLink[] = [];
  const kept: string[] = [];
  for (const line of (body ?? '').split('\n')) {
    const trimmed = line.trim();
    const numbers = trimmed.toLowerCase().startsWith(TRACKING_PREFIX)
      ? parseTrackingLine(trimmed.slice(TRACKING_PREFIX.length))
      : null;
    if (!numbers) {
      kept.push(line);
      continue;
    }
    for (const number of numbers) issues.push({ number, url: roadmapIssueUrl(number) });
  }
  const description = kept.join('\n').trim();
  return { description: description || null, issues };
}
