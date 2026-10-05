import { describe, expect, it } from 'vitest';

import {
  ERROR_MAX_FRAMES,
  ERROR_SAME_BUG_NOUL_QUESTION,
  ISSUE_CANDIDATE_BODY_MAX_CHARS,
  SAME_BUG_THRESHOLD,
  buildErrorCandidatesState,
  buildErrorIssuePairState,
  buildErrorReportState,
  buildIssueCandidateState,
  buildSameBugQuestions,
  isLikelySameBug,
  issueNumberFromSameBugKey,
  scrubErrorText,
} from './error.js';

describe('scrubErrorText', () => {
  it('replaces DIDs, handles, emails, at-URIs and profile paths', () => {
    const input =
      'did:plc:abc123xyz failed for @alice.bsky.social (alice@example.com) at at://did:plc:abc123xyz/id.sifa.profile.self/self via /p/alice.bsky.social?tab=x';
    const out = scrubErrorText(input);
    expect(out).not.toMatch(/did:plc/);
    expect(out).not.toMatch(/alice/);
    expect(out).toContain('<did>');
    expect(out).toContain('<handle>');
    expect(out).toContain('<email>');
    expect(out).toContain('at://<id>');
    expect(out).toContain('/p/<handle>');
  });

  it('leaves code identifiers and decorators alone', () => {
    expect(scrubErrorText('entity-resolver.ts resolveOrg @Injectable')).toBe(
      'entity-resolver.ts resolveOrg @Injectable',
    );
  });

  it('is idempotent', () => {
    const once = scrubErrorText('did:plc:abc @bob.test');
    expect(scrubErrorText(once)).toBe(once);
  });
});

describe('buildErrorReportState', () => {
  it('scrubs text fields and keeps in-app frames only, bounded', () => {
    const frames = Array.from({ length: ERROR_MAX_FRAMES + 4 }, (_, i) => ({
      filename: `src/f${i}.ts`,
      function: `fn${i}`,
      lineNo: i,
      inApp: true,
    }));
    const state = buildErrorReportState({
      title: "TypeError: Cannot read 'toLowerCase' for did:plc:abc",
      culprit: 'entity-resolver.ts in resolveOrg',
      level: 'error',
      type: 'TypeError',
      value: 'user @carol.example hit it',
      frames: [{ filename: 'node_modules/x.js', inApp: false }, ...frames],
      release: 'sifa-api@1.0.0',
    });
    expect(state.title).toContain('<did>');
    expect(state.value).toContain('<handle>');
    expect(state.frames).toHaveLength(ERROR_MAX_FRAMES);
    expect(state.frames?.[0]?.filename).toBe('src/f0.ts');
    expect(state.release).toBe('sifa-api@1.0.0');
  });

  it('falls back to all frames when none are in-app, and drops empty fields', () => {
    const state = buildErrorReportState({
      title: 't',
      frames: [{ filename: 'node_modules/x.js', inApp: false }],
    });
    expect(state.frames).toEqual([{ filename: 'node_modules/x.js' }]);
    expect('culprit' in state).toBe(false);
    expect(buildErrorReportState({ title: 't', frames: [] })).toEqual({ title: 't' });
  });
});

describe('buildIssueCandidateState / pair state', () => {
  it('truncates and scrubs the body', () => {
    const state = buildIssueCandidateState({
      number: 42,
      title: 'Profile 500 for @dave.example',
      body: 'x'.repeat(ISSUE_CANDIDATE_BODY_MAX_CHARS + 50),
    });
    expect(state.title).toBe('Profile 500 for <handle>');
    expect(state.body).toHaveLength(ISSUE_CANDIDATE_BODY_MAX_CHARS);
  });

  it('builds the pair under stable field names', () => {
    const pair = buildErrorIssuePairState({ title: 'e' }, { number: 1, title: 'i' });
    expect(pair).toEqual({ error: { title: 'e' }, issue: { number: 1, title: 'i' } });
  });
});

describe('same-bug question and threshold', () => {
  it('exposes a noul question with true/false criteria', () => {
    expect(ERROR_SAME_BUG_NOUL_QUESTION.type).toBe('noul');
    expect(ERROR_SAME_BUG_NOUL_QUESTION.criteria?.true).toBeTruthy();
    expect(ERROR_SAME_BUG_NOUL_QUESTION.criteria?.false).toBeTruthy();
  });

  it('thresholds favour precision', () => {
    expect(SAME_BUG_THRESHOLD).toBeGreaterThanOrEqual(0.8);
    expect(isLikelySameBug(SAME_BUG_THRESHOLD)).toBe(true);
    expect(isLikelySameBug(SAME_BUG_THRESHOLD - 0.01)).toBe(false);
    expect(isLikelySameBug(0.7, 0.6)).toBe(true);
  });

  it('batches one question per candidate and maps keys back', () => {
    const candidates = [
      { number: 7, title: 'a' },
      { number: 9, title: 'b' },
    ];
    const questions = buildSameBugQuestions(candidates);
    expect(Object.keys(questions)).toEqual(['sameBug:7', 'sameBug:9']);
    expect(questions['sameBug:9']?.instructions).toContain('number 9');
    expect(questions['sameBug:9']?.criteria).toEqual(ERROR_SAME_BUG_NOUL_QUESTION.criteria);
    expect(issueNumberFromSameBugKey('sameBug:9')).toBe(9);
    expect(issueNumberFromSameBugKey('issueType')).toBeNull();

    const state = buildErrorCandidatesState({ title: 'e' }, candidates);
    expect(state.candidates.map((c) => c.number)).toEqual([7, 9]);
  });
});
