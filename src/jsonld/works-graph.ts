/**
 * The works on a profile as one JSON-LD `@graph`.
 *
 * A profile page already emits a `ProfilePage` whose `mainEntity` is the
 * Person. Publications, talks, courses and projects are separate entities
 * rather than properties of that Person, so they go in their own block and
 * point back at the Person by `@id` instead of repeating the whole node.
 */

import { filterHidden } from '../profile/section-model.js';
import type { JsonLdOptions } from './profile.js';
import { normaliseBaseUrl, profileUrl } from './url.js';
import {
  buildCourseJsonLd,
  buildPresentationJsonLd,
  buildProjectJsonLd,
  buildPublicationJsonLd,
  type CourseInput,
  type PresentationInput,
  type ProjectInput,
  type PublicationInput,
  type WorkAuthor,
} from './works.js';

export interface ProfileWorksInput {
  readonly handle: string;
  readonly publications?: readonly PublicationInput[];
  readonly presentations?: readonly PresentationInput[];
  readonly courses?: readonly CourseInput[];
  readonly projects?: readonly ProjectInput[];
}

/** `filterHidden` takes a mutable array; inputs here are readonly. */
function visible<T extends { hidden?: boolean }>(items: readonly T[] | undefined): T[] {
  return filterHidden(items ? [...items] : undefined);
}

/**
 * Returns null when there is nothing to say, so a caller can skip the script
 * block entirely rather than emitting an empty graph.
 */
export function buildProfileWorksJsonLd(
  profile: ProfileWorksInput,
  author: WorkAuthor,
  options: JsonLdOptions = {},
) {
  const personId =
    options.canonicalUrl ?? `${normaliseBaseUrl(options.baseUrl)}/p/${profile.handle}`;

  // Each work is built by its own emitter, then its `@context` is dropped: the
  // graph carries one context for every node in it.
  const strip = <T extends { '@context': string }>(node: T) => {
    const { '@context': _context, ...rest } = node;
    return rest;
  };

  // The Person is emitted in full by the ProfilePage block. Referencing the
  // owner by `@id` keeps one Person in the graph rather than several partial
  // copies. But only the OWNER is de-duplicated this way: co-authors and
  // co-members (which the per-work builders emit as full Person nodes) must be
  // preserved, not overwritten. The owner is matched by its profile URL.
  const ownerUrl = profileUrl(normaliseBaseUrl(options.baseUrl), author.handle);
  const refOwner = (nodes: readonly unknown[]): unknown[] => {
    let seenOwner = false;
    const out: unknown[] = [];
    for (const node of nodes) {
      const isOwner =
        typeof node === 'object' &&
        node !== null &&
        (node as Record<string, unknown>)['@type'] === 'Person' &&
        (node as Record<string, unknown>).url === ownerUrl;
      if (isOwner) {
        if (seenOwner) continue; // collapse a repeated owner into one @id ref
        seenOwner = true;
        out.push({ '@id': personId });
      } else {
        out.push(node);
      }
    }
    return out;
  };

  const graph: Record<string, unknown>[] = [
    ...visible(profile.publications).map((p) => {
      const node = strip(buildPublicationJsonLd(p, author, options));
      return { ...node, author: refOwner(node.author) };
    }),
    ...visible(profile.presentations).map((p) => {
      const node = strip(buildPresentationJsonLd(p, author, options));
      return { ...node, author: refOwner([node.author]) };
    }),
    ...visible(profile.courses).map((c) => strip(buildCourseJsonLd(c, options))),
    ...visible(profile.projects).map((p) => {
      const node = strip(buildProjectJsonLd(p, author, options));
      return { ...node, member: refOwner(node.member) };
    }),
  ];

  if (graph.length === 0) return null;

  return { '@context': 'https://schema.org', '@graph': graph };
}
