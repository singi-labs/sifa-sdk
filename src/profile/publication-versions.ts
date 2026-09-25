import { normalizeDoi } from '../format/doi.js';
import type { RelatedIdentifier } from '../types/index.js';

/** The fields `groupPublicationVersions` reads from a publication. */
export interface VersionablePublication {
  rkey: string;
  doi?: string | null;
  type?: string | null;
  date?: string | null;
  primary?: boolean;
  source?: 'sifa' | 'standard' | 'orcid';
  publicationUri?: string | null;
  relatedIdentifiers?: readonly RelatedIdentifier[];
}

/** A publication shown as one entry, with its other versions folded under it. */
export interface PublicationVersionGroup<T> {
  lead: T;
  /** Other versions of the same work. `preprint` marks a preprint of the lead. */
  versions: { pub: T; kind: 'preprint' | 'version' }[];
}

export interface GroupPublicationVersionsOptions {
  /**
   * DID of the profile owner. Needed to resolve an AT-URI relation to one of
   * the owner's own Sifa publications, which the view identifies by rkey.
   */
  ownerDid?: string;
}

/** Relations that point from a preprint to the version it became. */
const PREPRINT_OF = new Set(['IsPreprintOf', 'IsPublishedIn']);
/** Relations that point from a version to the one it defers to. */
const DEFERS_TO = new Set(['IsVersionOf', 'IsPreviousVersionOf']);

const doiKey = (doi: string) => `doi:${normalizeDoi(doi).toLowerCase()}`;

/** Resolve a related identifier to a lookup key, or undefined when it is not usable. */
function targetKey(rel: RelatedIdentifier): string | undefined {
  const id = rel.identifier?.trim();
  if (!id) return undefined;
  const type = rel.identifierType ?? 'DOI';
  if (type === 'AT-URI') return `uri:${id}`;
  if (type === 'URL') {
    const bare = normalizeDoi(id);
    return bare.startsWith('10.') ? doiKey(bare) : `url:${id}`;
  }
  return doiKey(id);
}

/**
 * Fold the versions of one work into a single entry: a preprint under its
 * published version, older releases under the newest (#590).
 *
 * Publications are joined when one names another on the profile through a
 * DataCite-style relation (declared on the record or sourced from a registry),
 * in either direction, or when two name the same `IsVersionOf` target that is
 * not on the profile itself. Identifiers match on the bare, case-insensitive
 * DOI or on the AT-URI of the owner's own record.
 *
 * The lead of a group is the primary publication when it is in the group,
 * otherwise the newest one that is not a preprint; on a date tie, a member
 * that says it IsVersionOf / IsPreviousVersionOf another ranks after it. A preprint is a member typed
 * `preprint`, one that says it IsPreprintOf / IsPublishedIn another, or one a
 * member says it HasPreprint. Groups keep the order of their first member in
 * the input, so a caller's sort still applies.
 */
export function groupPublicationVersions<T extends VersionablePublication>(
  pubs: readonly T[],
  options: GroupPublicationVersionsOptions = {},
): PublicationVersionGroup<T>[] {
  const keyToIndex = new Map<string, number>();
  pubs.forEach((p, i) => {
    if (p.doi) keyToIndex.set(doiKey(p.doi), i);
    if (options.ownerDid && (!p.source || p.source === 'sifa')) {
      keyToIndex.set(`uri:at://${options.ownerDid}/id.sifa.profile.publication/${p.rkey}`, i);
    }
    if (p.publicationUri) keyToIndex.set(`uri:${p.publicationUri}`, i);
  });

  // Union-find over publication indexes.
  const parent = pubs.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const preprints = new Set<number>();
  // Members that point at another member as the canonical version; they rank
  // after it when dates do not decide (an undated arXiv copy of an article).
  const deferring = new Set<number>();
  const siblingsOf = new Map<string, number>();
  pubs.forEach((p, i) => {
    if (p.type === 'preprint') preprints.add(i);
    for (const rel of p.relatedIdentifiers ?? []) {
      const key = targetKey(rel);
      if (!key) continue;
      const j = keyToIndex.get(key);
      if (j === undefined) {
        // Two versions of one concept that is not itself on the profile.
        if (rel.relationType === 'IsVersionOf') {
          const first = siblingsOf.get(key);
          if (first === undefined) siblingsOf.set(key, i);
          else union(first, i);
        }
        continue;
      }
      if (j === i) continue;
      union(i, j);
      if (PREPRINT_OF.has(rel.relationType)) preprints.add(i);
      if (DEFERS_TO.has(rel.relationType)) deferring.add(i);
      if (rel.relationType === 'HasPreprint') preprints.add(j);
    }
  });

  const members = new Map<number, number[]>();
  pubs.forEach((_, i) => {
    const root = find(i);
    const list = members.get(root);
    if (list) list.push(i);
    else members.set(root, [i]);
  });

  const newestFirst = (a: number, b: number) => {
    const da = pubs[a]!.date ?? '';
    const db = pubs[b]!.date ?? '';
    if (da !== db) return db.localeCompare(da);
    const fa = deferring.has(a) ? 1 : 0;
    const fb = deferring.has(b) ? 1 : 0;
    if (fa !== fb) return fa - fb;
    return a - b;
  };

  const groups: { order: number; group: PublicationVersionGroup<T> }[] = [];
  for (const indexes of members.values()) {
    const primary = indexes.find((i) => pubs[i]!.primary);
    const published = indexes.filter((i) => !preprints.has(i));
    const pool = published.length ? published : indexes;
    const lead = primary ?? [...pool].sort(newestFirst)[0]!;
    groups.push({
      order: Math.min(...indexes),
      group: {
        lead: pubs[lead]!,
        versions: indexes
          .filter((i) => i !== lead)
          .sort(newestFirst)
          .map((i) => ({ pub: pubs[i]!, kind: preprints.has(i) ? 'preprint' : 'version' })),
      },
    });
  }
  return groups.sort((a, b) => a.order - b.order).map((g) => g.group);
}
