/**
 * Canonical metadata for the votable Sifa roadmap items: a one-line description
 * and the sifa-workspace issue(s) tracking each item. Single source of truth
 * shared by the sifa-web /roadmap page (labels come from i18n; description and
 * issue links come from here) and the sifa-api operator script that writes the
 * matching userinput.app discussion bodies, so the two surfaces cannot drift.
 *
 * Keys match VOTABLE_KEYS in sifa-api and the roadmap item keys in sifa-web.
 * Descriptions are product voice.
 */

/** Repository whose issues track roadmap items. */
export const ROADMAP_ISSUES_REPO = 'singi-labs/sifa-workspace';

export interface RoadmapItemMeta {
  /** One-line description of the item, in product voice. */
  description: string;
  /** sifa-workspace issue numbers tracking this item (may be empty). */
  issues: number[];
}

export const ROADMAP_ITEM_META: Record<string, RoadmapItemMeta> = {
  endorsementsAttestations: {
    description:
      'Let colleagues vouch for your skills and experience, recorded as attestations you carry with you.',
    issues: [3, 166],
  },
  notifications: {
    description: 'Get told when someone endorses you, links a company, or acts on your profile.',
    issues: [158],
  },
  verifiedConnections: {
    description: 'Confirm real working relationships, not just follows.',
    issues: [],
  },
  profileAnalytics: {
    description: 'See who views your profile and how people find you.',
    issues: [],
  },
  jobProfiles: {
    description: 'Structured work history that stays with your identity across the network.',
    issues: [102],
  },
  eventRsvp: {
    description: "Show the talks and events you're attending or speaking at.",
    issues: [214],
  },
  companyPages: {
    description: 'Claimable organization pages that link the people who work there.',
    issues: [73],
  },
  advancedSearch: {
    description: 'Search across categories, with filters and forgiving name matching.',
    issues: [5],
  },
  multiAccountLinking: {
    description: 'Tie several atproto accounts to one professional identity.',
    issues: [8],
  },
  mobileApps: {
    description: 'Native iOS and Android apps.',
    issues: [114],
  },
  atmosphereStream: {
    description: 'One feed that gathers your activity from across the atproto network.',
    issues: [7, 12],
  },
  localizationMultiLanguage: {
    description: 'The interface in your own language.',
    issues: [218],
  },
  rssFediverseIngestion: {
    description: 'Pull in posts from RSS feeds and the Fediverse.',
    issues: [111],
  },
  githubFeedIngestion: {
    description: 'Bring your GitHub activity into your track record.',
    issues: [95],
  },
  compensationInformation: {
    description: 'Add optional pay and compensation context to your roles.',
    issues: [81],
  },
  embedCustomization: {
    description: 'Choose which fields show in your embeddable profile card.',
    issues: [117],
  },
  academicLexicon: {
    description: 'Schema and features built for researchers and academics.',
    issues: [119, 148],
  },
  journalismLexicon: {
    description: 'Schema and features built for journalists.',
    issues: [121],
  },
  skillEvidenceGithub: {
    description: 'Back up skill claims with the languages in your GitHub repositories.',
    issues: [107],
  },
  latexCvExport: {
    description: 'Export your profile as a LaTeX CV.',
    issues: [113],
  },
  jsonResumeImportExport: {
    description: 'Move your profile in and out using the JSON Resume standard.',
    issues: [151],
  },
  linkedClaimsResearch: {
    description: 'Exploring the LinkedClaims spec for portable, verifiable endorsements.',
    issues: [155],
  },
};

/** The GitHub issue URL for a sifa-workspace issue number. */
export function roadmapIssueUrl(issue: number): string {
  return `https://github.com/${ROADMAP_ISSUES_REPO}/issues/${issue}`;
}
