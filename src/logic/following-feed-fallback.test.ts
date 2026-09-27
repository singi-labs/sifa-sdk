import { describe, expect, it } from 'vitest';

import { followingFeedFallbackApp } from './following-feed-fallback.js';

const apps = [
  { id: 'tangled', count: 3 },
  { id: 'grain', count: 9 },
  { id: 'bookhive', count: 1 },
];

describe('followingFeedFallbackApp', () => {
  it('picks the busiest app when the default feed is empty', () => {
    expect(followingFeedFallbackApp({ items: [], apps })).toBe('grain');
  });

  it('keeps the default feed when it has items', () => {
    expect(followingFeedFallbackApp({ items: [{}], apps })).toBeNull();
  });

  it('has nothing to fall back to without active apps', () => {
    expect(followingFeedFallbackApp({ items: [], apps: [] })).toBeNull();
    expect(followingFeedFallbackApp({ items: [] })).toBeNull();
  });

  it('has nothing to fall back to without a response', () => {
    expect(followingFeedFallbackApp(null)).toBeNull();
  });

  it('keeps the first of equally busy apps (the server orders them)', () => {
    expect(
      followingFeedFallbackApp({
        items: [],
        apps: [
          { id: 'a', count: 2 },
          { id: 'b', count: 2 },
        ],
      }),
    ).toBe('a');
  });
});
