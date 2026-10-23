/**
 * Splits a roadmap board item's body into its description and the GitHub
 * issues tracking it. Operator-written items end with a line like
 * `Tracking: https://github.com/<owner>/<repo>/issues/<n>, ...`. Only GitHub
 * issue URLs become links; everything else stays plain text.
 */

export interface RoadmapIssueLink {
  number: number;
  url: string;
}

export interface RoadmapBodyParts {
  description: string | null;
  issues: RoadmapIssueLink[];
}

const TRACKING_LINE = /^tracking:\s*(.*)$/i;
const GITHUB_ISSUE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/(\d+)$/;

export function splitRoadmapBody(body: string | null | undefined): RoadmapBodyParts {
  const issues: RoadmapIssueLink[] = [];
  const kept: string[] = [];
  for (const line of (body ?? '').split('\n')) {
    const tracking = TRACKING_LINE.exec(line.trim());
    if (!tracking) {
      kept.push(line);
      continue;
    }
    for (const candidate of (tracking[1] ?? '').split(/[,\s]+/)) {
      const match = GITHUB_ISSUE.exec(candidate);
      if (match) issues.push({ number: Number(match[1]), url: candidate });
    }
  }
  const description = kept.join('\n').trim();
  return { description: description || null, issues };
}
