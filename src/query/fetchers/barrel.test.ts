import { describe, expect, it } from 'vitest';

import * as Fetchers from './index.js';

describe('@singi-labs/sifa-sdk/query/fetchers barrel', () => {
  it('re-exports the foundation helpers (apiFetch, apiWrite, apiWriteCreate)', () => {
    expect(typeof Fetchers.apiFetch).toBe('function');
    expect(typeof Fetchers.apiWrite).toBe('function');
    expect(typeof Fetchers.apiWriteCreate).toBe('function');
  });

  it('re-exports a representative sample of fetchers across domains', () => {
    expect(typeof Fetchers.fetchProfile).toBe('function');
    expect(typeof Fetchers.fetchStats).toBe('function');
    expect(typeof Fetchers.fetchRoadmapVotes).toBe('function');
    expect(typeof Fetchers.fetchActivityFeed).toBe('function');
    expect(typeof Fetchers.fetchAppsRegistry).toBe('function');
    expect(typeof Fetchers.fetchReactionStatus).toBe('function');
    expect(typeof Fetchers.getMutuals).toBe('function');
    expect(typeof Fetchers.getBlueskySuggestions).toBe('function');
    expect(typeof Fetchers.listFeatureAllowlist).toBe('function');
    expect(typeof Fetchers.addFeatureAllowlist).toBe('function');
    expect(typeof Fetchers.removeFeatureAllowlist).toBe('function');
  });

  it('re-exports a representative sample of mutation fetchers', () => {
    expect(typeof Fetchers.createPosition).toBe('function');
    expect(typeof Fetchers.updateProfileSelf).toBe('function');
    expect(typeof Fetchers.castRoadmapVote).toBe('function');
    expect(typeof Fetchers.deleteAccount).toBe('function');
  });

  it('re-exports the query-key factory', () => {
    expect(typeof Fetchers.sifaQueryKeys.all).toBe('function');
    expect(Fetchers.sifaQueryKeys.all()).toEqual(['sifa']);
  });

  it('does NOT re-export any React hooks or the Provider', () => {
    const exported = Fetchers as Record<string, unknown>;
    // Spot-check the React-only surface stays out
    expect(exported.SifaProvider).toBeUndefined();
    expect(exported.useSifaConfig).toBeUndefined();
    expect(exported.useProfile).toBeUndefined();
    expect(exported.useCastRoadmapVote).toBeUndefined();
    expect(exported.useCreatePosition).toBeUndefined();
  });
});
