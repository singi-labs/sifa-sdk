import { describe, expect, it } from 'vitest';

import {
  ISSUE_BODY_MAX_CHARS,
  ISSUE_NEEDS_INFO_MAX_ACTIONABLE,
  ISSUE_ROUTING_THRESHOLD,
  ISSUE_STREAM_LABELS,
  ISSUE_STREAM_TAXONOMY,
  ISSUE_TRIAGE_QUESTION_IDS,
  ISSUE_TYPE_CONFIDENCE_FLOOR,
  ISSUE_TYPE_TAXONOMY,
  buildIssueTriageQuestions,
  buildIssueTriageState,
  issueLabelsFromAnswers,
  issueTriageAnswersSchema,
  type IssueTriageAnswers,
} from './issue.js';

function choice(choiceKey: string, confidence: number) {
  return {
    type: 'choice' as const,
    choice: choiceKey,
    confidence,
    probabilities: { [choiceKey]: confidence, unclear: 1 - confidence },
  };
}

function noul(p: number) {
  return { type: 'noul' as const, noul: p };
}

function answers(overrides: Partial<IssueTriageAnswers> = {}): IssueTriageAnswers {
  return {
    issueType: choice('bug', 0.9),
    issueStream: choice('sifa', 0.9),
    issueActionable: noul(0.9),
    issueSecurity: noul(0.05),
    issueRegression: noul(0.05),
    ...overrides,
  };
}

describe('issue triage state', () => {
  it('keeps repo, trimmed title, body, and existing labels', () => {
    const state = buildIssueTriageState({
      repo: 'singi-labs/sifa-api',
      title: '  Profile 500s  ',
      body: 'Steps: open /p/x',
      existingLabels: ['glitchtip'],
    });
    expect(state).toEqual({
      repo: 'singi-labs/sifa-api',
      title: 'Profile 500s',
      body: 'Steps: open /p/x',
      existingLabels: ['glitchtip'],
    });
  });

  it('drops a blank body and an empty label list', () => {
    const state = buildIssueTriageState({
      repo: 'r',
      title: 't',
      body: '   ',
      existingLabels: [],
    });
    expect(state).toEqual({ repo: 'r', title: 't' });
  });

  it('truncates a long body and flags it', () => {
    const state = buildIssueTriageState({
      repo: 'r',
      title: 't',
      body: 'x'.repeat(ISSUE_BODY_MAX_CHARS + 10),
    });
    expect(state.body).toHaveLength(ISSUE_BODY_MAX_CHARS);
    expect(state.bodyTruncated).toBe(true);
  });
});

describe('issue triage questions', () => {
  it('batches one question per id', () => {
    const questions = buildIssueTriageQuestions();
    expect(Object.keys(questions).sort()).toEqual(Object.values(ISSUE_TRIAGE_QUESTION_IDS).sort());
  });

  it('type and stream taxonomies carry a no-match option and real label keys', () => {
    expect(ISSUE_TYPE_TAXONOMY).toHaveProperty('unclear');
    expect(ISSUE_STREAM_TAXONOMY).toHaveProperty('unclear');
    expect(Object.keys(ISSUE_TYPE_TAXONOMY).sort()).toEqual(
      ['bug', 'documentation', 'feature', 'question', 'spam', 'tech-debt', 'unclear'].sort(),
    );
    expect(ISSUE_STREAM_LABELS.kootana).toBe('stream:kootana');
    expect(ISSUE_STREAM_LABELS.sifa).toBeNull();
  });
});

describe('issueLabelsFromAnswers', () => {
  it('parses a full answer set with the schema', () => {
    expect(() => issueTriageAnswersSchema.parse(answers())).not.toThrow();
  });

  it('applies the type label when confidence clears the floor', () => {
    const out = issueLabelsFromAnswers(answers());
    expect(out.labels).toEqual(['bug']);
    expect(out.type).toBe('bug');
    expect(out.needsInfo).toBe(false);
  });

  it('leaves the type unset below the floor', () => {
    const out = issueLabelsFromAnswers(
      answers({ issueType: choice('bug', ISSUE_TYPE_CONFIDENCE_FLOOR - 0.05) }),
    );
    expect(out.type).toBeNull();
    expect(out.labels).toEqual([]);
  });

  it('treats unclear and an invented key as unset', () => {
    expect(issueLabelsFromAnswers(answers({ issueType: choice('unclear', 0.95) })).type).toBeNull();
    expect(
      issueLabelsFromAnswers(answers({ issueType: choice('enhancement', 0.95) })).type,
    ).toBeNull();
  });

  it('spam short-circuits to a single label', () => {
    const out = issueLabelsFromAnswers(
      answers({
        issueType: choice('spam', 0.95),
        issueSecurity: noul(0.99),
        issueActionable: noul(0.0),
      }),
    );
    expect(out.labels).toEqual(['spam']);
    expect(out.security).toBe(false);
    expect(out.needsInfo).toBe(false);
  });

  it('adds routing labels only on a confident yes', () => {
    const yes = issueLabelsFromAnswers(
      answers({
        issueSecurity: noul(ISSUE_ROUTING_THRESHOLD),
        issueRegression: noul(ISSUE_ROUTING_THRESHOLD + 0.1),
      }),
    );
    expect(yes.labels).toEqual(['bug', 'security', 'regression']);

    const no = issueLabelsFromAnswers(
      answers({ issueSecurity: noul(ISSUE_ROUTING_THRESHOLD - 0.01) }),
    );
    expect(no.security).toBe(false);
    expect(no.labels).toEqual(['bug']);
  });

  it('maps the kootana stream to its label and the sifa stream to none', () => {
    expect(issueLabelsFromAnswers(answers({ issueStream: choice('kootana', 0.9) })).labels).toEqual(
      ['bug', 'stream:kootana'],
    );
    expect(issueLabelsFromAnswers(answers({ issueStream: choice('sifa', 0.9) })).labels).toEqual([
      'bug',
    ]);
    expect(
      issueLabelsFromAnswers(answers({ issueStream: choice('kootana', 0.5) })).stream,
    ).toBeNull();
  });

  it('adds needs-info when the issue is unlikely actionable', () => {
    const out = issueLabelsFromAnswers(
      answers({ issueActionable: noul(ISSUE_NEEDS_INFO_MAX_ACTIONABLE - 0.1) }),
    );
    expect(out.needsInfo).toBe(true);
    expect(out.labels).toEqual(['bug', 'needs-info']);
  });

  it('honours threshold overrides', () => {
    const out = issueLabelsFromAnswers(answers({ issueSecurity: noul(0.6) }), {
      routingThreshold: 0.5,
    });
    expect(out.security).toBe(true);
  });
});
