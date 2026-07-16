import type { OrgProfileRecord } from '../schemas/org-profile.js';
import { looksLikeDomain } from './domain-detect.js';

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
