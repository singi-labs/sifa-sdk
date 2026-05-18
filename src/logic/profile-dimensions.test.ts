import { describe, expect, it } from 'vitest';

import {
  countFilledDimensions,
  DIMENSIONS_MAX_SCORE,
  dimensionsFromInputs,
  getFilledDimensionsMap,
  MIN_SKILLS,
  profileToDimensionInputs,
  type ProfileDimensionInputs,
} from './profile-dimensions.js';
import type { Profile } from '../types/index.js';

const emptyInputs: ProfileDimensionInputs = {
  hasAvatar: false,
  hasHeadline: false,
  hasAbout: false,
  currentPositionCount: 0,
  skillCount: 0,
  educationCount: 0,
};

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    did: 'did:plc:test',
    handle: 'test.example',
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    positions: [],
    education: [],
    skills: [],
    externalAccounts: [],
    claimed: true,
    ...overrides,
  };
}

describe('constants', () => {
  it('DIMENSIONS_MAX_SCORE is 6', () => {
    expect(DIMENSIONS_MAX_SCORE).toBe(6);
  });
  it('MIN_SKILLS is 3', () => {
    expect(MIN_SKILLS).toBe(3);
  });
});

describe('dimensionsFromInputs', () => {
  it('returns all-false for empty inputs', () => {
    expect(dimensionsFromInputs(emptyInputs)).toEqual({
      avatar: false,
      headline: false,
      about: false,
      currentPosition: false,
      skills: false,
      education: false,
    });
  });

  it('returns all-true when every dimension is met', () => {
    expect(
      dimensionsFromInputs({
        hasAvatar: true,
        hasHeadline: true,
        hasAbout: true,
        currentPositionCount: 1,
        skillCount: MIN_SKILLS,
        educationCount: 1,
      }),
    ).toEqual({
      avatar: true,
      headline: true,
      about: true,
      currentPosition: true,
      skills: true,
      education: true,
    });
  });

  it('skills below MIN_SKILLS does not count', () => {
    expect(dimensionsFromInputs({ ...emptyInputs, skillCount: MIN_SKILLS - 1 }).skills).toBe(false);
  });

  it('skills at MIN_SKILLS counts', () => {
    expect(dimensionsFromInputs({ ...emptyInputs, skillCount: MIN_SKILLS }).skills).toBe(true);
  });

  it('currentPosition is true when at least one current position exists', () => {
    expect(dimensionsFromInputs({ ...emptyInputs, currentPositionCount: 1 }).currentPosition).toBe(
      true,
    );
  });

  it('education is true when at least one entry exists', () => {
    expect(dimensionsFromInputs({ ...emptyInputs, educationCount: 1 }).education).toBe(true);
  });
});

describe('profileToDimensionInputs', () => {
  it('extracts inputs from a full profile', () => {
    const profile = makeProfile({
      avatar: 'https://example.com/a.png',
      headline: 'Senior engineer',
      about: 'Bio',
      positions: [
        { rkey: 'p1', title: 'Eng', company: 'A', startedAt: '2024-01-01' },
        {
          rkey: 'p0',
          title: 'Junior',
          company: 'B',
          startedAt: '2020-01-01',
          endedAt: '2022-01-01',
        },
      ] as Profile['positions'],
      skills: [
        { rkey: 's1', name: 'TypeScript' },
        { rkey: 's2', name: 'Postgres' },
        { rkey: 's3', name: 'React' },
      ] as Profile['skills'],
      education: [{ rkey: 'e1', institution: 'TU' }] as Profile['education'],
    });
    expect(profileToDimensionInputs(profile)).toEqual({
      hasAvatar: true,
      hasHeadline: true,
      hasAbout: true,
      currentPositionCount: 1,
      skillCount: 3,
      educationCount: 1,
    });
  });

  it('treats whitespace-only strings as not filled', () => {
    const profile = makeProfile({ avatar: '   ', headline: '\t', about: '' });
    const inputs = profileToDimensionInputs(profile);
    expect(inputs.hasAvatar).toBe(false);
    expect(inputs.hasHeadline).toBe(false);
    expect(inputs.hasAbout).toBe(false);
  });

  it('treats nullish optional fields as not filled', () => {
    const profile = makeProfile();
    const inputs = profileToDimensionInputs(profile);
    expect(inputs.hasAvatar).toBe(false);
    expect(inputs.hasHeadline).toBe(false);
    expect(inputs.hasAbout).toBe(false);
    expect(inputs.currentPositionCount).toBe(0);
  });
});

describe('countFilledDimensions', () => {
  it('returns 0 for empty inputs', () => {
    expect(countFilledDimensions(emptyInputs)).toBe(0);
  });

  it('returns 6 when everything filled', () => {
    expect(
      countFilledDimensions({
        hasAvatar: true,
        hasHeadline: true,
        hasAbout: true,
        currentPositionCount: 2,
        skillCount: 10,
        educationCount: 1,
      }),
    ).toBe(6);
  });

  it('accepts a full Profile too', () => {
    const profile = makeProfile({
      avatar: 'https://example.com/a.png',
      headline: 'h',
      about: 'a',
      positions: [
        { rkey: 'p1', title: 'Eng', company: 'A', startedAt: '2024-01-01' },
      ] as Profile['positions'],
      skills: [
        { rkey: 's1', name: 'TypeScript' },
        { rkey: 's2', name: 'Postgres' },
        { rkey: 's3', name: 'React' },
      ] as Profile['skills'],
      education: [{ rkey: 'e1', institution: 'TU' }] as Profile['education'],
    });
    expect(countFilledDimensions(profile)).toBe(6);
  });
});

describe('getFilledDimensionsMap', () => {
  it('matches dimensionsFromInputs(profileToDimensionInputs(profile))', () => {
    const profile = makeProfile({
      headline: 'h',
      positions: [
        { rkey: 'p1', title: 'Eng', company: 'A', startedAt: '2024-01-01' },
      ] as Profile['positions'],
    });
    expect(getFilledDimensionsMap(profile)).toEqual(
      dimensionsFromInputs(profileToDimensionInputs(profile)),
    );
  });
});
