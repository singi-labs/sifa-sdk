import { describe, expect, it } from 'vitest';

import { formatNameWithHonorifics } from './pds-utils.js';

describe('formatNameWithHonorifics', () => {
  it('puts the prefix before and the suffix after, separated by spaces', () => {
    expect(formatNameWithHonorifics('Jane Doe', 'Dr.', 'PhD')).toBe('Dr. Jane Doe PhD');
    expect(formatNameWithHonorifics('John Smith', undefined, 'OBE')).toBe('John Smith OBE');
  });

  it('keeps a comma the user typed at the start of the suffix', () => {
    expect(formatNameWithHonorifics('Jane Doe', undefined, ', PhD')).toBe('Jane Doe, PhD');
    expect(formatNameWithHonorifics('Jane Doe', undefined, ',PhD')).toBe('Jane Doe,PhD');
  });

  it('trims and ignores blank honorifics', () => {
    expect(formatNameWithHonorifics('Jane Doe', '  ', ' PhD ')).toBe('Jane Doe PhD');
    expect(formatNameWithHonorifics('Jane Doe', undefined, undefined)).toBe('Jane Doe');
  });

  it('does not repeat honorifics the name already carries', () => {
    expect(formatNameWithHonorifics('Dr. Jane Doe', 'Dr.', 'PhD')).toBe('Dr. Jane Doe PhD');
    expect(formatNameWithHonorifics('dr. Jane Doe', 'Dr.', undefined)).toBe('dr. Jane Doe');
    expect(formatNameWithHonorifics('Jane Doe PhD', 'Dr.', 'PhD')).toBe('Dr. Jane Doe PhD');
    expect(formatNameWithHonorifics('Jane Doe, PhD', undefined, ', PhD')).toBe('Jane Doe, PhD');
    expect(formatNameWithHonorifics('Jane Doe, PhD', undefined, 'PhD')).toBe('Jane Doe, PhD');
  });

  it('only matches whole words, so a name that merely starts alike still gets the title', () => {
    expect(formatNameWithHonorifics('Drake Bell', 'Dr', undefined)).toBe('Dr Drake Bell');
    expect(formatNameWithHonorifics('Joe Bloggs', undefined, 'Gs')).toBe('Joe Bloggs Gs');
  });
});
