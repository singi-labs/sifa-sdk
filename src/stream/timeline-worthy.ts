import { streamCardContent } from './stream-card-content.js';
import type { StreamCardVM } from './stream-card-vm.js';
import { isSelfAuthoredRich } from './two-tier.js';

/**
 * Where a reader lands when they open this item, or null when nowhere: the
 * subject it acted on (a person's profile, a referenced record or post), else
 * the record's own permalink, else its external link card.
 */
function destination(vm: StreamCardVM): string | null {
  const subject = vm.subject;
  if (subject?.kind === 'person') return subject.handle ? `/p/${subject.handle}` : null;
  if (subject?.kind === 'record') return subject.url ?? vm.sourceUrl ?? null;
  if (subject?.kind === 'post') return subject.post.sourceUrl ?? vm.sourceUrl ?? null;
  return vm.sourceUrl ?? vm.externalLink?.url ?? null;
}

/**
 * Whether an item belongs on the multi-author timeline: it says concretely what
 * the person did AND links to it. A rich card (a photo, a book log) is concrete
 * by its content; a line needs content after its verb (a subject or the
 * record's own text / title), not a bare "Shared". A membership is the
 * exception: the app it joined is its object. Items that fail either half
 * read as noise ("Shared" with nothing to open), so the timeline drops them.
 * Single-author surfaces (a profile's own history) do not apply this.
 */
export function isTimelineWorthy(vm: StreamCardVM): boolean {
  if (!destination(vm)) return false;
  if (isSelfAuthoredRich(vm)) return true;
  // "Joined" needs no object: the app pill next to it names what was joined
  // ("Joined" + AT Commons).
  if (vm.verb === 'joined') return true;
  return streamCardContent(vm).text !== null;
}
