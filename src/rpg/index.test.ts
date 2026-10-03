import { describe, expect, it } from 'vitest';

import * as Rpg from './index.js';

describe('@singi-labs/sifa-sdk/rpg barrel', () => {
  it('re-exports the catalog and unlock evaluation', () => {
    expect(Array.isArray(Rpg.RPG_ITEMS)).toBe(true);
    expect(typeof Rpg.RpgItemSchema.parse).toBe('function');
    expect(typeof Rpg.RpgUnlockSchema.parse).toBe('function');
    expect(typeof Rpg.evaluateRpgUnlocks).toBe('function');
  });

  it('names the profile.self avatarSource value for the rpg.actor character', () => {
    expect(Rpg.RPG_AVATAR_SOURCE).toBe('actor.rpg.sprite');
  });
});
