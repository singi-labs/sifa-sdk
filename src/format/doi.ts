/**
 * Reduce a DOI to its bare form: `10.1234/example`, never
 * `https://doi.org/10.1234/example` and never `doi:10.1234/example`.
 *
 * A DOI inside a URL is a link. Bare, it is an identifier, which is what lets
 * two records describing one publication be matched on it. The lexicon stores
 * the bare form for that reason.
 *
 * People paste the resolver URL, because that is what a publisher page and a
 * citation manager both hand you, and citations carry the `doi:` scheme.
 * Normalizing on the way in is the difference between a field that dedupes and
 * a field holding three spellings of one value.
 *
 * Input that is not a DOI at all is trimmed and returned as-is. This is a
 * normalizer, not a validator: rejecting here would fail a write over a field
 * nothing depends on, and older registrants produce shapes worth not policing.
 */
export function normalizeDoi(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
}
