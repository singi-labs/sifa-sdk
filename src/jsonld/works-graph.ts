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
import { normaliseBaseUrl } from './url.js';
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

  // The Person is emitted in full by the ProfilePage block. Referencing it by
  // `@id` keeps one Person in the graph rather than several partial copies for
  // a consumer to reconcile.
  const authorRef = [{ '@id': personId }];

  const graph: Record<string, unknown>[] = [
    ...visible(profile.publications).map((p) => ({
      ...strip(buildPublicationJsonLd(p, author, options)),
      author: authorRef,
    })),
    ...visible(profile.presentations).map((p) => ({
      ...strip(buildPresentationJsonLd(p, author, options)),
      author: authorRef,
    })),
    ...visible(profile.courses).map((c) => strip(buildCourseJsonLd(c, options))),
    ...visible(profile.projects).map((p) => ({
      ...strip(buildProjectJsonLd(p, author, options)),
      member: authorRef,
    })),
  ];

  if (graph.length === 0) return null;

  return { '@context': 'https://schema.org', '@graph': graph };
}
