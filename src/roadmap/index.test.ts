import { describe, expect, it } from 'vitest';

import { ROADMAP_ITEM_META, roadmapIssueUrl } from './index.js';

// The votable roadmap keys (mirrors VOTABLE_KEYS in sifa-api). Kept here so a
// drift between the shared metadata and the votable set fails the SDK build.
const VOTABLE_KEYS = [
  'endorsementsAttestations',
  'notifications',
  'verifiedConnections',
  'profileAnalytics',
  'jobProfiles',
  'eventRsvp',
  'companyPages',
  'advancedSearch',
  'multiAccountLinking',
  'mobileApps',
  'atmosphereStream',
  'localizationMultiLanguage',
  'rssFediverseIngestion',
  'githubFeedIngestion',
  'compensationInformation',
  'embedCustomization',
  'academicLexicon',
  'journalismLexicon',
  'skillEvidenceGithub',
  'latexCvExport',
  'jsonResumeImportExport',
  'linkedClaimsResearch',
];

describe('ROADMAP_ITEM_META', () => {
  it('covers exactly the votable keys', () => {
    expect(new Set(Object.keys(ROADMAP_ITEM_META))).toEqual(new Set(VOTABLE_KEYS));
  });

  it('gives every item a non-empty description', () => {
    for (const [key, meta] of Object.entries(ROADMAP_ITEM_META)) {
      expect(meta.description.trim().length, `empty description for ${key}`).toBeGreaterThan(0);
    }
  });

  it('uses positive integer issue numbers', () => {
    for (const [key, meta] of Object.entries(ROADMAP_ITEM_META)) {
      for (const n of meta.issues) {
        expect(Number.isInteger(n) && n > 0, `bad issue ${n} on ${key}`).toBe(true);
      }
    }
  });

  it('builds sifa-workspace issue URLs', () => {
    expect(roadmapIssueUrl(114)).toBe('https://github.com/singi-labs/sifa-workspace/issues/114');
  });
});
