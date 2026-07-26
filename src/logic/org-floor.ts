import type { OrgProfileRecord } from '../schemas/org-profile.js';
import { looksLikeDomain } from './domain-detect.js';
import type { AccountFacetMode } from '../types/index.js';

/**
 * Handle hosts that are shared PDS / signup domains, never a single
 * organization's registrable identity. A handle under one of these (e.g.
 * `acme.bsky.social`) is a subdomain of someone else's domain, so it can never
 * satisfy the org rendering floor. Lowercased, leading-dot form for a suffix
 * match. Kept in sync with the PDS provider list in `format/pds-utils.ts`.
 */
const KNOWN_HANDLE_HOST_SUFFIXES = [
  '.bsky.social',
  '.blacksky.app',
  '.eurosky.social',
  '.northsky.social',
] as const;

/**
 * Approximate "is this handle a custom registrable domain?" check for the org
 * rendering floor.
 *
 * IMPORTANT -- this is deliberately NARROW, not authoritative. The SDK has no
 * public-suffix-list (PSL) dependency, so it cannot compute the true eTLD+1
 * apex: it cannot tell `acme.co.uk` (an apex) from `careers.acme.co.uk` (a
 * subdomain that routes to the subsidiary case), nor reject every PSL-private
 * host. It performs only the rejects it CAN make correctly with no PSL:
 *   - DIDs (never a domain handle),
 *   - bare / no-dot handles and non-TLD-shaped hosts (via `looksLikeDomain`),
 *   - known shared PDS / handle hosts (`*.bsky.social` and friends).
 *
 * The AUTHORITATIVE apex + eTLD+1 + confusable check is server-side in
 * sifa-api's `bind-domain-guard` (`isBindableHandleDomain`, backed by `tldts`);
 * `computeOrgFloorVerdict` there is the source of truth and is surfaced to
 * clients on the profile resolve (read it via `useOrgProfile`). Recompute here
 * only when a client-side floor gate is needed without a round-trip.
 *
 * TODO(#160): promote a shared PSL-backed eTLD+1 helper into the SDK (or vendor
 * a compact public-suffix table) and tighten this to a true apex check.
 *
 * Pure: no network, no I/O.
 */
export function isRegistrableDomainHandle(handle: string): boolean {
  const h = handle.trim().toLowerCase();
  if (!h) return false;
  if (h.startsWith('did:')) return false;
  // Requires >=1 dot and a TLD-shaped final label; rejects bare usernames.
  if (!looksLikeDomain(h)) return false;
  for (const suffix of KNOWN_HANDLE_HOST_SUFFIXES) {
    if (h.endsWith(suffix)) return false;
  }
  return true;
}

/**
 * The org rendering floor (#160) -- the "any AppView can evaluate" promise made
 * executable. An account renders as an organization when BOTH:
 *   1. It has an `id.sifa.org.profile` record (record present), AND
 *   2. Its handle is a custom registrable domain
 *      ({@link isRegistrableDomainHandle}).
 *
 * Only the PRESENCE of the record matters here (declaration marks the account
 * as presenting-as-org; trust is layered separately). The handle check is LIVE:
 * evaluate it on every render so a lost domain drops org rendering
 * automatically.
 *
 * Pure: no network, no I/O. Pass the fetched record (or null) and the current
 * handle.
 */
export function qualifiesAsOrg(
  record: OrgProfileRecord | null | undefined,
  handle: string,
): boolean {
  if (record === null || record === undefined) return false;
  return isRegistrableDomainHandle(handle);
}

/**
 * The person-facet fields that decide whether an account has a CV worth
 * keeping. A structural subset of `Profile`, so callers can pass a profile
 * straight in. Every list is optional; `positions`, `education`, and `skills`
 * are always present on a real profile but typed optional here so partial
 * fixtures and trimmed payloads work.
 */
export interface PersonalFacetContent {
  headline?: string | null;
  about?: string | null;
  positions?: unknown[];
  education?: unknown[];
  skills?: unknown[];
  certifications?: unknown[];
  projects?: unknown[];
  publications?: unknown[];
  volunteering?: unknown[];
  involvement?: unknown[];
  honors?: unknown[];
  courses?: unknown[];
}

/**
 * Does this account have a personal profile worth keeping visible?
 *
 * Decides the claim-flow default when an account claims its domain as an
 * organization. An empty account claiming a domain is a plain company signup:
 * present solely as an org, ask nothing. An account that already carries a CV
 * is the sole-trader case: keeping both facets is the default, and hiding the
 * person facet must be a deliberate choice rather than a silent side effect of
 * claiming.
 *
 * True when any profile section holds at least one record, or when the headline
 * or about text is non-blank. Whitespace-only text does not count.
 *
 * Pure: no network, no I/O.
 */
export function hasPersonalProfileContent(profile: PersonalFacetContent): boolean {
  const filled = (text: string | null | undefined): boolean =>
    typeof text === 'string' && text.trim() !== '';
  if (filled(profile.headline) || filled(profile.about)) return true;
  const sections = [
    profile.positions,
    profile.education,
    profile.skills,
    profile.certifications,
    profile.projects,
    profile.publications,
    profile.volunteering,
    profile.involvement,
    profile.honors,
    profile.courses,
  ];
  return sections.some((section) => Array.isArray(section) && section.length > 0);
}

/**
 * Should this account's personal profile render at `/p/`, given the org verdict?
 *
 * The single routing predicate behind the freelancer dual-identity case: a
 * claimed org that set `personalProfileVisible` renders both facets, so `/p/`
 * serves the person instead of redirecting to `/c/`. Every other account keeps
 * the exclusive behaviour -- an org (claimed or merely recognized) redirects
 * `/p/` to `/c/`, and a plain person renders at `/p/` as always.
 *
 * Pure: no network, no I/O.
 */
export function rendersPersonalProfile(
  org: { isOrg: boolean; recognized: boolean; personalProfileVisible?: boolean } | null | undefined,
  renderPreference?: 'person' | 'company' | null,
): boolean {
  // An explicit 'person' choice is the owner's own override and wins outright:
  // it is what makes "Person" mean person, even for an account holding an org
  // record (which stays in the PDS, inert).
  if (renderPreference === 'person') return true;
  if (org === null || org === undefined) return true;
  if (!org.isOrg && !org.recognized) return true;
  // Gated on isOrg, not merely on the flag: `personalProfileVisible` lives in
  // the `id.sifa.org.profile` record, so an account that is only RECOGNIZED
  // (known company domain, never claimed) has no record to carry it and keeps
  // the redirect. Claiming is the way in.
  return org.isOrg && org.personalProfileVisible === true;
}

/**
 * Should this account's company page render at `/c/`?
 *
 * The mirror of {@link rendersPersonalProfile}. True for any company account --
 * claimed or merely recognized -- EXCEPT when the owner explicitly chose to
 * present as a person, which suppresses the company page rather than deleting
 * anything. The org record stays in the PDS and the choice is reversible.
 *
 * Pure: no network, no I/O.
 */
export function rendersCompanyProfile(
  org: { isOrg: boolean; recognized: boolean } | null | undefined,
  renderPreference?: 'person' | 'company' | null,
): boolean {
  if (renderPreference === 'person') return false;
  if (org === null || org === undefined) return false;
  return org.isOrg || org.recognized;
}

/**
 * Resolve the three-way "are you a person, a company, or both?" answer that the
 * account settings switch presents, from the two places the answer is stored.
 *
 * Precedence, highest first:
 *   1. `renderPreference === 'person'` -- the owner's explicit local override.
 *      Wins even over a claimed org record, which stays inert in the PDS.
 *   2. A claimed org that declared `personalProfileVisible` -- `'both'`, the
 *      sole trader. Read from the PDS record, so it is portable.
 *   3. Any other company account (claimed, recognized, or `renderPreference`
 *      `'company'`) -- `'company'`.
 *   4. Everything else -- `'person'`.
 *
 * Pure: no network, no I/O.
 */
export function resolveAccountFacetMode(profile: {
  org?: { isOrg: boolean; recognized: boolean; personalProfileVisible?: boolean } | null;
  renderPreference?: 'person' | 'company' | null;
}): AccountFacetMode {
  if (profile.renderPreference === 'person') return 'person';
  const org = profile.org;
  if (org?.isOrg && org.personalProfileVisible === true) return 'both';
  if (org?.isOrg || org?.recognized || profile.renderPreference === 'company') return 'company';
  return 'person';
}
