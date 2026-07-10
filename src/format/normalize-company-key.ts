// Combining diacritical marks (U+0300-U+036F) produced by NFD decomposition.
// Stripping these after decomposing is the standard way to fold "é" -> "e"
// without a per-character lookup table.
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Build a stable dedup/prefix key for a company name (decision D8).
 *
 * NFC-normalizes, case-folds, and strips Latin diacritics so that visually
 * or logically equivalent spellings collapse to one key: "Nestlé", "Nestle",
 * and "NESTLE" all produce the same value. Non-Latin scripts (Cyrillic, CJK,
 * etc) have no Latin diacritics to strip, so they pass through case-folded
 * and NFC-normalized only.
 *
 * This is a pure SDK helper for the in-memory/dedup key. Persisting it as a
 * dedicated column on the sifa-api side is tracked separately
 * (sifa-workspace#229) and out of scope here.
 */
export function normalizeCompanyKey(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  const caseFolded = trimmed.normalize('NFC').toLowerCase();
  return caseFolded.normalize('NFD').replace(COMBINING_MARKS, '').normalize('NFC');
}
