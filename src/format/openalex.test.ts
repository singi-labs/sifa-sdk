import { describe, expect, it } from 'vitest';

import { openAlexWorkUrl } from './openalex.js';

describe('openAlexWorkUrl', () => {
  it('builds the openalex.org page for a work id', () => {
    expect(openAlexWorkUrl('W2741809807')).toBe('https://openalex.org/W2741809807');
  });

  it('accepts the full OpenAlex id URL the API returns', () => {
    expect(openAlexWorkUrl('https://openalex.org/W2741809807')).toBe(
      'https://openalex.org/W2741809807',
    );
  });

  it('returns undefined for anything that is not a work id', () => {
    expect(openAlexWorkUrl(undefined)).toBeUndefined();
    expect(openAlexWorkUrl('')).toBeUndefined();
    expect(openAlexWorkUrl('A123')).toBeUndefined();
    expect(openAlexWorkUrl('W12/../evil')).toBeUndefined();
    expect(openAlexWorkUrl('javascript:alert(1)')).toBeUndefined();
  });
});
