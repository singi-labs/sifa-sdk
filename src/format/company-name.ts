// Connector words kept lowercase in a title unless they lead the name. Includes
// a few common non-English ones (Dutch/German/French/Spanish) since the company
// data is international.
const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'the',
  'of',
  'for',
  'to',
  'in',
  'on',
  'at',
  'by',
  'or',
  'nor',
  'but',
  'as',
  'vs',
  'via',
  'with',
  'de',
  'del',
  'van',
  'von',
  'der',
  'den',
  'het',
  'la',
  'le',
  'y',
]);

function capitalizeWord(word: string): string {
  // Uppercase the first letter/digit, leaving any leading punctuation
  // (quotes, parens) and the rest of the word untouched.
  return word.replace(
    /^([^\p{L}\p{N}]*)(\p{L})/u,
    (_m, lead: string, ch: string) => lead + ch.toUpperCase(),
  );
}

/**
 * Best-effort title-case for a company display name.
 *
 * Company names from the PDL crawl are stored all-lowercase ("spryker",
 * "spryker systems gmbh"), which reads poorly in the UI. This capitalizes them
 * for display. Names that already carry any uppercase (ROR / Wikidata, e.g.
 * "University of Testing" or "IBM") are assumed correctly cased and returned
 * unchanged, so a proper name is never mangled ("University Of Testing").
 *
 * It is intentionally not a canonicalizer: acronyms it can't know about stay
 * word-cased ("gmbh" -> "Gmbh"). The user's own custom display name is the
 * escape hatch when the heuristic is wrong.
 */
export function formatCompanyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed !== trimmed.toLowerCase()) return trimmed;

  let seenWord = false;
  // Split on whitespace but keep the separators so original spacing survives.
  return trimmed
    .split(/(\s+)/)
    .map((token) => {
      if (token.length === 0 || /^\s+$/.test(token)) return token;
      const isFirst = !seenWord;
      seenWord = true;
      if (!isFirst && SMALL_WORDS.has(token)) return token;
      return capitalizeWord(token);
    })
    .join('');
}
