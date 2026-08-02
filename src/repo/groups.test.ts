import { describe, expect, it } from 'vitest';

import { SIFA_REPO_GROUPS, repoGroupForCollection, type RepoGroupId } from './groups.js';

/**
 * Every id.sifa.* collection that holds records. Kept here rather than imported
 * so a lexicon added to the map without a deliberate test change is caught.
 */
const RECORD_COLLECTIONS = [
  'id.sifa.authConnection',
  'id.sifa.authMeet',
  'id.sifa.authProfile',
  'id.sifa.authProfileAccess',
  'id.sifa.authProject',
  'id.sifa.confirmation',
  'id.sifa.endorsement',
  'id.sifa.endorsement.confirmation',
  'id.sifa.graph.connection',
  'id.sifa.graph.follow',
  'id.sifa.meeting',
  'id.sifa.org.employmentAttestation',
  'id.sifa.org.profile',
  'id.sifa.profile.certification',
  'id.sifa.profile.course',
  'id.sifa.profile.education',
  'id.sifa.profile.externalAccount',
  'id.sifa.profile.honor',
  'id.sifa.profile.involvement',
  'id.sifa.profile.language',
  'id.sifa.profile.location',
  'id.sifa.profile.position',
  'id.sifa.profile.presentation',
  'id.sifa.profile.presentationDelivery',
  'id.sifa.profile.project',
  'id.sifa.profile.publication',
  'id.sifa.profile.self',
  'id.sifa.profile.skill',
  'id.sifa.profile.volunteering',
  'id.sifa.project.member',
  'id.sifa.project.membership',
  'id.sifa.project.self',
];

describe('SIFA_REPO_GROUPS', () => {
  it('places every known record collection in a group other than "other"', () => {
    const unplaced = RECORD_COLLECTIONS.filter((c) => repoGroupForCollection(c) === 'other');
    expect(unplaced).toEqual([]);
  });

  it('never lists the same collection in two groups', () => {
    const seen = new Map<string, RepoGroupId>();
    for (const group of SIFA_REPO_GROUPS) {
      for (const collection of group.collections) {
        expect(seen.get(collection)).toBeUndefined();
        seen.set(collection, group.id);
      }
    }
  });

  it('does not claim the query and defs lexicons, which hold no records', () => {
    expect(repoGroupForCollection('id.sifa.getProfileView')).toBe('other');
    expect(repoGroupForCollection('id.sifa.defs')).toBe('other');
  });

  it('groups a lexicon we have not mapped yet into "other" rather than dropping it', () => {
    expect(repoGroupForCollection('id.sifa.profile.somethingNew')).toBe('other');
  });

  it('does not claim collections outside the Sifa namespace', () => {
    expect(repoGroupForCollection('app.bsky.feed.post')).toBe('other');
    expect(repoGroupForCollection('chat.bsky.actor.declaration')).toBe('other');
  });

  it('keeps consent and access records in their own group, away from profile content', () => {
    expect(repoGroupForCollection('id.sifa.authProfileAccess')).toBe('consents-access');
    expect(repoGroupForCollection('id.sifa.meeting')).toBe('consents-access');
  });
});
