import { describe, expect, it } from 'vitest';

import { SIFA_SDK_VERSION } from './index.js';

describe('SIFA_SDK_VERSION', () => {
  it('exports the current package version', () => {
    expect(SIFA_SDK_VERSION).toBe('0.0.1');
  });

  it('is a frozen string literal', () => {
    expect(typeof SIFA_SDK_VERSION).toBe('string');
  });
});
