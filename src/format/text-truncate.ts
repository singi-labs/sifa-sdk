const ELLIPSIS = '\u2026';

/**
 * Truncate a string to at most `maxLen` grapheme clusters, appending an
 * ellipsis when the string was shortened. Grapheme-aware so it never splits
 * emoji sequences (ZWJ, regional indicators, combining marks, surrogate pairs).
 */
export function truncateGraphemes(value: string, maxLen: number): string {
  if (maxLen <= 0) return '';
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const graphemes = Array.from(segmenter.segment(value), (s) => s.segment);
  if (graphemes.length <= maxLen) return value;
  if (maxLen === 1) return ELLIPSIS;
  return graphemes.slice(0, maxLen - 1).join('') + ELLIPSIS;
}
