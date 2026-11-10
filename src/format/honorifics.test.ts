import { describe, expect, it } from 'vitest';

import { formatNameWithHonorifics } from './pds-utils.js';

describe('formatNameWithHonorifics', () => {
  it('puts the prefix before and the suffix after, comma-separated', () => {
    expect(formatNameWithHonorifics('Jane Doe', 'Dr.', 'PhD')).toBe('Dr. Jane Doe, PhD');
  });

  it('handles only one honorific', () => {
    expect(formatNameWithHonorifics('Jane Doe', 'Prof.', undefined)).toBe('Prof. Jane Doe');
    expect(formatNameWithHonorifics('Jane Doe', undefined, 'OBE')).toBe('Jane Doe, OBE');
  });

  it('trims and ignores blank honorifics', () => {
    expect(formatNameWithHonorifics('Jane Doe', '  ', ' PhD ')).toBe('Jane Doe, PhD');
    expect(formatNameWithHonorifics('Jane Doe', undefined, undefined)).toBe('Jane Doe');
  });
});
