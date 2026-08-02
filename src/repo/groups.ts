/**
 * The buckets a repo data-management UI shows instead of raw collections.
 *
 * "id.sifa.profile.presentationDelivery" means nothing to someone who has never
 * heard of a lexicon. Grouping is the whole difference between a developer tool
 * and something a user can act on, so it lives here rather than in one app: the
 * web settings page and a future native app must agree on what a bucket holds,
 * or the same repo reads differently depending where you look at it.
 *
 * Ids only, no display strings -- copy is translated at the surface.
 */
export type RepoGroupId =
  | 'profile-basics'
  | 'work-history'
  | 'education'
  | 'skills-endorsements'
  | 'projects'
  | 'publications-talks'
  | 'people'
  | 'meetings'
  | 'other';

export interface RepoGroupDefinition {
  id: RepoGroupId;
  /** Collections this bucket claims, in the order a UI should list them. */
  collections: readonly string[];
}

/**
 * Ordered so the buckets a user recognises come first and the machinery they
 * never think about (consents, access grants) comes last.
 *
 * `other` is deliberately absent: it is not a claim over a fixed set, it is
 * where anything unmapped lands. See {@link repoGroupForCollection}.
 */
export const SIFA_REPO_GROUPS: readonly RepoGroupDefinition[] = [
  {
    id: 'profile-basics',
    collections: [
      'id.sifa.profile.self',
      'id.sifa.profile.location',
      'id.sifa.profile.language',
      'id.sifa.profile.externalAccount',
      'id.sifa.org.profile',
    ],
  },
  {
    id: 'work-history',
    collections: [
      'id.sifa.profile.position',
      'id.sifa.profile.volunteering',
      'id.sifa.org.employmentAttestation',
    ],
  },
  {
    id: 'education',
    collections: [
      'id.sifa.profile.education',
      'id.sifa.profile.course',
      'id.sifa.profile.certification',
    ],
  },
  {
    id: 'skills-endorsements',
    collections: [
      'id.sifa.profile.skill',
      'id.sifa.endorsement',
      'id.sifa.endorsement.confirmation',
    ],
  },
  {
    id: 'projects',
    collections: [
      'id.sifa.profile.project',
      'id.sifa.profile.involvement',
      'id.sifa.project.self',
      'id.sifa.project.member',
      'id.sifa.project.membership',
    ],
  },
  {
    id: 'publications-talks',
    collections: [
      'id.sifa.profile.publication',
      'id.sifa.profile.presentation',
      'id.sifa.profile.presentationDelivery',
      'id.sifa.profile.honor',
    ],
  },
  {
    id: 'people',
    collections: ['id.sifa.graph.follow', 'id.sifa.graph.connection', 'id.sifa.confirmation'],
  },
  // The id.sifa.auth* lexicons are `permission-set` definitions -- OAuth scope
  // identifiers published to the authority PDS and referenced from the API's
  // scope builder. Nothing writes them into a user's repo, so listing them here
  // promised a consent-management surface that could only ever be empty.
  {
    id: 'meetings',
    collections: ['id.sifa.meeting'],
  },
];

const GROUP_BY_COLLECTION: ReadonlyMap<string, RepoGroupId> = new Map(
  SIFA_REPO_GROUPS.flatMap((group) =>
    group.collections.map((collection) => [collection, group.id] as const),
  ),
);

/**
 * Which bucket a collection belongs to, or `other` when we have not mapped it.
 *
 * Unmapped falls through to a visible bucket rather than being filtered out. A
 * lexicon we mint later would otherwise be invisible on the one page whose job
 * is to show everything in the repo -- the user would be told their data is
 * accounted for while some of it was silently omitted.
 */
export function repoGroupForCollection(collection: string): RepoGroupId {
  return GROUP_BY_COLLECTION.get(collection) ?? 'other';
}
