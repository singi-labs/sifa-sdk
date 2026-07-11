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
 */
const DOMAIN_SHAPE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

export function looksLikeDomain(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q || /\s/.test(q) || q.includes('@')) return false;
  const host = q
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // scheme://
    .replace(/[/?#].*$/, '') // path / query / fragment
    .replace(/^www\./, '')
    .replace(/:\d+$/, '') // port
    .replace(/\.+$/, ''); // trailing dot(s)
  return DOMAIN_SHAPE.test(host);
}
