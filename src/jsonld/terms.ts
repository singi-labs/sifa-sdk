/**
 * Reconciliation between `id.sifa.*` lexicon terms and existing RDF
 * vocabularies.
 *
 * This table is the single source of truth for "what does this lexicon field
 * mean in somebody else's vocabulary". It drives the JSON-LD emitters in this
 * module and is intended to also back a published machine-readable mapping
 * document, so the two cannot drift.
 *
 * Scope note: RDF is adopted here as *vocabulary only*. Sifa records are
 * Lexicon JSON on the AT Protocol; nothing in this module changes how records
 * are stored or transmitted. A mapping is a one-directional annotation over a
 * lexicon designed on its own merits, never a constraint on lexicon design.
 * When a term does not fit, the correct answer is `noMatch`, not a different
 * lexicon.
 */

/** Vocabulary prefix -> namespace IRI. */
export const VOCABULARIES = {
  schema: 'https://schema.org/',
  bibo: 'http://purl.org/ontology/bibo/',
  dcterms: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  org: 'http://www.w3.org/ns/org#',
  prism: 'http://prismstandard.org/namespaces/basic/2.1/',
  event: 'http://purl.org/NET/c4dm/event.owl#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
} as const;

export type VocabularyPrefix = keyof typeof VOCABULARIES;

/**
 * Strength of a mapping, using SKOS mapping relations so the table is itself
 * expressible as RDF.
 *
 * `noMatch` is not the absence of an entry. It is a deliberate statement that
 * no external term should be used for this concept, and it carries a reason.
 */
export type MatchStrength =
  'exactMatch' | 'closeMatch' | 'broadMatch' | 'narrowMatch' | 'relatedMatch' | 'noMatch';

export interface TermMapping {
  /** Lexicon NSID, e.g. `id.sifa.profile.presentation`. */
  readonly lexicon: string;
  /**
   * Field name within the record. Omitted for a record-level class mapping
   * (what the record *is*, rather than what one of its fields means).
   */
  readonly field?: string;
  /** CURIEs, e.g. `dcterms:title`. Empty when `match` is `noMatch`. */
  readonly terms: readonly string[];
  readonly match: MatchStrength;
  /** Required when `match` is `noMatch`: why no term is appropriate. */
  readonly note?: string;
}

/**
 * Records Sifa deliberately does not map, with the reason. These are load
 * bearing: an approximate mapping here would let a consumer draw a conclusion
 * the record does not support.
 */
const UNMAPPED: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.confirmation',
    terms: [],
    match: 'noMatch',
    note: 'A record affirming another record is reification. schema:Review and schema:ClaimReview both imply an evaluation that a confirmation does not make.',
  },
  {
    lexicon: 'id.sifa.endorsement',
    terms: [],
    match: 'noMatch',
    note: 'Same reification problem as confirmation. Any mapping that lets a consumer aggregate endorsements into a score works against the descriptive-only trust model.',
  },
  {
    lexicon: 'id.sifa.graph.connection',
    terms: [],
    match: 'noMatch',
    note: 'foaf:knows carries no consent semantics. A Sifa connection is bilateral and confirmed; flattening it to foaf:knows would misrepresent an unconfirmed acquaintance claim as mutual.',
  },
  {
    lexicon: 'id.sifa.graph.follow',
    terms: [],
    match: 'noMatch',
    note: 'See id.sifa.graph.connection.',
  },
  {
    lexicon: 'id.sifa.meeting',
    terms: [],
    match: 'noMatch',
    note: 'Attestation semantics; same reification problem as confirmation.',
  },
];

const PROFILE_SELF: readonly TermMapping[] = [
  { lexicon: 'id.sifa.profile.self', terms: ['schema:Person', 'foaf:Person'], match: 'exactMatch' },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'displayName',
    terms: ['schema:name', 'foaf:name'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'givenName',
    terms: ['schema:givenName', 'foaf:givenname'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'familyName',
    terms: ['schema:familyName', 'foaf:family_name'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'avatar',
    terms: ['schema:image', 'foaf:depiction'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'headline',
    terms: ['schema:jobTitle'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'about',
    terms: ['schema:description'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'location',
    terms: ['schema:homeLocation'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'pronouns',
    terms: [],
    match: 'noMatch',
    note: 'No stable external term. schema.org has no pronouns property.',
  },
  {
    lexicon: 'id.sifa.profile.self',
    field: 'discoverable',
    terms: [],
    match: 'noMatch',
    note: 'Sifa indexing control, not a fact about the person.',
  },
];

const PROFILE_POSITION: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.profile.position',
    terms: ['org:Membership', 'schema:OrganizationRole'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'company',
    terms: ['org:organization', 'schema:worksFor'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'entityRef',
    terms: ['schema:sameAs'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'title',
    terms: ['org:role', 'schema:roleName'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'description',
    terms: ['dcterms:description'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'employmentType',
    terms: ['schema:employmentType'],
    match: 'closeMatch',
    note: 'schema:employmentType is free text. ESCO is the better value anchor.',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'workplaceType',
    terms: ['schema:jobLocationType'],
    match: 'narrowMatch',
    note: 'schema.org models only a remote flag; Sifa distinguishes onSite, remote, and hybrid.',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'location',
    terms: ['schema:jobLocation'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'startedAt',
    terms: ['schema:startDate'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'endedAt',
    terms: ['schema:endDate'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.position',
    field: 'isPrimary',
    terms: [],
    match: 'noMatch',
    note: 'Sifa display ordering concern.',
  },
];

const PROFILE_EDUCATION: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.profile.education',
    terms: ['schema:EducationalOccupationalCredential'],
    match: 'closeMatch',
    note: 'One record maps to two schema.org assertions: alumniOf for the institution and hasCredential for the degree.',
  },
  {
    lexicon: 'id.sifa.profile.education',
    field: 'institution',
    terms: ['schema:alumniOf'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.education',
    field: 'degree',
    terms: ['schema:hasCredential', 'bibo:degree'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.education',
    field: 'fieldOfStudy',
    terms: ['schema:educationalCredentialAwarded'],
    match: 'closeMatch',
    note: 'ISCED-F is the value anchor.',
  },
  {
    lexicon: 'id.sifa.profile.education',
    field: 'grade',
    terms: [],
    match: 'noMatch',
    note: 'No comparable external term; grading scales are not portable.',
  },
];

const PROFILE_PUBLICATION: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.profile.publication',
    terms: ['bibo:Document', 'schema:CreativeWork'],
    match: 'broadMatch',
    note: 'Refine to bibo:AcademicArticle, bibo:Book, bibo:Report or bibo:Thesis when a resource type is known. COAR is the value anchor.',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'title',
    terms: ['dcterms:title', 'schema:name'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'subtitle',
    terms: ['schema:alternativeHeadline'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'publisher',
    terms: ['dcterms:publisher', 'schema:publisher'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'url',
    terms: ['bibo:uri', 'schema:url'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'description',
    terms: ['bibo:abstract', 'schema:abstract'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'authors',
    terms: ['bibo:authorList', 'schema:author'],
    match: 'exactMatch',
    note: 'bibo:authorList is an ordered rdf:List and preserves author order, which schema:author does not guarantee.',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'publishedAt',
    terms: ['dcterms:issued', 'schema:datePublished'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.publication',
    field: 'doi',
    terms: ['bibo:doi', 'prism:doi'],
    match: 'exactMatch',
    note: 'Present on the AppView view type (ORCID-sourced), not yet on the id.sifa.profile.publication lexicon, so user-authored publications cannot carry one.',
  },
];

const PROFILE_PRESENTATION: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.profile.presentation',
    terms: ['bibo:Slideshow', 'schema:PresentationDigitalDocument'],
    match: 'closeMatch',
    note: 'Neither term carries the "reusable, deliverable more than once" semantics of the Sifa record.',
  },
  {
    lexicon: 'id.sifa.profile.presentation',
    field: 'title',
    terms: ['dcterms:title', 'schema:name'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentation',
    field: 'description',
    terms: ['bibo:abstract', 'schema:abstract'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentation',
    field: 'duration',
    terms: ['schema:timeRequired'],
    match: 'narrowMatch',
    note: 'The lexicon models a range; schema:timeRequired is a single ISO 8601 duration.',
  },
  {
    lexicon: 'id.sifa.profile.presentation',
    field: 'intendedAudiences',
    terms: ['schema:audience'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentation',
    field: 'writeupRef',
    terms: ['dcterms:isReferencedBy', 'schema:subjectOf'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentation',
    field: 'coverImage',
    terms: ['schema:image', 'foaf:depiction'],
    match: 'exactMatch',
  },
];

const PROFILE_PRESENTATION_DELIVERY: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    terms: ['schema:Event', 'event:Event'],
    match: 'closeMatch',
    note: 'BIBO models this relation as bibo:Slideshow bibo:presentedAt event:Event.',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'presentationRef',
    terms: ['bibo:presentedAt', 'schema:workPerformed'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'title',
    terms: ['dcterms:title', 'schema:name'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'role',
    terms: ['bibo:performer', 'schema:performer'],
    match: 'closeMatch',
    note: 'No external vocabulary distinguishes presenter, panelist, keynote, workshop and host at this granularity.',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'eventName',
    terms: ['schema:superEvent', 'bibo:Conference'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'date',
    terms: ['schema:startDate', 'event:time'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'address',
    terms: ['schema:location', 'event:place'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'mode',
    terms: ['schema:eventAttendanceMode'],
    match: 'exactMatch',
    note: 'The community.lexicon.calendar.event known values are already one-to-one with the schema.org enumeration.',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'status',
    terms: ['schema:eventStatus'],
    match: 'exactMatch',
    note: 'As with mode, already one-to-one with the schema.org enumeration.',
  },
  {
    lexicon: 'id.sifa.profile.presentationDelivery',
    field: 'coSpeakers',
    terms: ['schema:performer'],
    match: 'exactMatch',
  },
];

const PROFILE_OTHER: readonly TermMapping[] = [
  {
    lexicon: 'id.sifa.profile.certification',
    terms: ['schema:EducationalOccupationalCredential'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.certification',
    field: 'credentialUrl',
    terms: ['schema:url'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.certification',
    field: 'expiresAt',
    terms: ['schema:validUntil'],
    match: 'exactMatch',
  },
  { lexicon: 'id.sifa.profile.course', terms: ['schema:Course'], match: 'exactMatch' },
  {
    lexicon: 'id.sifa.profile.course',
    field: 'number',
    terms: ['schema:courseCode'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.honor',
    terms: ['schema:award'],
    match: 'broadMatch',
    note: 'schema:award is a bare string, so issuer and date are lost. No better term exists in BIBO either.',
  },
  {
    lexicon: 'id.sifa.profile.project',
    terms: ['schema:Project', 'foaf:Project'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.skill',
    terms: ['schema:knowsAbout', 'schema:DefinedTerm'],
    match: 'closeMatch',
    note: 'ESCO is the value anchor.',
  },
  {
    lexicon: 'id.sifa.profile.volunteering',
    terms: ['org:Membership', 'schema:OrganizationRole'],
    match: 'closeMatch',
  },
  {
    lexicon: 'id.sifa.profile.involvement',
    terms: ['org:Membership'],
    match: 'broadMatch',
    note: 'The kind known values have no external equivalent.',
  },
  {
    lexicon: 'id.sifa.profile.language',
    terms: ['schema:knowsLanguage'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.profile.language',
    field: 'proficiency',
    terms: [],
    match: 'noMatch',
    note: 'The known values are CEFR-shaped but not CEFR-named. Map only; renaming a published lexicon for a cosmetic gain is not worth the break.',
  },
  {
    lexicon: 'id.sifa.profile.externalAccount',
    terms: ['schema:sameAs', 'foaf:account'],
    match: 'exactMatch',
  },
  {
    lexicon: 'id.sifa.org.profile',
    terms: ['schema:Organization', 'org:FormalOrganization'],
    match: 'exactMatch',
    note: 'ROR is the value anchor.',
  },
];

/** Every reconciliation Sifa asserts, including the deliberate non-mappings. */
export const TERM_MAPPINGS: readonly TermMapping[] = [
  ...PROFILE_SELF,
  ...PROFILE_POSITION,
  ...PROFILE_EDUCATION,
  ...PROFILE_PUBLICATION,
  ...PROFILE_PRESENTATION,
  ...PROFILE_PRESENTATION_DELIVERY,
  ...PROFILE_OTHER,
  ...UNMAPPED,
];

/**
 * Expand a CURIE (`dcterms:title`) to a full IRI. Returns null for an unknown
 * prefix rather than guessing a namespace.
 */
export function expandCurie(curie: string): string | null {
  const separator = curie.indexOf(':');
  if (separator <= 0) return null;
  const prefix = curie.slice(0, separator);
  const local = curie.slice(separator + 1);
  if (!local) return null;
  if (!Object.prototype.hasOwnProperty.call(VOCABULARIES, prefix)) return null;
  return `${VOCABULARIES[prefix as VocabularyPrefix]}${local}`;
}

/** All mappings declared for one lexicon NSID, record level and field level. */
export function mappingsForLexicon(nsid: string): readonly TermMapping[] {
  return TERM_MAPPINGS.filter((m) => m.lexicon === nsid);
}

/** True when Sifa has deliberately declined to map this lexicon or field. */
export function isDeliberatelyUnmapped(nsid: string, field?: string): boolean {
  return TERM_MAPPINGS.some(
    (m) => m.lexicon === nsid && m.field === field && m.match === 'noMatch',
  );
}
