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

/**
 * True when `value` contains at least one letter outside the ASCII range
 * (accented Latin, Cyrillic, Greek, CJK, Turkish dotted/dotless i, etc).
 *
 * Iterating by code point (not `.length`) matters for astral-plane
 * characters (e.g. some CJK), which are represented as surrogate pairs.
 */
export function hasNonAsciiLetter(value: string): boolean {
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint > 0x7f && /\p{L}/u.test(char)) return true;
  }
  return false;
}

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
 *
 * Scoped to ASCII-Latin case-bearing strings (decision D8): any name
 * containing a non-ASCII letter (accented Latin, Cyrillic, Greek, CJK,
 * Turkish dotted/dotless i, etc) is returned unchanged. Locale-dependent
 * casing rules (Turkish i/İ vs ı/I is the canonical trap) make naive
 * `toUpperCase`/`toLowerCase` unsafe outside ASCII, and this formatter has
 * no reliable way to pick the right locale for an arbitrary company name.
 *
 * Known limitation: this does not (and cannot) distinguish an intentional
 * all-lowercase ASCII wordmark ("adidas", "thyssenkrupp") from a
 * PDL-lowercased name that should be title-cased ("spryker" -> "Spryker").
 * Both are pure ASCII, so both still get title-cased. See sifa-workspace#235.
 */
export function formatCompanyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || hasNonAsciiLetter(trimmed) || trimmed !== trimmed.toLowerCase()) return trimmed;

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
