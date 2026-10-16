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
  SECTOR_ORG_TYPE_INDUSTRY_HINTS,
  isInferredOrgTypePlausible,
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

  it('org-type taxonomy has the expected key set (locks additions/removals)', () => {
    expect(Object.keys(ORG_TYPE_TAXONOMY).sort()).toEqual(
      [
        'agency',
        'company',
        'cooperative',
        'educational',
        'foundation',
        'government',
        'healthcare_provider',
        'nonprofit',
        'other',
        'political',
        'professional_association',
        'religious',
        'research_institute',
        'self_employed',
      ].sort(),
    );
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

  it('builds state from identity signal when there is no description', () => {
    const state = buildFirmographicState({
      name: 'Haryana Agricultural University',
      domain: 'hau.ernet.in',
      country: 'IN',
      links: ['wikipedia'],
    });
    expect(state.name).toContain('Agricultural');
    expect(state.domain).toBe('hau.ernet.in');
    expect(state.country).toBe('IN');
    expect(state.links).toEqual(['wikipedia']);
    // No enrichmentText passed -> absent, not null/empty.
    expect('enrichmentText' in state).toBe(false);
  });

  it('drops empty arrays and blank fields from the state', () => {
    const state = buildFirmographicState({ name: 'Acme', links: [], country: '' });
    expect('links' in state).toBe(false);
    expect('country' in state).toBe(false);
    expect(state).toEqual({ name: 'Acme' });
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

describe('isInferredOrgTypePlausible', () => {
  const described = { hasDescription: true };

  it('rejects a sector-bound type that contradicts the industry (scrive.com, gwi.com)', () => {
    expect(
      isInferredOrgTypePlausible('healthcare_provider', {
        ...described,
        industry: 'computer software',
      }),
    ).toBe(false);
    expect(
      isInferredOrgTypePlausible('healthcare_provider', {
        hasDescription: false,
        industry: 'market research',
      }),
    ).toBe(false);
  });

  it('accepts a sector-bound type whose industry matches', () => {
    expect(
      isInferredOrgTypePlausible('healthcare_provider', { ...described, industry: 'healthcare' }),
    ).toBe(true);
    expect(
      isInferredOrgTypePlausible('healthcare_provider', {
        ...described,
        industry: 'Hospital & Health Care',
      }),
    ).toBe(true);
    expect(
      isInferredOrgTypePlausible('educational', { ...described, industry: 'higher education' }),
    ).toBe(true);
    expect(
      isInferredOrgTypePlausible('government', { ...described, industry: 'public_sector' }),
    ).toBe(true);
  });

  it('rejects a sector-bound type when the org has no description', () => {
    expect(
      isInferredOrgTypePlausible('healthcare_provider', {
        hasDescription: false,
        industry: 'healthcare',
      }),
    ).toBe(false);
  });

  it('rejects a sector-bound type when the industry is unknown', () => {
    expect(isInferredOrgTypePlausible('educational', { ...described, industry: null })).toBe(false);
  });

  it('accepts form types regardless of industry or description', () => {
    for (const t of ['company', 'nonprofit', 'cooperative', 'foundation', 'agency']) {
      expect(isInferredOrgTypePlausible(t, { hasDescription: false, industry: null })).toBe(true);
    }
  });

  it('rejects the no-match option and unknown tokens', () => {
    expect(isInferredOrgTypePlausible('other', described)).toBe(false);
    expect(isInferredOrgTypePlausible('spaceship', described)).toBe(false);
  });

  it('only lists taxonomy keys as sector-bound types', () => {
    for (const key of Object.keys(SECTOR_ORG_TYPE_INDUSTRY_HINTS)) {
      expect(ORG_TYPE_TAXONOMY).toHaveProperty(key);
    }
  });
});
