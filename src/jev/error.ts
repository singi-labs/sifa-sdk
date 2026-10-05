/**
 * Error-report judgments for the GlitchTip relay (sifa-workspace decision
 * 2026-10-05, background agents tier policy, Phase 2). Pure builders: the
 * state for "is this error event the same bug as an existing issue?", the
 * Noul question, the threshold, and the scrubber that removes identifiers
 * before anything leaves the server. No network, no key.
 *
 * Privacy: GlitchTip frames and messages can embed handles, DIDs, emails and
 * URLs with user paths. {@link scrubErrorText} runs over every string placed
 * in the state; callers must not bypass it.
 */

import type { NoulQuestion } from './index.js';

// ---------------------------------------------------------------------------
// Scrubbing
// ---------------------------------------------------------------------------

const DID_RE = /did:(?:plc|web):[A-Za-z0-9._:%-]+/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/** `@handle.tld` mentions; a bare `@` inside code (decorators) has no dot-tld. */
const HANDLE_RE = /@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
/** `/p/<handle>` and `/profile/<handle>` path segments on Sifa URLs. */
const PROFILE_PATH_RE = /(\/(?:p|profile)\/)[^/\s?#]+/g;
/** at:// URIs carry a DID or handle as authority. */
const AT_URI_RE = /at:\/\/[^\s/]+/g;

/** Replace identifiers with stable placeholders. Idempotent. */
export function scrubErrorText(text: string): string {
  return text
    .replace(AT_URI_RE, 'at://<id>')
    .replace(DID_RE, '<did>')
    .replace(EMAIL_RE, '<email>')
    .replace(HANDLE_RE, '<handle>')
    .replace(PROFILE_PATH_RE, '$1<handle>');
}

// ---------------------------------------------------------------------------
// Input and state
// ---------------------------------------------------------------------------

/** One stack frame, already reduced to what a same-bug judgment needs. */
export interface ErrorFrameInput {
  filename?: string;
  function?: string;
  lineNo?: number;
  inApp?: boolean;
}

/** A GlitchTip issue (error group) as seen by the relay. */
export interface ErrorReportInput {
  title: string;
  culprit?: string;
  level?: string;
  /** Exception type, e.g. `TypeError`. */
  type?: string;
  /** Exception value / message. */
  value?: string;
  frames?: ErrorFrameInput[];
  /** Release or deploy identifier, when GlitchTip has it. */
  release?: string;
}

/** An existing GitHub issue candidate (title + body, labelled `glitchtip`). */
export interface IssueCandidateInput {
  number: number;
  title: string;
  body?: string;
}

/** Keep the judgment cheap and bounded: top in-app frames only. */
export const ERROR_MAX_FRAMES = 8;
export const ISSUE_CANDIDATE_BODY_MAX_CHARS = 2000;

export interface ErrorReportState {
  title: string;
  culprit?: string;
  level?: string;
  type?: string;
  value?: string;
  release?: string;
  frames?: Array<{ filename?: string; function?: string; lineNo?: number }>;
}

export interface IssueCandidateState {
  number: number;
  title: string;
  body?: string;
}

function frameState(frames: ErrorFrameInput[]): ErrorReportState['frames'] {
  const inApp = frames.filter((f) => f.inApp !== false);
  const chosen = (inApp.length > 0 ? inApp : frames).slice(0, ERROR_MAX_FRAMES);
  const out = chosen.map((f) => {
    const s: { filename?: string; function?: string; lineNo?: number } = {};
    if (f.filename) s.filename = scrubErrorText(f.filename);
    if (f.function) s.function = scrubErrorText(f.function);
    if (typeof f.lineNo === 'number') s.lineNo = f.lineNo;
    return s;
  });
  return out.length > 0 ? out : undefined;
}

/** Scrubbed, bounded state for the error side of the pair. */
export function buildErrorReportState(report: ErrorReportInput): ErrorReportState {
  const state: ErrorReportState = { title: scrubErrorText(report.title.trim()) };
  if (report.culprit) state.culprit = scrubErrorText(report.culprit);
  if (report.level) state.level = report.level;
  if (report.type) state.type = scrubErrorText(report.type);
  if (report.value) state.value = scrubErrorText(report.value.trim());
  if (report.release) state.release = report.release;
  const frames = report.frames ? frameState(report.frames) : undefined;
  if (frames) state.frames = frames;
  return state;
}

/** Scrubbed, bounded state for the GitHub issue side of the pair. */
export function buildIssueCandidateState(issue: IssueCandidateInput): IssueCandidateState {
  const state: IssueCandidateState = {
    number: issue.number,
    title: scrubErrorText(issue.title.trim()),
  };
  const body = issue.body?.trim();
  if (body) state.body = scrubErrorText(body.slice(0, ISSUE_CANDIDATE_BODY_MAX_CHARS));
  return state;
}

/** State for one error-vs-issue pair, both under stable named fields. */
export function buildErrorIssuePairState(
  report: ErrorReportInput,
  issue: IssueCandidateInput,
): { error: ErrorReportState; issue: IssueCandidateState } {
  return { error: buildErrorReportState(report), issue: buildIssueCandidateState(issue) };
}

// ---------------------------------------------------------------------------
// Question and threshold
// ---------------------------------------------------------------------------

/** Static Noul question paired with {@link buildErrorIssuePairState}. */
export const ERROR_SAME_BUG_NOUL_QUESTION: NoulQuestion = {
  type: 'noul',
  instructions:
    'The state holds an error report (title, culprit, exception, top stack frames) and an existing GitHub issue. Does the issue describe the same underlying bug as the error report?',
  criteria: {
    true: 'Same root cause: the same exception at the same code path, or the issue text names the same failure even if line numbers or messages differ slightly.',
    false:
      'A different bug: different exception type or code path, a different feature, or an issue that only shares generic words (error, 500, profile) with the report.',
  },
};

/**
 * Precision over recall: a false "same bug" hides a new error behind an old
 * issue; a false "new" costs one duplicate issue a human closes. Validate on
 * labelled GlitchTip-event-to-issue pairs before widening.
 */
export const SAME_BUG_THRESHOLD = 0.85;

/** True when the Noul probability clears the same-bug threshold. */
export function isLikelySameBug(noul: number, threshold: number = SAME_BUG_THRESHOLD): boolean {
  return noul >= threshold;
}

/**
 * Question ids for a batched call over several candidates: one Noul per
 * candidate, keyed `sameBug:<issueNumber>`. Pair with one state holding
 * `error` plus `candidates[]`; each question names its candidate number.
 */
export function buildSameBugQuestions(
  candidates: IssueCandidateInput[],
): Record<string, NoulQuestion> {
  const out: Record<string, NoulQuestion> = {};
  for (const c of candidates) {
    out[`sameBug:${c.number}`] = {
      type: 'noul',
      instructions: `${ERROR_SAME_BUG_NOUL_QUESTION.instructions} Judge the candidate issue with number ${c.number} in state.candidates.`,
      ...(ERROR_SAME_BUG_NOUL_QUESTION.criteria
        ? { criteria: ERROR_SAME_BUG_NOUL_QUESTION.criteria }
        : {}),
    };
  }
  return out;
}

/** State for the batched form: one error against several candidates. */
export function buildErrorCandidatesState(
  report: ErrorReportInput,
  candidates: IssueCandidateInput[],
): { error: ErrorReportState; candidates: IssueCandidateState[] } {
  return {
    error: buildErrorReportState(report),
    candidates: candidates.map(buildIssueCandidateState),
  };
}

/** Parse `sameBug:<n>` back to the issue number, or null for a foreign key. */
export function issueNumberFromSameBugKey(key: string): number | null {
  const m = /^sameBug:(\d+)$/.exec(key);
  return m ? Number(m[1]) : null;
}
