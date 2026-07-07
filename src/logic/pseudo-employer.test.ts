import { describe, expect, it } from 'vitest';
import { isPseudoEmployer } from './pseudo-employer.js';

describe('isPseudoEmployer', () => {
  it('matches self-employment strings and variants', () => {
    for (const s of [
      'Self-employed',
      'self employed',
      'Freelance',
      'Freelancer',
      'Independent',
      'Independent Contractor',
      'Sole proprietor',
      'Self',
    ]) {
      expect(isPseudoEmployer(s), s).toBe(true);
    }
  });

  it('does not match real employers that merely contain the word', () => {
    for (const s of [
      'Spryker Systems',
      'Independent School District 191',
      'Freelance Media Group Ltd',
    ]) {
      expect(isPseudoEmployer(s), s).toBe(false);
    }
  });

  it('handles empty input', () => {
    expect(isPseudoEmployer('')).toBe(false);
    expect(isPseudoEmployer('   ')).toBe(false);
  });
});
