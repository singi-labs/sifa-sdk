import { describe, expect, it } from 'vitest';

import { sifaQueryKeys } from './keys.js';

describe('sifaQueryKeys', () => {
  it('roots everything under "sifa"', () => {
    expect(sifaQueryKeys.all()).toEqual(['sifa']);
    expect(sifaQueryKeys.profile.all()).toEqual(['sifa', 'profile']);
    expect(sifaQueryKeys.profile.byHandle('alice')).toEqual(['sifa', 'profile', 'alice']);
    expect(sifaQueryKeys.position.all()).toEqual(['sifa', 'position']);
    expect(sifaQueryKeys.position.byOwner('did:plc:x')).toEqual([
      'sifa',
      'position',
      'by-owner',
      'did:plc:x',
    ]);
  });

  it('produces stable references for equal inputs (same shape)', () => {
    const a = sifaQueryKeys.profile.byHandle('alice');
    const b = sifaQueryKeys.profile.byHandle('alice');
    // Different array instances but shallow-equal contents
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it('keys are nestable for hierarchical invalidation', () => {
    // sifa.profile.all() should be a prefix of sifa.profile.byHandle('x')
    const all = sifaQueryKeys.profile.all();
    const one = sifaQueryKeys.profile.byHandle('x');
    expect(one.slice(0, all.length)).toEqual(all);
  });

  it('exposes follow mutuals + bluesky-suggestions keys under follow.*', () => {
    expect(sifaQueryKeys.follow.mutuals('alice')).toEqual(['sifa', 'follow', 'mutuals', 'alice']);
    expect(sifaQueryKeys.follow.blueskySuggestions()).toEqual([
      'sifa',
      'follow',
      'bluesky-suggestions',
    ]);
    // Mutuals key nests under follow.all() for hierarchical invalidation.
    const all = sifaQueryKeys.follow.all();
    const one = sifaQueryKeys.follow.mutuals('alice');
    expect(one.slice(0, all.length)).toEqual(all);
  });

  it('exposes the inbox, unlinked-position and profile-completeness keys', () => {
    expect(sifaQueryKeys.inbox.counts()).toEqual(['sifa', 'inbox', 'counts']);
    expect(sifaQueryKeys.position.unlinked()).toEqual(['sifa', 'position', 'unlinked']);
    expect(sifaQueryKeys.profile.completeness()).toEqual(['sifa', 'profile', 'completeness']);
    // inbox.counts() nests under inbox.all() for hierarchical invalidation.
    const all = sifaQueryKeys.inbox.all();
    expect(sifaQueryKeys.inbox.counts().slice(0, all.length)).toEqual(all);
  });

  it('exposes admin feature-allowlist key under admin.*', () => {
    expect(sifaQueryKeys.admin.featureAllowlist('FEED_V5_ENABLED')).toEqual([
      'sifa',
      'admin',
      'feature-allowlist',
      'FEED_V5_ENABLED',
    ]);
  });
});
