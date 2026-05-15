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
});
