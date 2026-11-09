import { describe, expect, it } from 'vitest';

import { HONOR_KIND_OPTIONS, getHonorKindLabel } from './index.js';

describe('honor kind taxonomy', () => {
  it('mirrors the five id.sifa.defs honor tokens in order', () => {
    expect(HONOR_KIND_OPTIONS.map((o) => o.value)).toEqual([
      'id.sifa.defs#honorAward',
      'id.sifa.defs#honorNomination',
      'id.sifa.defs#honorChampionship',
      'id.sifa.defs#honorRecord',
      'id.sifa.defs#honorRecognition',
    ]);
  });

  it('labels known tokens', () => {
    expect(getHonorKindLabel('id.sifa.defs#honorNomination')).toBe('Nomination');
  });

  it('returns undefined for absent or unknown tokens so nothing is guessed', () => {
    expect(getHonorKindLabel(undefined)).toBeUndefined();
    expect(getHonorKindLabel('')).toBeUndefined();
    expect(getHonorKindLabel('com.example.defs#honorScholarship')).toBeUndefined();
  });
});
