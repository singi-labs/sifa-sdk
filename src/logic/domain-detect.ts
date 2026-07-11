/**
 * Lightweight "does this typeahead query look like a domain?" predicate, used to
 * decide whether to fire the domain grow-on-demand path (resolve-domain) on a
 * local typeahead miss. It is a heuristic, NOT a validator: the API re-validates
 * against the public suffix list. It only needs to distinguish "randstad.com"
 * (a domain) from "Randstad" / "Acme Corp" (a name) so a plain company name
 * never triggers a domain lookup.
 *
 * Accepts an optional scheme and path (`https://www.stripe.com/pricing`), a
 * leading `www.`, and multi-label hosts; requires at least one dot and a >=2
 * alpha final label (TLD-shaped); rejects whitespace and `@` (emails).
 *
 * Runs on uncontrolled typeahead input, so it is deliberately ReDoS-safe: the
 * input length is bounded up front (a domain is <=253 chars), the host is
 * extracted with plain string ops (no scheme/path/trailing-dot regex), and each
 * label is validated by a single anchored, bounded pattern. There is no
 * ambiguous or nested quantifier anywhere, so matching is linear in the input.
 */

/** Max DNS name length; anything longer is rejected before any matching. */
const MAX_DOMAIN_LEN = 253;

/**
 * One DNS label: 1-63 chars, alphanumeric, internal hyphens allowed. Anchored
 * and length-bounded, with a single optional group and no outer quantifier, so
 * it cannot backtrack polynomially.
 */
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Final label must be TLD-shaped: 2-63 alphabetic chars. */
const TLD = /^[a-z]{2,63}$/;

/** Strip trailing dots without a regex (avoids the `\.+$` polynomial pattern). */
function stripTrailingDots(s: string): string {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 0x2e /* '.' */) end -= 1;
  return s.slice(0, end);
}

export function looksLikeDomain(query: string): boolean {
  const q = query.trim().toLowerCase();
  // Bound the input BEFORE any matching. A domain is <=253 chars; a longer
  // typeahead value is never a domain, and this caps every check below to a
  // constant amount of work (ReDoS guard).
  if (!q || q.length > MAX_DOMAIN_LEN) return false;
  if (q.includes(' ') || q.includes('\t') || q.includes('@')) return false;

  // Extract the host with plain string ops -- no backtracking regex on input.
  let host = q;
  const schemeAt = host.indexOf('://');
  if (schemeAt !== -1) host = host.slice(schemeAt + 3);
  // Cut at the first path / query / fragment delimiter.
  for (let i = 0; i < host.length; i += 1) {
    const ch = host[i];
    if (ch === '/' || ch === '?' || ch === '#') {
      host = host.slice(0, i);
      break;
    }
  }
  if (host.startsWith('www.')) host = host.slice(4);
  // Strip a trailing :port.
  const colonAt = host.lastIndexOf(':');
  if (colonAt !== -1 && /^[0-9]{1,5}$/.test(host.slice(colonAt + 1))) {
    host = host.slice(0, colonAt);
  }
  host = stripTrailingDots(host);
  if (!host || host.length > MAX_DOMAIN_LEN) return false;

  // Validate each label independently (split first, so no quantifier spans dots).
  const labels = host.split('.');
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (tld === undefined || !TLD.test(tld)) return false;
  for (let i = 0; i < labels.length - 1; i += 1) {
    if (!LABEL.test(labels[i] as string)) return false;
  }
  return true;
}
