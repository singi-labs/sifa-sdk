/**
 * JSON-LD emitters and the lexicon-to-RDF term reconciliation that backs them.
 *
 * Framework-free and side-effect-free, so it is safe in a React Server
 * Component, a string-HTML renderer, or a build script.
 */

export {
  TERM_MAPPINGS,
  VOCABULARIES,
  expandCurie,
  isDeliberatelyUnmapped,
  mappingsForLexicon,
} from './terms.js';
export type { MatchStrength, TermMapping, VocabularyPrefix } from './terms.js';

export { buildBreadcrumbListJsonLd, buildPersonJsonLd, buildProfilePageJsonLd } from './profile.js';
export type {
  JsonLdCertification,
  JsonLdEducation,
  JsonLdHonor,
  JsonLdLanguage,
  JsonLdOptions,
  JsonLdPosition,
  JsonLdProfileInput,
  JsonLdSkill,
  JsonLdVolunteering,
  Sanitizer,
} from './profile.js';

export {
  buildCourseJsonLd,
  buildPresentationJsonLd,
  buildProjectJsonLd,
  buildPublicationJsonLd,
} from './works.js';
export { buildProfileWorksJsonLd } from './works-graph.js';
export type { ProfileWorksInput } from './works-graph.js';

export type {
  CourseInput,
  PresentationDeliveryInput,
  PresentationInput,
  PresentationLinkInput,
  ProjectInput,
  PublicationContributorInput,
  PublicationInput,
  WorkAuthor,
  WorksOptions,
} from './works.js';
