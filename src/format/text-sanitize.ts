const COMBINING_MARK = /\p{M}/u;
const BIDI_CONTROLS = /[‎‏‪-‮⁦-⁩]/gu;

/**
 * Limit runs of Unicode combining marks (`\p{M}`) to at most `maxPerBase`
 * marks following any single base character. Defuses "Zalgo" text where
 * dozens of stacked combining marks render outside the line box and bleed
 * into neighbouring UI.
 *
 * `maxPerBase` defaults to 4 — high enough to preserve legitimate stacks
 * in Thai, Arabic, Vietnamese, and IPA, low enough to neutralise the
 * vertical-overflow attack vector.
 */
export function limitCombiningMarks(value: string, maxPerBase = 4): string {
  if (!value || !COMBINING_MARK.test(value)) return value;

  let out = '';
  let combiningRun = 0;
  for (const char of value) {
    if (/\p{M}/u.test(char)) {
      if (combiningRun < maxPerBase) {
        out += char;
        combiningRun += 1;
      }
    } else {
      out += char;
      combiningRun = 0;
    }
  }
  return out;
}

/**
 * Sanitise untrusted display text from PDS records before rendering in UI:
 * - strips bidi formatting controls (LRM/RLM/LRE/RLE/PDF/LRO/RLO/LRI/RLI/FSI/PDI)
 *   that can hijack reading order or crash `next/og` (see Satori LRM+emoji bug)
 * - limits stacked combining marks (Zalgo defence)
 *
 * Preserves ZWJ (U+200D) so emoji sequences keep rendering.
 */
export function sanitizeDisplayText(value: string, maxCombiningPerBase = 4): string {
  if (!value) return value;
  return limitCombiningMarks(value.replace(BIDI_CONTROLS, ''), maxCombiningPerBase);
}
