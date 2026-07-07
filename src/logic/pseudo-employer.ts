/**
 * Pseudo-employer detection (#159). Self-employment strings ("self-employed",
 * "freelance", "independent", ...) are NOT organizations: the position editor
 * routes them to the company-optional / "Independent" path instead of the entity
 * typeahead, and they are excluded from entity matching everywhere.
 *
 * Matching is on the WHOLE normalized string, not substrings, so real employers
 * that merely contain one of these words ("Independent School District 191")
 * are not misclassified. Mirrors the sifa-api matcher.
 */
const PSEUDO_EMPLOYERS = new Set<string>([
  'self',
  'self employed',
  'selfemployed',
  'self employment',
  'self employed freelance',
  'freelance',
  'freelancer',
  'freelancing',
  'freelance work',
  'independent',
  'independent contractor',
  'independent consultant',
  'independent professional',
  'sole proprietor',
  'sole proprietorship',
  'sole trader',
  'own business',
  'my own business',
  'self employed consultant',
]);

function normalizePseudo(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** True when the whole employer string is a self-employment / pseudo employer. */
export function isPseudoEmployer(company: string): boolean {
  const normalized = normalizePseudo(company);
  if (!normalized) return false;
  return PSEUDO_EMPLOYERS.has(normalized);
}
