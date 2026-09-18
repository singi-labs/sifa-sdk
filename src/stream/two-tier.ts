import { isRelationalActivity } from '../taxonomy/relational.js';
import type { StreamCardBody, StreamCardVM } from './stream-card-vm.js';

/** The collection NSID from an at-uri (at://did/collection/rkey). */
function collectionOf(uri: string): string {
  return uri.split('/')[3] ?? '';
}

/**
 * Body kinds whose content is inherently rich enough to warrant a card when the
 * actor authored it: structured records that a one-line summary would gut
 * (a merged PR with diff stats, a book log, a media review, a music track, an
 * embedded media body). Plain `text` and `generic` are deliberately NOT here:
 * a text post renders inline on the line, keeping the timeline compact.
 */
const RICH_BODY_KINDS: ReadonlySet<StreamCardBody['kind']> = new Set([
  'github-pr',
  'book',
  'media-review',
  'media',
  'track',
]);

/**
 * Whether a view-model carries rich content worth a card (as opposed to a
 * compact line): resolved media, an external-link card, or a structured rich
 * body. Independent of who authored it — {@link isSelfAuthoredRich} adds the
 * authorship gate.
 */
function isRich(vm: StreamCardVM): boolean {
  if (vm.media && vm.media.length > 0) return true;
  if (vm.externalLink) return true;
  if (vm.body && RICH_BODY_KINDS.has(vm.body.kind)) return true;
  return false;
}

/**
 * The two-tier timeline rule: a `StreamCardVM` upgrades from a compact line to
 * a rich card only when BOTH hold — it is the actor's OWN creation
 * (`tier === 'creation'`, not a relational `action` like an RSVP, reply, or
 * endorsement) AND it carries rich content ({@link isRich}). A followee's own
 * photo or book log becomes a card; their comment on someone else's photo, or a
 * bare `:)` post, stays a line.
 *
 * A relational activity (comment, reply, RSVP, endorsement, membership, ...) is
 * NEVER rich, even when it carries media: the line shows what was acted on and
 * links out, rather than reproducing someone else's content.
 */
export function isSelfAuthoredRich(vm: StreamCardVM): boolean {
  if (isRelationalActivity(collectionOf(vm.uri))) return false;
  return vm.tier === 'creation' && isRich(vm);
}

/** Convenience inverse of {@link isSelfAuthoredRich}: render this VM as a line. */
export function renderAsLine(vm: StreamCardVM): boolean {
  return !isSelfAuthoredRich(vm);
}
