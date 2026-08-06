/**
 * Schema.org JSON-LD for a Sifa profile.
 *
 * Ported from sifa-web's `src/lib/jsonld.ts` so that sifa.id, page.sifa.id and
 * any future consumer emit the same graph from one implementation. Term choices
 * are recorded in `./terms.js`.
 *
 * These are pure functions: no fetching, no DOM, no framework.
 */

import { formatLocation } from '../format/location-utils.js';
import { pickPrimaryPosition } from '../logic/primary-position.js';
import { filterHidden } from '../profile/section-model.js';
import type { LocationValue } from '../types/index.js';
import { normaliseBaseUrl } from './url.js';

/**
 * Maximum number of skills emitted into `knowsAbout`. The rendered profile
 * still shows every skill; only this structured-data slot is capped so a
 * profile with many skills does not read as keyword stuffing.
 */
const MAX_KNOWS_ABOUT = 20;

/**
 * Treat headlines and about text as meaningful only when they contain at least
 * one letter or digit. Profiles carry headlines that are a single emoji and
 * about fields that are a zero-width space; feeding those to `jobTitle` or
 * `description` produces garbage for crawlers.
 */
const MEANINGFUL_TEXT_RE = /[\p{L}\p{N}]/u;

export type Sanitizer = (input: string) => string;

export interface JsonLdOptions {
  /** Canonical origin for profile URLs. Defaults to `https://sifa.id`. */
  readonly baseUrl?: string;
  /** Applied to every user-authored string. Defaults to identity. */
  readonly sanitize?: Sanitizer;
  /**
   * Absolute URL of the page this graph describes, used for `url` and `@id`.
   * Defaults to `${baseUrl}/p/${handle}`. Personal sites can be served from an
   * arbitrary host, including a self-hosted custom domain, where that default
   * path is not where the page lives.
   */
  readonly canonicalUrl?: string;
}

/**
 * Structural input for the emitters.
 *
 * Deliberately looser than `Profile`: it accepts a `Profile` unchanged, but
 * also the partial shapes held by consumers that render a subset (page.sifa.id)
 * without forcing them to fabricate required fields.
 */
export interface JsonLdProfileInput {
  readonly handle: string;
  readonly displayName?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly headline?: string;
  readonly about?: string;
  readonly avatar?: string;
  readonly website?: string;
  readonly location?: LocationValue | null;
  readonly updatedAt?: string;
  readonly positions?: readonly JsonLdPosition[];
  readonly education?: readonly JsonLdEducation[];
  readonly skills?: readonly JsonLdSkill[];
  readonly certifications?: readonly JsonLdCertification[];
  readonly volunteering?: readonly JsonLdVolunteering[];
  readonly honors?: readonly JsonLdHonor[];
  readonly languages?: readonly JsonLdLanguage[];
  readonly verifiedAccounts?: readonly { platform: string; identifier: string; url?: string }[];
  readonly activeApps?: readonly { id: string }[];
  /** Only the length is read, to decide which section anchors to advertise. */
  readonly projects?: readonly unknown[];
  readonly publications?: readonly unknown[];
  readonly courses?: readonly unknown[];
  readonly externalAccounts?: readonly unknown[];
  /**
   * Dual-facet accounts: one DID presenting as both a person and a company.
   * Only the opted-in case is emitted, see `buildPersonJsonLd`.
   */
  readonly org?: {
    readonly personalProfileVisible?: boolean;
    readonly orgProfile?: { readonly name?: string } | null;
  } | null;
}

interface Hideable {
  readonly hidden?: boolean;
}
export interface JsonLdPosition extends Hideable {
  readonly company?: string;
  readonly title?: string;
  readonly startedAt?: string;
  readonly endedAt?: string;
  readonly description?: string;
  readonly primary?: boolean;
}
export interface JsonLdEducation extends Hideable {
  readonly institution?: string;
  readonly degree?: string;
  readonly fieldOfStudy?: string;
}
export interface JsonLdSkill extends Hideable {
  readonly name?: string;
  readonly endorsementCount?: number;
}
export interface JsonLdCertification extends Hideable {
  readonly name?: string;
  readonly authority?: string;
  readonly issuingOrg?: string;
  readonly credentialUrl?: string;
}
export interface JsonLdVolunteering extends Hideable {
  readonly organization?: string;
  readonly role?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}
export interface JsonLdHonor extends Hideable {
  readonly title?: string;
}
export interface JsonLdLanguage extends Hideable {
  readonly language?: string;
}

const identity: Sanitizer = (input) => input;

function hasMeaningfulText(value: string | undefined | null): value is string {
  return typeof value === 'string' && MEANINGFUL_TEXT_RE.test(value);
}

/** `filterHidden` takes a mutable array; the input types are readonly. */
function visible<T extends Hideable>(items: readonly T[] | undefined): T[] {
  return filterHidden(items ? [...items] : undefined);
}

/**
 * Selects and ranks the skills surfaced in `knowsAbout`. Ordered by endorsement
 * count descending, a missing count counting as zero, ties preserving input
 * order. Returns undefined when no named skill exists so the property is
 * omitted entirely rather than emitted empty.
 */
function rankKnowsAbout(
  skills: readonly JsonLdSkill[] | undefined,
  s: Sanitizer,
): string[] | undefined {
  const ranked = visible(skills)
    .filter((sk): sk is JsonLdSkill & { name: string } => Boolean(sk.name))
    .sort((a, b) => (b.endorsementCount ?? 0) - (a.endorsementCount ?? 0))
    .slice(0, MAX_KNOWS_ABOUT)
    .map((sk) => s(sk.name));

  return ranked.length > 0 ? ranked : undefined;
}

function buildSameAs(profile: JsonLdProfileInput): string[] {
  const sameAs: string[] = [];

  // ATproto is multi-app: a Sifa identity may hold no Bluesky records at all.
  // Only link bsky.app when activeApps confirms Bluesky presence, otherwise the
  // link points at an empty profile and weakens entity resolution rather than
  // strengthening it.
  const hasBluesky = profile.activeApps?.some((a) => a.id === 'bluesky') ?? false;
  if (hasBluesky) sameAs.push(`https://bsky.app/profile/${profile.handle}`);

  if (profile.website) {
    const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
    if (!sameAs.includes(url)) sameAs.push(url);
  }

  for (const account of profile.verifiedAccounts ?? []) {
    if (account.url && !sameAs.includes(account.url)) sameAs.push(account.url);
  }

  return sameAs;
}

function buildHomeLocation(location: LocationValue, s: Sanitizer) {
  // Emit the address sub-object when either a country code or a locality is
  // present. Locality prefers the community-shape `locality` with a fallback to
  // the legacy `city` so output stays correct whichever shape the AppView emits.
  const addressLocality = location.locality ?? location.city;
  const addressCountry = location.countryCode;
  const hasAddress = Boolean(addressLocality) || Boolean(addressCountry);

  return {
    '@type': 'Place' as const,
    name: s(formatLocation(location)),
    ...(hasAddress && {
      address: {
        '@type': 'PostalAddress' as const,
        ...(addressLocality && { addressLocality: s(addressLocality) }),
        ...(addressCountry && { addressCountry }),
      },
    }),
  };
}

export function buildPersonJsonLd(profile: JsonLdProfileInput, options: JsonLdOptions = {}) {
  const s = options.sanitize ?? identity;
  const baseUrl = normaliseBaseUrl(options.baseUrl);
  // The own-company link below deliberately keeps the baseUrl origin: a /c/
  // page lives on Sifa even when the personal site does not.
  const canonical = options.canonicalUrl ?? `${baseUrl}/p/${profile.handle}`;

  const positions = visible(profile.positions);
  const currentPosition = pickPrimaryPosition(positions);
  const knowsAbout = rankKnowsAbout(profile.skills, s);
  const sameAs = buildSameAs(profile);

  const hasCredential = [
    ...visible(profile.education)
      .filter((e) => e.degree)
      .map((e) => ({
        '@type': 'EducationalOccupationalCredential' as const,
        credentialCategory: 'degree' as const,
        name: [e.degree, e.fieldOfStudy].filter(Boolean).join(' '),
        ...(e.institution && {
          recognizedBy: { '@type': 'EducationalOrganization' as const, name: s(e.institution) },
        }),
      })),
    ...visible(profile.certifications)
      .filter((c) => c.name)
      .map((c) => ({
        '@type': 'EducationalOccupationalCredential' as const,
        name: s(c.name!),
        ...((c.authority ?? c.issuingOrg) && {
          recognizedBy: {
            '@type': 'Organization' as const,
            name: s((c.authority ?? c.issuingOrg)!),
          },
        }),
        ...(c.credentialUrl && { url: c.credentialUrl }),
      })),
  ];

  // Prefer the structured name when both halves are present so `name` stays
  // consistent with the explicit givenName/familyName properties.
  const givenTrimmed = profile.givenName?.trim();
  const familyTrimmed = profile.familyName?.trim();
  const structuredName =
    givenTrimmed && familyTrimmed ? `${givenTrimmed} ${familyTrimmed}` : undefined;

  // A sole trader who kept both faces is one legal person and one business on
  // a single DID. Without an explicit link a crawler reads the /p/ Person and
  // the /c/ Organization as two unrelated entities that happen to share a
  // domain. The company goes first: it is the account's own business, ahead of
  // any self-reported position elsewhere.
  const ownCompany =
    profile.org?.personalProfileVisible && profile.org.orgProfile
      ? {
          '@type': 'Organization' as const,
          '@id': `${baseUrl}/c/${profile.handle}`,
          name: s(profile.org.orgProfile.name ?? profile.handle),
        }
      : null;
  const worksFor = [
    ...(ownCompany ? [ownCompany] : []),
    ...positions
      .filter((p) => p.company)
      .map((p) => ({
        '@type': 'Organization' as const,
        name: s(p.company!),
        ...(p.title && {
          member: {
            '@type': 'OrganizationRole' as const,
            roleName: s(p.title),
            ...(p.startedAt && { startDate: p.startedAt }),
            ...(p.endedAt && { endDate: p.endedAt }),
          },
        }),
      })),
  ];

  const awards = visible(profile.honors)
    .filter((h) => h.title)
    .map((h) => s(h.title!));
  const languages = visible(profile.languages)
    .filter((l) => l.language)
    .map((l) => l.language!);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    // Stable identifier so a /c/ Organization's `founder` can point back here.
    '@id': canonical,
    name: s(structuredName ?? profile.displayName ?? profile.handle),
    ...(givenTrimmed && { givenName: s(givenTrimmed) }),
    ...(familyTrimmed && { familyName: s(familyTrimmed) }),
    jobTitle: hasMeaningfulText(profile.headline)
      ? s(profile.headline)
      : currentPosition?.title
        ? s(currentPosition.title)
        : undefined,
    description: hasMeaningfulText(profile.about) ? s(profile.about) : undefined,
    alternateName: `@${profile.handle}`,
    url: canonical,
    image: profile.avatar ?? undefined,
    ...(profile.location && { homeLocation: buildHomeLocation(profile.location, s) }),
    ...(worksFor.length > 0 && { worksFor }),
    ...(visible(profile.education).length > 0 && {
      alumniOf: visible(profile.education)
        .filter((e) => e.institution)
        .map((e) => ({ '@type': 'EducationalOrganization' as const, name: s(e.institution!) })),
    }),
    ...(hasCredential.length > 0 && { hasCredential }),
    ...(visible(profile.volunteering).length > 0 && {
      memberOf: visible(profile.volunteering)
        .filter((v) => v.organization)
        .map((v) => ({
          '@type': 'OrganizationRole' as const,
          memberOf: { '@type': 'Organization' as const, name: s(v.organization!) },
          ...(v.role && { roleName: s(v.role) }),
          ...(v.startDate && { startDate: v.startDate }),
          ...(v.endDate && { endDate: v.endDate }),
        })),
    }),
    ...(awards.length > 0 && { award: awards }),
    ...(languages.length > 0 && { knowsLanguage: languages }),
    ...(knowsAbout && { knowsAbout }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/**
 * Section anchors are a soft public API: third-party tools link to `#career`,
 * `#languages` and friends. Renaming one is a breaking change. Each id MUST
 * match the DOM id rendered by the consuming app.
 */
const PROFILE_SECTION_HAS_PART: readonly {
  id: string;
  label: string;
  populated: (p: JsonLdProfileInput) => boolean;
}[] = [
  { id: 'about', label: 'About', populated: (p) => Boolean(p.about && p.headline) },
  { id: 'career', label: 'Career', populated: (p) => visible(p.positions).length > 0 },
  { id: 'education', label: 'Education', populated: (p) => visible(p.education).length > 0 },
  { id: 'projects', label: 'Projects', populated: (p) => (p.projects?.length ?? 0) > 0 },
  {
    id: 'credentials',
    label: 'Credentials',
    populated: (p) => visible(p.certifications).length > 0,
  },
  {
    id: 'publications',
    label: 'Publications',
    populated: (p) => (p.publications?.length ?? 0) > 0,
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    populated: (p) => visible(p.volunteering).length > 0,
  },
  { id: 'awards', label: 'Awards', populated: (p) => visible(p.honors).length > 0 },
  { id: 'languages', label: 'Languages', populated: (p) => visible(p.languages).length > 0 },
  { id: 'skills', label: 'Skills', populated: (p) => visible(p.skills).length > 0 },
  {
    id: 'other-profiles',
    label: 'Other profiles',
    populated: (p) => (p.externalAccounts?.length ?? 0) > 0,
  },
];

export function buildProfilePageJsonLd(profile: JsonLdProfileInput, options: JsonLdOptions = {}) {
  const person = buildPersonJsonLd(profile, options);
  const { '@context': _context, ...personWithoutContext } = person;

  const url = options.canonicalUrl ?? `${normaliseBaseUrl(options.baseUrl)}/p/${profile.handle}`;
  const hasPart = PROFILE_SECTION_HAS_PART.filter((section) => section.populated(profile)).map(
    (section) => ({
      '@type': 'WebPageElement' as const,
      name: section.label,
      url: `${url}#${section.id}`,
    }),
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage' as const,
    url,
    ...(profile.updatedAt && { dateModified: profile.updatedAt }),
    mainEntity: personWithoutContext,
    ...(hasPart.length > 0 && { hasPart }),
  };
}

export function buildBreadcrumbListJsonLd(
  profile: Pick<JsonLdProfileInput, 'handle' | 'displayName'>,
  options: JsonLdOptions = {},
) {
  const s = options.sanitize ?? identity;
  const baseUrl = normaliseBaseUrl(options.baseUrl);
  const name = s(profile.displayName ?? profile.handle);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList' as const,
    itemListElement: [
      { '@type': 'ListItem' as const, position: 1, name: 'Sifa', item: `${baseUrl}/` },
      {
        '@type': 'ListItem' as const,
        position: 2,
        name,
        item: `${baseUrl}/p/${profile.handle}`,
      },
    ],
  };
}
