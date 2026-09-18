/**
 * Endorsement comments carry an optional relationship-context prefix written by
 * the endorse dialog, e.g. `[worked_together: Acme] great colleague`. The prefix
 * is a UI convention baked into the free-text comment, not a structured lexicon
 * field. This splits a stored comment back into a human relationship label and
 * the endorser's own note, so no surface ever shows a raw `[supervised_by]`
 * token. Shared by every Sifa client (web and app) so all of them render the
 * same friendly labels.
 */

/** Leading `[type]` or `[type: detail]` group, plus any trailing whitespace. */
const RELATIONSHIP_PREFIX = /^\[(\w+?)(?:: ([^\]]+))?\]\s*/;

export interface ParsedEndorsementComment {
  /** Human-readable relationship label, or null when the comment has no prefix. */
  relationship: string | null;
  /** The endorser's free-text note with the prefix removed, or null when empty. */
  note: string | null;
}

/**
 * Friendly label for a relationship-context token. The detail is appended for
 * the options that collect one. Mirrors the endorse dialog's option list; keep
 * the two in step.
 */
export function formatRelationship(type: string, detail?: string): string | null {
  const trimmed = detail?.trim() || undefined;
  switch (type) {
    case 'worked_together':
      return trimmed ? `Worked together at ${trimmed}` : 'Worked together';
    case 'collaborated_in':
      return trimmed ? `Collaborated in ${trimmed}` : 'Collaborated';
    case 'supervised_by':
      // Reworded from the old "Supervised / was supervised by": that read as
      // bidirectional and ambiguous, and it shows publicly on profiles.
      return 'Manager or mentor relationship';
    case 'co_authored':
      return 'Co-authored';
    case 'other':
      // For "other" the endorser's own words are the relationship.
      return trimmed ?? null;
    default:
      return null;
  }
}

/**
 * Split a stored endorsement comment into its relationship label and free-text
 * note. A comment with no prefix returns `{ relationship: null, note }`.
 */
export function parseEndorsementComment(comment?: string | null): ParsedEndorsementComment {
  if (!comment) return { relationship: null, note: null };

  const match = comment.match(RELATIONSHIP_PREFIX);
  if (!match) {
    const note = comment.trim();
    return { relationship: null, note: note || null };
  }

  const relationship = formatRelationship(match[1] ?? '', match[2]);
  const note = comment.slice(match[0].length).trim();
  return { relationship, note: note || null };
}
