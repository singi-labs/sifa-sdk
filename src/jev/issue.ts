/**
 * Issue-triage judgments for the background-agent chores (sifa-workspace
 * decision 2026-10-05, background agents tier policy). Pure builders: the
 * typed questions to ask Jev about a GitHub issue, the label taxonomies, and
 * the thresholds that turn answers into label suggestions. No network, no key.
 *
 * Scope is deliberately T0 (read-only): the output is a list of label
 * suggestions a workflow may apply from an allowlist, never a code change.
 * Jev only sees public issue text. Exact signals (GlitchTip links, template
 * fields present) stay in code, not in a judgment.
 */

import { z } from 'zod';

import {
  choiceAnswerSchema,
  noulAnswerSchema,
  pickChoiceAboveFloor,
  type ChoiceAnswer,
  type ChoiceQuestion,
  type NoulAnswer,
  type NoulQuestion,
} from './index.js';

// ---------------------------------------------------------------------------
// Input and state
// ---------------------------------------------------------------------------

/** Public, non-user fields of a GitHub issue that the judgment may see. */
export interface IssueInput {
  repo: string;
  title: string;
  body?: string;
  /** Labels already on the issue (e.g. set by a template). */
  existingLabels?: string[];
}

/** Longest issue body forwarded to Jev; keeps state bounded and cheap. */
export const ISSUE_BODY_MAX_CHARS = 6000;

export interface IssueTriageState {
  repo: string;
  title: string;
  body?: string;
  bodyTruncated?: true;
  existingLabels?: string[];
}

/** State for the issue questions. Absent and blank fields are dropped. */
export function buildIssueTriageState(issue: IssueInput): IssueTriageState {
  const state: IssueTriageState = { repo: issue.repo, title: issue.title.trim() };
  const body = issue.body?.trim();
  if (body) {
    if (body.length > ISSUE_BODY_MAX_CHARS) {
      state.body = body.slice(0, ISSUE_BODY_MAX_CHARS);
      state.bodyTruncated = true;
    } else {
      state.body = body;
    }
  }
  if (issue.existingLabels && issue.existingLabels.length > 0) {
    state.existingLabels = issue.existingLabels;
  }
  return state;
}

// ---------------------------------------------------------------------------
// Taxonomies (keys double as label names where a label exists)
// ---------------------------------------------------------------------------

/** One type label per issue. `unclear` is the no-match option and never a label. */
export const ISSUE_TYPE_TAXONOMY: Record<string, string> = {
  bug: 'Something that exists does not behave as documented or expected (error, crash, wrong output)',
  feature: 'A request for new behaviour or capability that does not exist yet',
  question: 'A question about how something works, with nothing to build or fix',
  documentation: 'Docs, README, comments, or examples are missing, wrong, or unclear',
  'tech-debt':
    'Internal refactor, cleanup, dependency, or tooling work with no user-visible change',
  spam: 'Spam, gibberish, advertising, or a test submission',
  unclear: 'Not enough information to decide the type',
};

/** Which product stream an issue belongs to. `unclear` is the no-match option. */
export const ISSUE_STREAM_TAXONOMY: Record<string, string> = {
  sifa: 'The Sifa profile, activity stream, ingestion, search, or web app',
  kootana: 'Kootana: events, meetings, in-person connect, QR scan, organizer tools',
  unclear: 'Cannot tell from the issue',
};

/** Label applied for the Kootana stream; the Sifa stream carries no label. */
export const ISSUE_STREAM_LABELS: Readonly<Record<string, string | null>> = {
  sifa: null,
  kootana: 'stream:kootana',
  unclear: null,
};

// ---------------------------------------------------------------------------
// Questions (asked together over one issue state)
// ---------------------------------------------------------------------------

function choiceQuestion(instructions: string, criteria: Record<string, string>): ChoiceQuestion {
  return { type: 'choice', instructions, criteria };
}

export const ISSUE_TYPE_CHOICE_QUESTION = choiceQuestion(
  'The state holds one GitHub issue (repo, title, body, existing labels). Which single type best describes it?',
  ISSUE_TYPE_TAXONOMY,
);

export const ISSUE_STREAM_CHOICE_QUESTION = choiceQuestion(
  'Which product stream does this issue concern?',
  ISSUE_STREAM_TAXONOMY,
);

export const ISSUE_ACTIONABLE_NOUL_QUESTION: NoulQuestion = {
  type: 'noul',
  instructions:
    'Does the issue contain enough information for a maintainer to act on it without asking the reporter anything?',
  criteria: {
    true: 'For a bug: steps or a trigger, expected vs actual, and an error or location. For a feature: the problem, the desired outcome, and rough scope.',
    false:
      'Essential details are missing: no way to reproduce, no expected behaviour, vague wish with no outcome, or a bare title.',
  },
};

export const ISSUE_SECURITY_NOUL_QUESTION: NoulQuestion = {
  type: 'noul',
  instructions: 'Does the issue describe a security-relevant problem?',
  criteria: {
    true: 'A vulnerability, auth or session flaw, data exposure, abuse or spam vector, secrets handling, or a dependency advisory.',
    false: 'An ordinary bug, feature, question, or docs issue with no security angle.',
  },
};

export const ISSUE_REGRESSION_NOUL_QUESTION: NoulQuestion = {
  type: 'noul',
  instructions: 'Does the issue report that something which previously worked no longer works?',
  criteria: {
    true: 'The reporter states or clearly implies the behaviour worked before a release, deploy, or change.',
    false: 'A new bug with no prior-working claim, a feature request, or a question.',
  },
};

/** Stable question ids; the answer keys Jev returns. */
export const ISSUE_TRIAGE_QUESTION_IDS = {
  type: 'issueType',
  stream: 'issueStream',
  actionable: 'issueActionable',
  security: 'issueSecurity',
  regression: 'issueRegression',
} as const;

/** All issue questions, keyed by {@link ISSUE_TRIAGE_QUESTION_IDS}, for one batched call. */
export function buildIssueTriageQuestions(): Record<string, ChoiceQuestion | NoulQuestion> {
  return {
    [ISSUE_TRIAGE_QUESTION_IDS.type]: ISSUE_TYPE_CHOICE_QUESTION,
    [ISSUE_TRIAGE_QUESTION_IDS.stream]: ISSUE_STREAM_CHOICE_QUESTION,
    [ISSUE_TRIAGE_QUESTION_IDS.actionable]: ISSUE_ACTIONABLE_NOUL_QUESTION,
    [ISSUE_TRIAGE_QUESTION_IDS.security]: ISSUE_SECURITY_NOUL_QUESTION,
    [ISSUE_TRIAGE_QUESTION_IDS.regression]: ISSUE_REGRESSION_NOUL_QUESTION,
  };
}

// ---------------------------------------------------------------------------
// Answers -> label suggestions
// ---------------------------------------------------------------------------

/** Parsed answers for the batched issue call. */
export const issueTriageAnswersSchema = z.object({
  [ISSUE_TRIAGE_QUESTION_IDS.type]: choiceAnswerSchema,
  [ISSUE_TRIAGE_QUESTION_IDS.stream]: choiceAnswerSchema,
  [ISSUE_TRIAGE_QUESTION_IDS.actionable]: noulAnswerSchema,
  [ISSUE_TRIAGE_QUESTION_IDS.security]: noulAnswerSchema,
  [ISSUE_TRIAGE_QUESTION_IDS.regression]: noulAnswerSchema,
});
export type IssueTriageAnswers = z.infer<typeof issueTriageAnswersSchema>;

/**
 * Thresholds. Precision over recall: a wrong label costs a maintainer a click
 * and trains distrust; a missing label costs nothing. Validate on labelled
 * closed issues (sifa-api#1555) before widening.
 */
export const ISSUE_TYPE_CONFIDENCE_FLOOR = 0.6;
export const ISSUE_STREAM_CONFIDENCE_FLOOR = 0.7;
/** Below this P(actionable) the issue gets `needs-info`. */
export const ISSUE_NEEDS_INFO_MAX_ACTIONABLE = 0.35;
/** Routing labels (security, regression) need a confident yes. */
export const ISSUE_ROUTING_THRESHOLD = 0.85;

export interface IssueLabelSuggestions {
  /** Labels to apply, in a stable order, each guaranteed to be a real label name. */
  labels: string[];
  /** The type choice after the floor, or null when unset. */
  type: string | null;
  /** The stream choice after the floor, or null when unset. */
  stream: string | null;
  needsInfo: boolean;
  security: boolean;
  regression: boolean;
}

export interface IssueLabelOptions {
  typeFloor?: number;
  streamFloor?: number;
  needsInfoMaxActionable?: number;
  routingThreshold?: number;
}

function clearsNoul(answer: NoulAnswer, threshold: number): boolean {
  return answer.noul >= threshold;
}

function pickType(answer: ChoiceAnswer, floor: number): string | null {
  const choice = pickChoiceAboveFloor(answer, { floor, noMatch: 'unclear' });
  return choice !== null && choice in ISSUE_TYPE_TAXONOMY ? choice : null;
}

function pickStream(answer: ChoiceAnswer, floor: number): string | null {
  const choice = pickChoiceAboveFloor(answer, { floor, noMatch: 'unclear' });
  return choice !== null && choice in ISSUE_STREAM_TAXONOMY ? choice : null;
}

/**
 * Turn validated answers into label suggestions. Spam short-circuits: a spam
 * issue gets only `spam`, no routing or needs-info. A choice outside the
 * taxonomy (Jev invented a key) is treated as unset.
 */
export function issueLabelsFromAnswers(
  answers: IssueTriageAnswers,
  opts: IssueLabelOptions = {},
): IssueLabelSuggestions {
  const typeFloor = opts.typeFloor ?? ISSUE_TYPE_CONFIDENCE_FLOOR;
  const streamFloor = opts.streamFloor ?? ISSUE_STREAM_CONFIDENCE_FLOOR;
  const needsInfoMax = opts.needsInfoMaxActionable ?? ISSUE_NEEDS_INFO_MAX_ACTIONABLE;
  const routing = opts.routingThreshold ?? ISSUE_ROUTING_THRESHOLD;

  const type = pickType(answers[ISSUE_TRIAGE_QUESTION_IDS.type], typeFloor);
  if (type === 'spam') {
    return {
      labels: ['spam'],
      type,
      stream: null,
      needsInfo: false,
      security: false,
      regression: false,
    };
  }

  const stream = pickStream(answers[ISSUE_TRIAGE_QUESTION_IDS.stream], streamFloor);
  const needsInfo = answers[ISSUE_TRIAGE_QUESTION_IDS.actionable].noul < needsInfoMax;
  const security = clearsNoul(answers[ISSUE_TRIAGE_QUESTION_IDS.security], routing);
  const regression = clearsNoul(answers[ISSUE_TRIAGE_QUESTION_IDS.regression], routing);

  const labels: string[] = [];
  if (type !== null) labels.push(type);
  if (security) labels.push('security');
  if (regression) labels.push('regression');
  const streamLabel = stream !== null ? ISSUE_STREAM_LABELS[stream] : null;
  if (streamLabel) labels.push(streamLabel);
  if (needsInfo) labels.push('needs-info');

  return { labels, type, stream, needsInfo, security, regression };
}
