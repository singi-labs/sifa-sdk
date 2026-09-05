import { describe, expect, it } from 'vitest';
import { actorShowsIdentity } from './actor-identity.js';

describe('actorShowsIdentity', () => {
  it('shows identity for a confirmed person', () => {
    expect(actorShowsIdentity({ confirmed: true, claimed: false })).toBe(true);
  });

  it('shows identity for an unconfirmed person with a claimed Sifa account', () => {
    expect(actorShowsIdentity({ confirmed: false, claimed: true })).toBe(true);
  });

  it('hides identity for an unconfirmed person who has not claimed a Sifa account', () => {
    expect(actorShowsIdentity({ confirmed: false, claimed: false })).toBe(false);
  });

  it('hides identity when neither flag is present', () => {
    expect(actorShowsIdentity({})).toBe(false);
  });

  it('shows identity when both flags are set', () => {
    expect(actorShowsIdentity({ confirmed: true, claimed: true })).toBe(true);
  });
});
