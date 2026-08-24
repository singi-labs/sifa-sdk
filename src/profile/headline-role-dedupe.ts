/**
 * Profiles carry both a freeform `headline` and a derived current-role line
 * ("{title} at {company}"). Most people write a headline distinct from their
 * job title, so both add information. But LinkedIn imports default the headline
 * to "Title at Company" -- which collides with the derived role line and renders
 * the same text twice (a doubled tagline).
 *
 * This predicate lets each surface (profile header, meta description, embed card)
 * suppress the role line when it merely repeats the headline. Callers compose the
 * role line themselves -- including any localized connector word ("at") -- and ask
 * whether it duplicates the headline. Comparison is case-, whitespace-, and
 * trailing-punctuation-insensitive; a headline that adds anything beyond the role
 * line is not treated as redundant.
 */
function normalize(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:·|]+$/, '')
    .trim()
    .toLowerCase();
}

export function isRoleLineRedundant(
  headline: string | null | undefined,
  roleLine: string | null | undefined,
): boolean {
  if (!headline || !roleLine) return false;
  return normalize(headline) === normalize(roleLine);
}
