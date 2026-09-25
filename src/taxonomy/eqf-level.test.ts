import { describe, it, expect } from 'vitest';
import {
  EQF_LEVEL_OPTIONS,
  getEqfLevelLabel,
  readEqfLevel,
  suggestEqfLevelFromDegree,
} from './eqf-level.js';

describe('EQF level taxonomy', () => {
  it('offers all eight levels in ascending order with plain-language labels', () => {
    expect(EQF_LEVEL_OPTIONS.map((o) => o.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(getEqfLevelLabel(6)).toBe('Bachelor');
    expect(getEqfLevelLabel(7)).toBe('Master');
    expect(getEqfLevelLabel(8)).toBe('Doctorate');
    for (const o of EQF_LEVEL_OPTIONS) expect(o.label).not.toMatch(/EQF|\d/);
  });

  it('returns undefined for a missing or out-of-range level', () => {
    expect(getEqfLevelLabel(undefined)).toBeUndefined();
    expect(getEqfLevelLabel(null)).toBeUndefined();
    expect(getEqfLevelLabel(9)).toBeUndefined();
  });
});

describe('readEqfLevel', () => {
  it('accepts integers 1 to 8', () => {
    expect(readEqfLevel(1)).toBe(1);
    expect(readEqfLevel(8)).toBe(8);
  });

  it('rejects anything else a record might carry', () => {
    for (const bad of [0, 9, 6.5, '6', null, undefined, {}, Number.NaN]) {
      expect(readEqfLevel(bad)).toBeUndefined();
    }
  });
});

describe('suggestEqfLevelFromDegree', () => {
  it.each([
    ['PhD', 8],
    ['Ph.D.', 8],
    ['Doctor of Philosophy', 8],
    ['Dr.', 8],
    ['doctoraat', 8],
    ['DPhil in History', 8],
    ['Doctorate in Education', 8],
    ['MSc', 7],
    ['M.Sc. Computer Science', 7],
    ['Master of Arts', 7],
    ["Master's degree", 7],
    ['MBA', 7],
    ['LLM', 7],
    ['drs.', 7],
    ['Doctoraal', 7],
    ['Doctor of Medicine', 7],
    ['Juris Doctor', 7],
    ['BSc', 6],
    ['B.A. English', 6],
    ['Bachelor of Science', 6],
    ["Bachelor's degree", 6],
    ['Associate of Arts', 5],
    ['Associate degree', 5],
    ['High school diploma', 4],
    ['VWO', 4],
    ['Abitur', 4],
  ])('suggests %s -> %i', (degree, level) => {
    expect(suggestEqfLevelFromDegree(degree)).toBe(level);
  });

  it('returns undefined when the degree does not name a level', () => {
    for (const degree of ['', '   ', 'Certificate', 'Diploma', 'Minor in Math', 'Drama']) {
      expect(suggestEqfLevelFromDegree(degree)).toBeUndefined();
    }
    expect(suggestEqfLevelFromDegree(undefined)).toBeUndefined();
    expect(suggestEqfLevelFromDegree(null)).toBeUndefined();
  });
});
