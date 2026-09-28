import type { StreamCardBody, StreamCardSubject, StreamCardVM } from './stream-card-vm.js';

/**
 * The primary content string a stream card should show next to its verb: the
 * name of the thing that was published / visited / annotated, not just the verb.
 *
 * `StreamCardVM.title` is a verb-only fragment ("Published", "Was at",
 * "Annotated") by design; the real title lives in `body.<kind>` (a document's
 * `title`, a check-in's `venueName`, ...) or, for records acted on rather than
 * created, in `subject`. Every client needs the same extraction, so it lives
 * here rather than being reimplemented per surface (which is how web and app
 * drifted). Presentation (links, mention chips, nested posts) stays per-client;
 * this returns just the string and its canonical link.
 */

/**
 * The record's own content for the body: its text for text-bearing kinds (posts,
 * comments), else its title for titled kinds (a Standard-site document, whose
 * body carries `title` rather than `text`), else a place (`venueName`) or a
 * community (`communityName`). Returns null when the body carries no such field.
 */
export function streamCardBodyContent(body: StreamCardBody | undefined): string | null {
  if (!body) return null;
  if ('text' in body && body.text?.trim()) return body.text.trim();
  if ('title' in body && body.title?.trim()) return body.title.trim();
  if ('venueName' in body && body.venueName?.trim()) return body.venueName.trim();
  if ('communityName' in body && body.communityName?.trim()) return body.communityName.trim();
  return null;
}

/** The display text for a subject a card acted on (an annotated page, a reposted post, a mentioned person). */
export function streamCardSubjectText(subject: StreamCardSubject | undefined): string | null {
  if (!subject) return null;
  switch (subject.kind) {
    case 'record':
      return subject.title?.trim() || null;
    case 'person':
      return subject.displayName?.trim() || subject.handle?.trim() || null;
    case 'post':
      return streamCardBodyContent(subject.post.body);
  }
}

export interface StreamCardContent {
  /** The primary content string, or null when the card has none (verb alone). */
  text: string | null;
  /** The canonical link for that content, or null. */
  url: string | null;
}

/**
 * The content string + link for a stream card: the subject it acted on when
 * present (an annotated page title), otherwise its own body content (an article
 * title, a venue). Clients render `vm.title` as the muted verb and this as the
 * highlighted, optionally-linked content.
 */
export function streamCardContent(vm: StreamCardVM): StreamCardContent {
  const subjectText = streamCardSubjectText(vm.subject);
  if (subjectText) {
    const subjectUrl = vm.subject && 'url' in vm.subject ? (vm.subject.url ?? null) : null;
    return { text: subjectText, url: subjectUrl ?? vm.sourceUrl ?? null };
  }
  return { text: streamCardBodyContent(vm.body), url: vm.sourceUrl ?? null };
}
