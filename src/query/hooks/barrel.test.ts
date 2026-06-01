// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import * as Hooks from './index.js';

describe('@singi-labs/sifa-sdk/query/hooks barrel', () => {
  it('re-exports the Provider + config hook', () => {
    expect(typeof Hooks.SifaProvider).toBe('function');
    expect(typeof Hooks.useSifaConfig).toBe('function');
  });

  it('re-exports a representative sample of hooks across domains', () => {
    expect(typeof Hooks.useProfile).toBe('function');
    expect(typeof Hooks.useFollow).toBe('function');
    expect(typeof Hooks.useUnfollow).toBe('function');
    expect(typeof Hooks.useFollowers).toBe('function');
    expect(typeof Hooks.useFollowingList).toBe('function');
    expect(typeof Hooks.useFollowingFeed).toBe('function');
    expect(typeof Hooks.useActivityFeed).toBe('function');
    expect(typeof Hooks.useStats).toBe('function');
  });

  it('re-exports the query-key factory', () => {
    expect(typeof Hooks.sifaQueryKeys.follow.all).toBe('function');
    expect(Hooks.sifaQueryKeys.follow.feed({})).toEqual(['sifa', 'follow', 'feed', {}]);
  });
});
