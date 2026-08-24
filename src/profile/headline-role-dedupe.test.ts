import { describe, it, expect } from 'vitest';
import { isRoleLineRedundant } from './headline-role-dedupe.js';

describe('isRoleLineRedundant', () => {
  it('flags an exact match between headline and role line', () => {
    expect(
      isRoleLineRedundant(
        'Founder and Director at Hypercerts Foundation',
        'Founder and Director at Hypercerts Foundation',
      ),
    ).toBe(true);
  });

  it('ignores case and surrounding/internal whitespace', () => {
    expect(
      isRoleLineRedundant(
        '  Founder and Director   at Hypercerts Foundation ',
        'founder and director at hypercerts foundation',
      ),
    ).toBe(true);
  });

  it('ignores trailing punctuation on the headline', () => {
    expect(
      isRoleLineRedundant(
        'Founder and Director at Hypercerts Foundation.',
        'Founder and Director at Hypercerts Foundation',
      ),
    ).toBe(true);
  });

  it('keeps the role line when the headline adds information', () => {
    expect(
      isRoleLineRedundant(
        'Founder and Director at Hypercerts Foundation · Building public goods',
        'Founder and Director at Hypercerts Foundation',
      ),
    ).toBe(false);
  });

  it('keeps the role line when headline and role line differ', () => {
    expect(
      isRoleLineRedundant('Political economist', 'Founder and Director at Hypercerts Foundation'),
    ).toBe(false);
  });

  it('is not redundant when the headline is missing', () => {
    expect(isRoleLineRedundant(undefined, 'Founder and Director at Hypercerts Foundation')).toBe(
      false,
    );
    expect(isRoleLineRedundant('', 'Founder and Director at Hypercerts Foundation')).toBe(false);
  });

  it('is not redundant when the role line is missing', () => {
    expect(isRoleLineRedundant('Founder and Director at Hypercerts Foundation', undefined)).toBe(
      false,
    );
    expect(isRoleLineRedundant('Founder and Director at Hypercerts Foundation', null)).toBe(false);
  });
});
