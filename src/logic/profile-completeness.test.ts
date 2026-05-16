import { describe, expect, it } from 'vitest';

import {
  COMPLETENESS_MAX_SCORE,
  completenessPercent,
  completenessScore,
  type ProfileCompletion,
} from './profile-completeness.js';

const empty: ProfileCompletion = {
  hasHeadline: false,
  hasAbout: false,
  positionCount: 0,
  educationCount: 0,
  skillCount: 0,
  certificationCount: 0,
};

describe('COMPLETENESS_MAX_SCORE', () => {
  it('is 6 (six binary signals)', () => {
    expect(COMPLETENESS_MAX_SCORE).toBe(6);
  });
});

describe('completenessScore', () => {
  it('returns 0 for empty profile', () => {
    expect(completenessScore(empty)).toBe(0);
  });

  it('returns 6 for fully filled profile', () => {
    expect(
      completenessScore({
        hasHeadline: true,
        hasAbout: true,
        positionCount: 2,
        educationCount: 1,
        skillCount: 5,
        certificationCount: 1,
      }),
    ).toBe(6);
  });

  it('treats count >= 1 as filled regardless of value', () => {
    expect(completenessScore({ ...empty, positionCount: 1 })).toBe(1);
    expect(completenessScore({ ...empty, positionCount: 99 })).toBe(1);
  });

  it('counts each of the six signals separately', () => {
    expect(completenessScore({ ...empty, hasHeadline: true })).toBe(1);
    expect(completenessScore({ ...empty, hasAbout: true })).toBe(1);
    expect(completenessScore({ ...empty, positionCount: 1 })).toBe(1);
    expect(completenessScore({ ...empty, educationCount: 1 })).toBe(1);
    expect(completenessScore({ ...empty, skillCount: 1 })).toBe(1);
    expect(completenessScore({ ...empty, certificationCount: 1 })).toBe(1);
  });
});

describe('completenessPercent', () => {
  it('returns the seven discrete percentages matching score 0..6', () => {
    expect(completenessPercent(empty)).toBe(0);
    expect(completenessPercent({ ...empty, hasHeadline: true })).toBe(17);
    expect(completenessPercent({ ...empty, hasHeadline: true, hasAbout: true })).toBe(33);
    expect(
      completenessPercent({
        ...empty,
        hasHeadline: true,
        hasAbout: true,
        positionCount: 1,
      }),
    ).toBe(50);
    expect(
      completenessPercent({
        ...empty,
        hasHeadline: true,
        hasAbout: true,
        positionCount: 1,
        educationCount: 1,
      }),
    ).toBe(67);
    expect(
      completenessPercent({
        ...empty,
        hasHeadline: true,
        hasAbout: true,
        positionCount: 1,
        educationCount: 1,
        skillCount: 1,
      }),
    ).toBe(83);
    expect(
      completenessPercent({
        hasHeadline: true,
        hasAbout: true,
        positionCount: 1,
        educationCount: 1,
        skillCount: 1,
        certificationCount: 1,
      }),
    ).toBe(100);
  });
});
