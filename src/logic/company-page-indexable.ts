/**
 * The subset of a company profile that decides whether its `/c/` page is worth
 * indexing. A minimal STRUCTURAL type on purpose -- it does not import
 * sifa-web's `CompanyProfile`, so this predicate stays importable by any
 * consumer (sifa-web, sifa-app, sifa-api's sitemap, third parties).
 *
 * The line (product decision, 2026-11-10): a page is indexable when it is
 * claimed or when it shows a people roster. Firmographic facts alone never
 * qualify: they repeat public registries, while the people are what only Sifa
 * has.
 */
export interface CompanyPageIndexFacts {
  /** External canonical name (Wikidata label / registry name). */
  canonicalName?: string | null;
  /** Number of Sifa members who list this organization. */
  memberCount?: number | null;
  /** The organization has claimed the page. */
  claimed?: boolean | null;
}

/** Member count at which the page shows its people roster; such a page is indexable. */
export const COMPANY_PAGE_ROSTER_MIN_MEMBERS = 5;

/**
 * Is a `/c/` company page worth indexing (per-page `robots` meta and the
 * company sitemap)?
 *
 * True iff it has a non-empty `canonicalName` AND it is claimed or has at
 * least {@link COMPANY_PAGE_ROSTER_MIN_MEMBERS} Sifa members (the roster is
 * visible).
 *
 * Pure: no network, no I/O. Third-party importable.
 */
export function isCompanyPageIndexable(company: CompanyPageIndexFacts): boolean {
  if (typeof company.canonicalName !== 'string' || company.canonicalName.trim() === '') {
    return false;
  }
  if (company.claimed === true) return true;
  const members = company.memberCount;
  return (
    typeof members === 'number' &&
    Number.isFinite(members) &&
    members >= COMPANY_PAGE_ROSTER_MIN_MEMBERS
  );
}
