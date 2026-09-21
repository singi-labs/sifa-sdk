import { describe, expect, it } from 'vitest';

import {
  INDUSTRY_TAXONOMY,
  ORG_TYPE_TAXONOMY,
  SIZE_BAND_TAXONOMY,
  ORG_PAIR_NOUL_QUESTION,
  INDUSTRY_CHOICE_QUESTION,
  ORG_TYPE_CHOICE_QUESTION,
  SIZE_BAND_CHOICE_QUESTION,
  SAME_ORG_THRESHOLD,
  FIRMOGRAPHIC_CONFIDENCE_FLOOR,
  buildOrgPairState,
  buildFirmographicState,
  isLikelySameOrg,
  pickChoiceAboveFloor,
  noulAnswerSchema,
  choiceAnswerSchema,
} from './index.js';

describe('jev result schemas', () => {
  it('parses a valid noul answer', () => {
    const parsed = noulAnswerSchema.parse({ type: 'noul', noul: 0.92 });
    expect(parsed.noul).toBe(0.92);
  });

  it('rejects a noul probability out of range', () => {
    expect(() => noulAnswerSchema.parse({ type: 'noul', noul: 1.5 })).toThrow();
    expect(() => noulAnswerSchema.parse({ type: 'noul', noul: -0.1 })).toThrow();
  });

  it('rejects a noul answer missing the probability', () => {
    expect(() => noulAnswerSchema.parse({ type: 'noul' })).toThrow();
  });

  it('parses a valid choice answer', () => {
    const parsed = choiceAnswerSchema.parse({
      type: 'choice',
      choice: 'technology',
      confidence: 0.8,
      probabilities: { technology: 0.8, other: 0.2 },
    });
    expect(parsed.choice).toBe('technology');
    expect(parsed.confidence).toBe(0.8);
  });

  it('rejects a choice answer with confidence out of range', () => {
    expect(() =>
      choiceAnswerSchema.parse({
        type: 'choice',
        choice: 'x',
        confidence: 2,
        probabilities: { x: 1 },
      }),
    ).toThrow();
  });
});

describe('org-pair dedup (Noul)', () => {
  it('exposes a static noul question with true/false criteria', () => {
    expect(ORG_PAIR_NOUL_QUESTION.type).toBe('noul');
    expect(ORG_PAIR_NOUL_QUESTION.criteria?.true).toBeTruthy();
    expect(ORG_PAIR_NOUL_QUESTION.criteria?.false).toBeTruthy();
  });

  it('builds state with both records under stable named fields', () => {
    const state = buildOrgPairState(
      { name: 'Acme Inc', domain: 'acme.com', location: 'Berlin', description: 'Widgets' },
      { name: 'Acme Corporation', domain: 'acme.com' },
    );
    expect(state.orgA.name).toBe('Acme Inc');
    expect(state.orgB.name).toBe('Acme Corporation');
    // undefined optional fields are dropped, not serialised as the string "undefined"
    expect('location' in state.orgB).toBe(false);
  });

  it('thresholds on the noul probability, favouring precision', () => {
    expect(SAME_ORG_THRESHOLD).toBeGreaterThanOrEqual(0.5);
    expect(isLikelySameOrg(SAME_ORG_THRESHOLD + 0.01)).toBe(true);
    expect(isLikelySameOrg(SAME_ORG_THRESHOLD - 0.01)).toBe(false);
    expect(isLikelySameOrg(0.99)).toBe(true);
    expect(isLikelySameOrg(0.5)).toBe(false);
  });

  it('accepts an explicit threshold override', () => {
    expect(isLikelySameOrg(0.7, 0.6)).toBe(true);
    expect(isLikelySameOrg(0.7, 0.8)).toBe(false);
  });
});

describe('firmographic classification (Choice)', () => {
  it('each taxonomy includes a no-match / unknown option', () => {
    expect(INDUSTRY_TAXONOMY).toHaveProperty('other');
    expect(ORG_TYPE_TAXONOMY).toHaveProperty('other');
    expect(SIZE_BAND_TAXONOMY).toHaveProperty('unknown');
  });

  it('choice questions carry their taxonomy as criteria', () => {
    expect(INDUSTRY_CHOICE_QUESTION.type).toBe('choice');
    expect(Object.keys(INDUSTRY_CHOICE_QUESTION.criteria)).toEqual(Object.keys(INDUSTRY_TAXONOMY));
    expect(ORG_TYPE_CHOICE_QUESTION.criteria).toEqual(ORG_TYPE_TAXONOMY);
    expect(SIZE_BAND_CHOICE_QUESTION.criteria).toEqual(SIZE_BAND_TAXONOMY);
  });

  it('builds firmographic state from enrichment text plus identity', () => {
    const state = buildFirmographicState({
      name: 'Acme',
      domain: 'acme.com',
      enrichmentText: 'Acme builds industrial widgets. 400 employees.',
    });
    expect(state.name).toBe('Acme');
    expect(state.enrichmentText).toContain('widgets');
  });

  it('returns the choice when confidence clears the floor', () => {
    const answer = {
      type: 'choice' as const,
      choice: 'technology',
      confidence: FIRMOGRAPHIC_CONFIDENCE_FLOOR + 0.05,
      probabilities: { technology: 0.9, other: 0.1 },
    };
    expect(pickChoiceAboveFloor(answer)).toBe('technology');
  });

  it('leaves the field unset (null) when below the confidence floor', () => {
    const answer = {
      type: 'choice' as const,
      choice: 'technology',
      confidence: FIRMOGRAPHIC_CONFIDENCE_FLOOR - 0.05,
      probabilities: { technology: 0.4, other: 0.35, finance: 0.25 },
    };
    expect(pickChoiceAboveFloor(answer)).toBeNull();
  });

  it('treats a no-match selection as unset even above the floor', () => {
    const answer = {
      type: 'choice' as const,
      choice: 'other',
      confidence: 0.95,
      probabilities: { other: 0.95, technology: 0.05 },
    };
    expect(pickChoiceAboveFloor(answer, { noMatch: 'other' })).toBeNull();
  });
});
