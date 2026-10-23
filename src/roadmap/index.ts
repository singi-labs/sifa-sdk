/**
 * Where Sifa roadmap items are tracked. The items themselves live on Sifa's
 * userinput.app board; see `fetchRoadmap` and `splitRoadmapBody`.
 */

/** Repository whose issues track roadmap items. */
export const ROADMAP_ISSUES_REPO = 'singi-labs/sifa-workspace';

/** The GitHub issue URL for a sifa-workspace issue number. */
export function roadmapIssueUrl(issue: number): string {
  return `https://github.com/${ROADMAP_ISSUES_REPO}/issues/${issue}`;
}
