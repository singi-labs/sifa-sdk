/**
 * Slug helpers for talk-page URLs. Pure and offline: a talk page lives at a
 * path like `/{slug}-{rkey}`, where the slug is a human-readable, SEO-friendly
 * rendering of the title and the rkey is the record's stable identifier.
 * Because TIDs never contain a `-`, the rkey can always be recovered as the
 * substring after the final `-`.
 */

/** Maximum slug length before the trailing rkey is appended. */
const MAX_SLUG_LENGTH = 60;

/** Combining diacritical marks left behind by NFKD decomposition (U+0300–U+036F). */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Render a title as a URL slug: lowercased, diacritics stripped, runs of
 * non-alphanumerics collapsed to a single `-`, trimmed, and capped at 60 chars.
 * Returns `''` for an empty or whitespace-only title.
 */
export function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    // Strip combining marks left by NFKD decomposition (é -> e).
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    // Collapse any run of non-alphanumerics into a single hyphen.
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse repeated hyphens.
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens.
    .replace(/^-+|-+$/g, '');
  // Cap length, then trim a trailing hyphen the cut may have exposed.
  return slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '');
}

/**
 * Build the talk-page path segment `${slug}-${rkey}`, or just `rkey` when the
 * title produces an empty slug.
 */
export function buildTalkSlug(title: string, rkey: string): string {
  const slug = slugifyTitle(title);
  return slug ? `${slug}-${rkey}` : rkey;
}

/**
 * Recover the rkey from a talk-page segment: the substring after the final `-`
 * (TIDs contain no `-`). Returns the whole segment when there is no `-`.
 */
export function parseTalkRkey(segment: string): string {
  const idx = segment.lastIndexOf('-');
  return idx === -1 ? segment : segment.slice(idx + 1);
}
