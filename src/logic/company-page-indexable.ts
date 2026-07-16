/**
 * Firmographic subset of a company profile that decides whether its `/c/` page
 * is worth indexing. A minimal STRUCTURAL type on purpose -- it does not import
 * sifa-web's `CompanyProfile`, so this predicate stays importable by any
 * consumer (sifa-web, sifa-app, third parties). Fields mirror the external
 * firmographics that lead a `/c/` page (Wikidata / ROR / GLEIF derived), NOT
 * Sifa-aggregated stats.
 *
 * Deliberately ABSENT: claim status and Sifa-derived employee count. Company
 * page indexability is NEVER gated on either (product decision, 2026-07-16) --
 * a rich unclaimed page is indexable; a claimed but empty page is not.
 */
export interface CompanyFirmographics {
  /** External canonical name (Wikidata label / registry name). */
  canonicalName?: string | null;
  /** Free-text description / about. */
  description?: string | null;
  /** Industry / sector label. */
  industry?: string | null;
  /** URL of the company logo. */
  logoUrl?: string | null;
  /** External headcount figure (e.g. Wikidata P1128). NOT the Sifa employee count. */
  employeeCount?: number | null;
  /** Founding year or date. */
  founded?: string | number | null;
}

/**
 * Minimum number of the optional firmographic fields
 * ({@link CompanyFirmographics} minus `canonicalName`) that must be present for
 * a `/c/` company page to be indexable. Named + exported so the threshold is
 * tunable in one place.
 */
export const COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS = 2;

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** A number counts as present when finite; a founded-string counts when non-empty. */
function isPresentNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Is a `/c/` company page worth indexing?
 *
 * True iff it has real firmographic content: a non-empty `canonicalName` AND at
 * least {@link COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS} of the optional firmographic
 * fields ({@link CompanyFirmographics.description | description},
 * `industry`, `logoUrl`, `employeeCount`, `founded`) present.
 *
 * NEVER gated on claim status or Sifa employee count -- there is no such
 * parameter (product decision, 2026-07-16). A rich unclaimed stub is indexable;
 * a name-only page (claimed or not) is not.
 *
 * Pure: no network, no I/O. Third-party importable.
 */
export function isCompanyPageIndexable(company: CompanyFirmographics): boolean {
  if (!isNonEmptyString(company.canonicalName)) return false;

  let present = 0;
  if (isNonEmptyString(company.description)) present += 1;
  if (isNonEmptyString(company.industry)) present += 1;
  if (isNonEmptyString(company.logoUrl)) present += 1;
  if (isPresentNumber(company.employeeCount)) present += 1;
  if (isPresentNumber(company.founded) || isNonEmptyString(company.founded)) present += 1;

  return present >= COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS;
}
