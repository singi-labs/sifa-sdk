/**
 * The subset of a company profile that decides whether its `/c/` page is worth
 * indexing. A minimal STRUCTURAL type on purpose -- it does not import
 * sifa-web's `CompanyProfile`, so this predicate stays importable by any
 * consumer (sifa-web, sifa-app, sifa-api's sitemap, third parties).
 *
 * The line (product decision, 2026-09-28): a page is indexable when it is
 * claimed, when it has a visible people roster, or when it carries enough real
 * facts. Inferred values (a Jev-classified industry) never count: they are
 * guesses at the lowest provenance, not content a searcher came for.
 */
export interface CompanyFirmographics {
  /** External canonical name (Wikidata label / registry name). */
  canonicalName?: string | null;
  /** Free-text description / about. Counts only from {@link COMPANY_PAGE_MIN_DESCRIPTION_LENGTH} characters. */
  description?: string | null;
  /** Industry / sector label. */
  industry?: string | null;
  /** Provenance source of `industry`. `'jev'` (inferred) never counts; absent counts. */
  industrySource?: string | null;
  /** URL of the company logo. */
  logoUrl?: string | null;
  /** External headcount figure (e.g. Wikidata P1128). NOT the Sifa member count. */
  employeeCount?: number | null;
  /** Founding year or date. */
  founded?: string | number | null;
  /** Country code or name. */
  country?: string | null;
  /** Headquarters block; any non-empty part counts as a location. */
  hq?: Record<string, unknown> | null;
  /** External links keyed by type (website, linkedin, wikipedia, ...). */
  externalLinks?: Record<string, unknown> | null;
  /** Number of Sifa members who list this organization. */
  memberCount?: number | null;
  /** The organization has claimed the page. */
  claimed?: boolean | null;
}

/**
 * Minimum number of real facts an unclaimed page without a visible roster needs
 * to be indexable. The seven facts are a description of at least
 * {@link COMPANY_PAGE_MIN_DESCRIPTION_LENGTH} characters, a logo, a headcount,
 * a founding date, a location, an external link, and a non-inferred industry;
 * at least one Sifa member adds one bonus point.
 */
export const COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS = 5;

/** Shorter descriptions ("company in Japan") are registry one-liners, not content. */
export const COMPANY_PAGE_MIN_DESCRIPTION_LENGTH = 40;

/** Member count at which the page shows its people roster; such a page is always indexable. */
export const COMPANY_PAGE_ROSTER_MIN_MEMBERS = 5;

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPresentNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasAnyValue(record: Record<string, unknown> | null | undefined): boolean {
  if (!record) return false;
  return Object.values(record).some((v) => isNonEmptyString(v) || isPresentNumber(v));
}

/**
 * Richness score of a `/c/` page: one point per real fact present, plus one
 * bonus point when at least one Sifa member lists the organization. Pure.
 */
export function companyPageRichness(company: CompanyFirmographics): number {
  let score = 0;
  const description = company.description?.trim() ?? '';
  if (description.length >= COMPANY_PAGE_MIN_DESCRIPTION_LENGTH) score += 1;
  if (isNonEmptyString(company.logoUrl)) score += 1;
  if (isPresentNumber(company.employeeCount)) score += 1;
  if (isPresentNumber(company.founded) || isNonEmptyString(company.founded)) score += 1;
  if (isNonEmptyString(company.country) || hasAnyValue(company.hq)) score += 1;
  if (hasAnyValue(company.externalLinks)) score += 1;
  if (isNonEmptyString(company.industry) && company.industrySource !== 'jev') score += 1;
  if (isPresentNumber(company.memberCount) && (company.memberCount ?? 0) >= 1) score += 1;
  return score;
}

/**
 * Is a `/c/` company page worth indexing (per-page `robots` meta and the
 * company sitemap)?
 *
 * True iff it has a non-empty `canonicalName` AND any of: it is claimed; it has
 * at least {@link COMPANY_PAGE_ROSTER_MIN_MEMBERS} Sifa members (the roster is
 * visible); or its {@link companyPageRichness} reaches
 * {@link COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS}.
 *
 * Pure: no network, no I/O. Third-party importable.
 */
export function isCompanyPageIndexable(company: CompanyFirmographics): boolean {
  if (!isNonEmptyString(company.canonicalName)) return false;
  if (company.claimed === true) return true;
  if ((company.memberCount ?? 0) >= COMPANY_PAGE_ROSTER_MIN_MEMBERS) return true;
  return companyPageRichness(company) >= COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS;
}
