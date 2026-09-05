import { describe, expect, it } from 'vitest';
import { resolveAgentRef } from './agent-ref.js';

describe('resolveAgentRef', () => {
  it('returns the nested agentRef when it carries a name (agentRef wins)', () => {
    const out = resolveAgentRef(
      { name: 'Spryker', did: 'did:plc:new', entityRef: 'https://sifa.id/company/A' },
      { name: 'Old Co', did: 'did:plc:old', entityRef: 'https://sifa.id/company/B' },
    );
    expect(out).toEqual({
      name: 'Spryker',
      did: 'did:plc:new',
      entityRef: 'https://sifa.id/company/A',
    });
  });

  it('falls back to the flat legacy fields when there is no nested agentRef', () => {
    const out = resolveAgentRef(undefined, {
      name: 'Spryker Systems GmbH',
      did: null,
      entityRef: 'http://www.wikidata.org/entity/Q123',
    });
    expect(out).toEqual({
      name: 'Spryker Systems GmbH',
      entityRef: 'http://www.wikidata.org/entity/Q123',
    });
  });

  it('drops empty/absent anchors so the result has no null did/entityRef', () => {
    expect(resolveAgentRef(undefined, { name: 'X' })).toEqual({ name: 'X' });
    expect(resolveAgentRef({ name: 'X', did: '', entityRef: undefined }, null)).toEqual({
      name: 'X',
    });
  });

  it('returns undefined when neither side carries a name (nothing to reference)', () => {
    expect(resolveAgentRef(undefined, undefined)).toBeUndefined();
    expect(resolveAgentRef(undefined, { name: '', did: 'did:plc:x' })).toBeUndefined();
    expect(resolveAgentRef({ name: '' }, {})).toBeUndefined();
  });
});
